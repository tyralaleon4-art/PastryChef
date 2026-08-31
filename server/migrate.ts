import { db, pool } from "./db";
import { sql } from "drizzle-orm";

async function migrate() {
  console.log("Running Pastry Pro migration...");

  try {
    // ── 1. Sesje (connect-pg-simple wymaga tej tabeli) ─────────────────────
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid"    varchar   NOT NULL COLLATE "default",
        "sess"   json      NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")
    `);
    console.log("✓ Tabela session gotowa");

    // ── 2. Kolumny auth w tabeli users ────────────────────────────────────
    await db.execute(sql`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS role         text      NOT NULL DEFAULT 'user',
        ADD COLUMN IF NOT EXISTS display_name text,
        ADD COLUMN IF NOT EXISTS language     text      NOT NULL DEFAULT 'pl',
        ADD COLUMN IF NOT EXISTS created_at   timestamp DEFAULT now()
    `);
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE users ADD CONSTRAINT users_language_check CHECK (language IN ('pl', 'en'));
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
    console.log("✓ Kolumny auth w users dodane");

    // ── 3. user_id w tabelach danych ─────────────────────────────────────
    await db.execute(sql`ALTER TABLE categories         ADD COLUMN IF NOT EXISTS user_id varchar`);
    await db.execute(sql`ALTER TABLE ingredient_categories ADD COLUMN IF NOT EXISTS user_id varchar`);
    await db.execute(sql`ALTER TABLE ingredients         ADD COLUMN IF NOT EXISTS user_id varchar`);
    await db.execute(sql`ALTER TABLE recipes             ADD COLUMN IF NOT EXISTS user_id varchar`);
    await db.execute(sql`ALTER TABLE inventory_logs      ADD COLUMN IF NOT EXISTS user_id varchar`);
    await db.execute(sql`ALTER TABLE production_plans    ADD COLUMN IF NOT EXISTS user_id varchar`);
    console.log("✓ Kolumny user_id dodane");

    // ── 4. Istniejący administrator ───────────────────────────────────────
    // Migracja nigdy nie tworzy konta z przewidywalnym hasłem.
    const existing = await db.execute(sql`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
    const adminId = existing.rows[0]?.id as string | undefined;
    const orphanedData = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM categories WHERE user_id IS NULL
        UNION ALL SELECT 1 FROM recipes WHERE user_id IS NULL
        UNION ALL SELECT 1 FROM inventory_logs WHERE user_id IS NULL
        UNION ALL SELECT 1 FROM production_plans WHERE user_id IS NULL
      ) AS has_orphans
    `);
    if (!adminId && orphanedData.rows[0]?.has_orphans) {
      throw new Error("Migration requires an existing admin user to own legacy orphaned data; no admin account was created.");
    }

    // ── 5. Przypisz istniejące dane do admina ────────────────────────────
    // (dane bez user_id — czyli te które już były w bazie przed migracją)
    if (adminId) await db.execute(sql`UPDATE categories           SET user_id = ${adminId} WHERE user_id IS NULL`);
    if (adminId) await db.execute(sql`UPDATE recipes              SET user_id = ${adminId} WHERE user_id IS NULL`);
    if (adminId) await db.execute(sql`UPDATE inventory_logs       SET user_id = ${adminId} WHERE user_id IS NULL`);
    if (adminId) await db.execute(sql`UPDATE production_plans     SET user_id = ${adminId} WHERE user_id IS NULL`);
    console.log("✓ Istniejące dane przypisane do admina");

    // Składniki i ich kategorie pozostają jednym wspólnym katalogiem.
    // Nie kopiujemy ich i nie przepinamy istniejących receptur ani logów.

    // ── 6. NOT NULL tylko tam gdzie trzeba ───────────────────────────────
    await db.execute(sql`ALTER TABLE categories        ALTER COLUMN user_id SET NOT NULL`);
    await db.execute(sql`ALTER TABLE recipes           ALTER COLUMN user_id SET NOT NULL`);
    // inventory_logs i production_plans — tylko jeśli wszystkie wiersze mają user_id
    await db.execute(sql`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM inventory_logs WHERE user_id IS NULL) THEN
          ALTER TABLE inventory_logs ALTER COLUMN user_id SET NOT NULL;
        END IF;
      END $$
    `);
    await db.execute(sql`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM production_plans WHERE user_id IS NULL) THEN
          ALTER TABLE production_plans ALTER COLUMN user_id SET NOT NULL;
        END IF;
      END $$
    `);
    // Składniki są wspólnym katalogiem. Twórca jest informacją audytową, więc
    // usunięcie konta nie może usunąć wspólnych pozycji.
    await db.execute(sql`ALTER TABLE ingredients            ALTER COLUMN user_id DROP NOT NULL`);
    await db.execute(sql`ALTER TABLE ingredient_categories  ALTER COLUMN user_id DROP NOT NULL`);
    console.log("✓ Ograniczenia NOT NULL ustawione");

    // ── 7. Klucze obce ───────────────────────────────────────────────────
    const fks = [
      { table: "categories",          name: "categories_user_id_fkey" },
      { table: "recipes",             name: "recipes_user_id_fkey" },
      { table: "inventory_logs",      name: "inventory_logs_user_id_fkey" },
      { table: "production_plans",    name: "production_plans_user_id_fkey" },
    ];
    for (const { table, name } of fks) {
      await db.execute(sql.raw(`
        DO $$ BEGIN
          ALTER TABLE ${table} ADD CONSTRAINT ${name}
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$
      `));
    }
    // Składniki i ich kategorie są wspólne. Po usunięciu konta zachowujemy je,
    // a jedynie czyścimy informację o twórcy.
    await db.execute(sql`ALTER TABLE ingredients DROP CONSTRAINT IF EXISTS ingredients_user_id_fkey`);
    await db.execute(sql`ALTER TABLE ingredient_categories DROP CONSTRAINT IF EXISTS ingredient_categories_user_id_fkey`);
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE ingredients ADD CONSTRAINT ingredients_user_id_fkey
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE ingredient_categories ADD CONSTRAINT ingredient_categories_user_id_fkey
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
    console.log("✓ Klucze obce dodane");

    // ── 8. Usuń ograniczenia unikalności nazw (multi-user) ───────────────
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_unique;
      EXCEPTION WHEN undefined_object THEN NULL; END $$
    `);
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE ingredient_categories DROP CONSTRAINT IF EXISTS ingredient_categories_name_unique;
      EXCEPTION WHEN undefined_object THEN NULL; END $$
    `);
    console.log("✓ Ograniczenia unikalności nazw usunięte");

    console.log("\n✅ Migracja zakończona pomyślnie!");

  } catch (error) {
    console.error("Migracja nie powiodła się:", error);
    throw error;
  } finally {
    await (pool as any).end?.();
  }
}

migrate().catch(console.error);
