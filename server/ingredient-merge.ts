import type { Express } from "express";
import { createHash } from "node:crypto";
import { pool } from "./db";
import { requireAuth, requireAdmin } from "./auth";
import { z } from "zod";
import { buildIngredientMergePlan, type IngredientRow } from "./ingredient-merge-plan";

const duplicateSql = `
  SELECT i.* FROM ingredients i
  WHERE lower(trim(i.name)) IN (
    SELECT lower(trim(name)) FROM ingredients GROUP BY lower(trim(name)) HAVING count(*) > 1
  ) ORDER BY i.id`;

async function bulkPreview(client: { query: (...args: any[]) => Promise<any> }, lock = false) {
  const { rows } = await client.query(duplicateSql + (lock ? " FOR UPDATE OF i" : ""));
  const plan = buildIngredientMergePlan(rows as IngredientRow[]);
  const sourceIds = plan.groups.flatMap(group => group.sourceIds);
  const counts = await client.query(`
    SELECT (SELECT count(*)::int FROM recipe_ingredients WHERE ingredient_id=ANY($1::varchar[])) AS recipes,
           (SELECT count(*)::int FROM inventory_logs WHERE ingredient_id=ANY($1::varchar[])) AS logs
  `, [sourceIds]);
  return { ...plan, recipeLinks: counts.rows[0].recipes, inventoryLinks: counts.rows[0].logs };
}

const version = (row: Record<string, unknown>) =>
  createHash("sha256").update(JSON.stringify(Object.entries(row).sort(([a], [b]) => a.localeCompare(b)))).digest("hex");

export function registerIngredientMergeRoutes(app: Express) {
  app.get("/api/admin/ingredient-merge-preview", requireAuth, requireAdmin, async (_req, res) => {
    try {
      res.json(await bulkPreview(pool));
    } catch {
      res.status(500).json({ message: "Nie udało się przygotować podsumowania / Could not prepare preview" });
    }
  });

  app.post("/api/admin/ingredient-merge-identical", requireAuth, requireAdmin, async (req, res) => {
    const input = z.object({ version: z.string().length(64), confirmed: z.literal(true) }).safeParse(req.body);
    if (!input.success) return res.status(400).json({ message: "Potwierdź scalenie / Confirm merge" });
    let client;
    try {
      client = await pool.connect();
      await client.query("BEGIN");
      await client.query("SET LOCAL lock_timeout = '5s'");
      // Serialize catalog writes while rebuilding the plan, including new duplicates.
      await client.query("LOCK TABLE ingredients IN SHARE ROW EXCLUSIVE MODE");
      const plan = await bulkPreview(client, true);
      if (!plan.removedCount || plan.version !== input.data.version) {
        await client.query("ROLLBACK");
        return res.status(409).json({ message: "Dane zmieniły się. Odśwież podsumowanie / Data changed. Refresh preview" });
      }
      let recipeLinks = 0;
      let inventoryLinks = 0;
      for (const group of plan.groups) {
        const recipes = await client.query("UPDATE recipe_ingredients SET ingredient_id=$1 WHERE ingredient_id=ANY($2::varchar[])", [group.targetId, group.sourceIds]);
        const logs = await client.query("UPDATE inventory_logs SET ingredient_id=$1 WHERE ingredient_id=ANY($2::varchar[])", [group.targetId, group.sourceIds]);
        recipeLinks += recipes.rowCount ?? 0;
        inventoryLinks += logs.rowCount ?? 0;
        await client.query("DELETE FROM ingredients WHERE id=ANY($1::varchar[])", [group.sourceIds]);
      }
      await client.query("COMMIT");
      res.json({ removedCount: plan.removedCount, recipeLinks, inventoryLinks });
    } catch (error) {
      if (client) await client.query("ROLLBACK");
      console.error("[ingredient-merge-identical] rolled back", (error as { code?: string }).code);
      res.status(409).json({ message: "Nie scalono. Dane pozostały bez zmian. Odśwież podsumowanie / Merge failed. No changes saved. Refresh preview" });
    } finally {
      client?.release();
    }
  });

  app.get("/api/admin/ingredient-duplicates", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const result = await pool.query(`
        SELECT i.* FROM ingredients i
        WHERE lower(trim(i.name)) IN (
          SELECT lower(trim(name)) FROM ingredients GROUP BY lower(trim(name)) HAVING count(*) > 1
        ) ORDER BY lower(trim(i.name)), i.created_at, i.id
      `);
      res.json(result.rows.map((row: Record<string, unknown>) => ({ ...row, version: version(row) })));
    } catch {
      res.status(500).json({ message: "Nie udało się odczytać duplikatów / Could not load duplicates" });
    }
  });

  app.post("/api/admin/ingredient-merge", requireAuth, requireAdmin, async (req, res) => {
    const input = z.object({
      sourceId: z.string().uuid(), targetId: z.string().uuid(),
      sourceVersion: z.string().length(64), targetVersion: z.string().length(64),
    }).safeParse(req.body);
    if (!input.success || input.data.sourceId === input.data.targetId) {
      return res.status(400).json({ message: "Nieprawidłowa para składników / Invalid pair" });
    }
    const { sourceId, targetId, sourceVersion, targetVersion } = input.data;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL lock_timeout = '5s'");
      // Lock both records in stable order. FK checks serialize concurrent inserts
      // into recipes/logs, so no references can escape the transaction.
      const { rows } = await client.query(
        "SELECT * FROM ingredients WHERE id = ANY($1::varchar[]) ORDER BY id FOR UPDATE",
        [[sourceId, targetId]],
      );
      const source = rows.find((r: any) => r.id === sourceId);
      const target = rows.find((r: any) => r.id === targetId);
      if (!source || !target || version(source) !== sourceVersion || version(target) !== targetVersion) {
        await client.query("ROLLBACK");
        return res.status(409).json({ message: "Dane zmieniły się. Odśwież listę / Data changed. Refresh the list" });
      }
      if (source.name.trim().toLowerCase() !== target.name.trim().toLowerCase() || source.unit !== target.unit) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Nazwa i jednostka muszą być zgodne / Name and unit must match" });
      }
      const recipes = await client.query("UPDATE recipe_ingredients SET ingredient_id=$1 WHERE ingredient_id=$2", [targetId, sourceId]);
      const logs = await client.query("UPDATE inventory_logs SET ingredient_id=$1 WHERE ingredient_id=$2", [targetId, sourceId]);
      // Preserve recipe row IDs, quantities, units and completion checklists.
      // Keep ALL target metadata and stock unchanged; never sum cloned stock.
      await client.query("DELETE FROM ingredients WHERE id=$1", [sourceId]);
      await client.query("COMMIT");
      res.json({ recipeLinks: recipes.rowCount, inventoryLinks: logs.rowCount });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("[ingredient-merge] transaction rolled back", (error as { code?: string }).code);
      res.status(409).json({ message: "Nie scalono. Dane pozostały bez zmian. Odśwież listę / Merge failed. No changes saved. Refresh the list" });
    } finally {
      client.release();
    }
  });
}
