import { createHash } from "node:crypto";

export type IngredientRow = Record<string, unknown> & { id: string; name: string };

function stable(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, stable(item)]));
  }
  return value;
}

export const ingredientVersion = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");

// Ignore only identity/audit fields. Unknown future business fields must match too.
export function identicalIngredientKey(row: IngredientRow) {
  const data = Object.fromEntries(Object.entries(row).filter(([key]) => !["id", "user_id", "created_at", "version"].includes(key)));
  data.name = row.name.trim().toLowerCase();
  if (Array.isArray(data.allergens)) data.allergens = [...data.allergens].sort();
  return ingredientVersion(data);
}

export function buildIngredientMergePlan(rows: IngredientRow[]) {
  const buckets = new Map<string, IngredientRow[]>();
  for (const row of rows) {
    const key = identicalIngredientKey(row);
    const bucket = buckets.get(key) ?? [];
    bucket.push(row);
    buckets.set(key, bucket);
  }
  const groups = Array.from(buckets.values()).filter(group => group.length > 1).map(group => {
    group.sort((a, b) => String(a.created_at instanceof Date ? a.created_at.toISOString() : a.created_at ?? "").localeCompare(
      String(b.created_at instanceof Date ? b.created_at.toISOString() : b.created_at ?? "")) || a.id.localeCompare(b.id));
    return { name: group[0].name, targetId: group[0].id, sourceIds: group.slice(1).map(row => row.id) };
  }).sort((a, b) => a.targetId.localeCompare(b.targetId));
  const involved = new Set(groups.flatMap(group => [group.targetId, ...group.sourceIds]));
  const removed = new Set(groups.flatMap(group => group.sourceIds));
  const remaining = rows.filter(row => !removed.has(row.id));
  const counts = new Map<string, number>();
  for (const row of remaining) {
    const name = row.name.trim().toLowerCase();
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return {
    groups,
    removedCount: removed.size,
    manualIds: remaining.filter(row => (counts.get(row.name.trim().toLowerCase()) ?? 0) > 1).map(row => row.id),
    version: ingredientVersion(rows.filter(row => involved.has(row.id)).sort((a, b) => a.id.localeCompare(b.id))),
  };
}
