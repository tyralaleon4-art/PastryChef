import { Pool } from "pg";

/**
 * Additive runtime compatibility migration for existing Render databases.
 * It only creates missing session infrastructure and adds new columns; it
 * never drops, truncates, or rewrites application data.
 */
export async function ensureRuntimeSchema(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL must be configured");

  const isExternalDatabase = connectionString.includes("render.com")
    || connectionString.includes("railway.app")
    || !connectionString.includes("neon.tech");
  const migrationPool = new Pool({
    connectionString,
    ssl: isExternalDatabase ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await migrationPool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar(255) PRIMARY KEY,
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      )
    `);
    await migrationPool.query(`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire"
      ON "session" ("expire")
    `);
    await migrationPool.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "language" text NOT NULL DEFAULT 'pl'
    `);
    console.log("[schema] Runtime schema is ready");
  } finally {
    await migrationPool.end();
  }
}