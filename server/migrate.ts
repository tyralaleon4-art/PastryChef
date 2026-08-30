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
        UNION ALL SELECT 1 FROM ingredients WHERE user_id IS NULL
        UNION ALL SELECT 1 FROM ingredient_categories WHERE user_id IS NULL
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

    // ── 5a. Rozdziel dawną wspólną bazę składników ─────────────────────────
    // Tabele map są celowo trwałe: sprawiają, że ponowne uruchomienie migracji
    // nie kopiuje drugi raz tych samych rekordów.
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS legacy_ingredient_category_ownership (
        source_id varchar NOT NULL,
        user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        target_id varchar NOT NULL REFERENCES ingredient_categories(id) ON DELETE CASCADE,
        PRIMARY KEY (source_id, user_id)
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS legacy_ingredient_ownership (
        source_id varchar NOT NULL,
        user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        target_id varchar NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
        PRIMARY KEY (source_id, user_id)
      )
    `);

    // Każdy właściciel przepisu lub logu dostaje prywatne kopie używanych
    // wcześniej wspólnych składników (oraz ich kategorii).
    await db.execute(sql`
      INSERT INTO legacy_ingredient_category_ownership (source_id, user_id, target_id)
      SELECT c.id, owners.user_id, gen_random_uuid()
      FROM ingredient_categories c
      CROSS JOIN (
        SELECT DISTINCT user_id FROM recipes WHERE user_id IS NOT NULL
        UNION
        SELECT DISTINCT user_id FROM inventory_logs WHERE user_id IS NOT NULL
      ) owners
      WHERE c.user_id IS NULL
      ON CONFLICT (source_id, user_id) DO NOTHING
    `);
    await db.execute(sql`
      INSERT INTO ingredient_categories (id, user_id, name, description, created_at)
      SELECT map.target_id, map.user_id, source.name, source.description, source.created_at
      FROM legacy_ingredient_category_ownership map
      JOIN ingredient_categories source ON source.id = map.source_id
      LEFT JOIN ingredient_categories target ON target.id = map.target_id
      WHERE target.id IS NULL
    `);
    await db.execute(sql`
      INSERT INTO legacy_ingredient_ownership (source_id, user_id, target_id)
      SELECT DISTINCT source.id, owners.user_id, gen_random_uuid()
      FROM ingredients source
      JOIN (
        SELECT r.user_id, ri.ingredient_id
        FROM recipe_ingredients ri JOIN recipes r ON r.id = ri.recipe_id
        WHERE r.user_id IS NOT NULL
        UNION
        SELECT l.user_id, l.ingredient_id FROM inventory_logs l WHERE l.user_id IS NOT NULL
      ) owners ON owners.ingredient_id = source.id
      WHERE source.user_id IS NULL
      ON CONFLICT (source_id, user_id) DO NOTHING
    `);
    await db.execute(sql`
      INSERT INTO ingredients (
        id, user_id, name, category_id, unit, cost_per_unit, current_stock, minimum_stock,
        allergens, is_vegan, is_gluten_free, is_lactose_free, density_g_per_ml,
        weight_per_piece_g, calories_per_100g, protein_per_100g, fat_per_100g,
        carbs_per_100g, fiber_per_100g, expiry_date, created_at, supplier
      )
      SELECT map.target_id, map.user_id, source.name, category_map.target_id, source.unit,
        source.cost_per_unit, source.current_stock, source.minimum_stock, source.allergens,
        source.is_vegan, source.is_gluten_free, source.is_lactose_free, source.density_g_per_ml,
        source.weight_per_piece_g, source.calories_per_100g, source.protein_per_100g,
        source.fat_per_100g, source.carbs_per_100g, source.fiber_per_100g,
        source.expiry_date, source.created_at, source.supplier
      FROM legacy_ingredient_ownership map
      JOIN ingredients source ON source.id = map.source_id
      LEFT JOIN legacy_ingredient_category_ownership category_map
        ON category_map.source_id = source.category_id AND category_map.user_id = map.user_id
      LEFT JOIN ingredients target ON target.id = map.target_id
      WHERE target.id IS NULL
    `);
    await db.execute(sql`
      UPDATE recipe_ingredients ri SET ingredient_id = map.target_id
      FROM recipes r, legacy_ingredient_ownership map
      WHERE ri.recipe_id = r.id
        AND map.user_id = r.user_id
        AND map.source_id = ri.ingredient_id
    `);
    await db.execute(sql`
      UPDATE inventory_logs l SET ingredient_id = map.target_id
      FROM legacy_ingredient_ownership map
      WHERE map.user_id = l.user_id AND map.source_id = l.ingredient_id
    `);
    // Nieużyte, dawne rekordy trafiają do admina zamiast pozostać widoczne
    // wszystkim. Także zapewnia to NOT NULL dla istniejącej bazy.
    if (adminId) await db.execute(sql`UPDATE ingredient_categories SET user_id = ${adminId} WHERE user_id IS NULL`);
    if (adminId) await db.execute(sql`UPDATE ingredients SET user_id = ${adminId} WHERE user_id IS NULL`);
    console.log("✓ Wspólne składniki skopiowane do właścicieli i przepięte");

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
    await db.execute(sql`ALTER TABLE ingredients            ALTER COLUMN user_id SET NOT NULL`);
    await db.execute(sql`ALTER TABLE ingredient_categories  ALTER COLUMN user_id SET NOT NULL`);
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
    // Składniki i kategorie składników należą do użytkownika.
    await db.execute(sql`ALTER TABLE ingredients DROP CONSTRAINT IF EXISTS ingredients_user_id_fkey`);
    await db.execute(sql`ALTER TABLE ingredient_categories DROP CONSTRAINT IF EXISTS ingredient_categories_user_id_fkey`);
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE ingredients ADD CONSTRAINT ingredients_user_id_fkey
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE ingredient_categories ADD CONSTRAINT ingredient_categories_user_id_fkey
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
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
