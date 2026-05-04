import { db, pool } from "./db";
import { users } from "@shared/schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function migrate() {
  console.log("Running migrations...");

  try {
    // Add role, display_name, created_at to users if they don't exist
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user',
      ADD COLUMN IF NOT EXISTS display_name text,
      ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now()
    `);
    console.log("✓ users table updated");

    // Add user_id to categories
    await db.execute(sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id varchar`);
    console.log("✓ categories.user_id added");

    // Add user_id to ingredient_categories
    await db.execute(sql`ALTER TABLE ingredient_categories ADD COLUMN IF NOT EXISTS user_id varchar`);
    console.log("✓ ingredient_categories.user_id added");

    // Add user_id to ingredients
    await db.execute(sql`ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS user_id varchar`);
    console.log("✓ ingredients.user_id added");

    // Add user_id to recipes
    await db.execute(sql`ALTER TABLE recipes ADD COLUMN IF NOT EXISTS user_id varchar`);
    console.log("✓ recipes.user_id added");

    // Add user_id to inventory_logs
    await db.execute(sql`ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS user_id varchar`);
    console.log("✓ inventory_logs.user_id added");

    // Add user_id to production_plans
    await db.execute(sql`ALTER TABLE production_plans ADD COLUMN IF NOT EXISTS user_id varchar`);
    console.log("✓ production_plans.user_id added");

    // Check if admin user already exists
    const existingAdmin = await db.execute(sql`SELECT id FROM users WHERE username = 'admin' LIMIT 1`);
    
    let adminId: string;
    if (existingAdmin.rows.length === 0) {
      // Create default admin user
      const hashedPassword = await bcrypt.hash("admin123", 12);
      const result = await db.execute(sql`
        INSERT INTO users (username, password, role, display_name)
        VALUES ('admin', ${hashedPassword}, 'admin', 'Administrator')
        ON CONFLICT (username) DO UPDATE SET role = 'admin'
        RETURNING id
      `);
      adminId = result.rows[0].id;
      console.log("✓ Default admin user created (username: admin, password: admin123)");
    } else {
      // Update existing admin user to have admin role
      await db.execute(sql`UPDATE users SET role = 'admin' WHERE username = 'admin'`);
      adminId = existingAdmin.rows[0].id;
      console.log("✓ Existing admin user updated");
    }

    // Assign all existing data without user_id to the admin user
    await db.execute(sql`UPDATE categories SET user_id = ${adminId} WHERE user_id IS NULL`);
    await db.execute(sql`UPDATE ingredient_categories SET user_id = ${adminId} WHERE user_id IS NULL`);
    await db.execute(sql`UPDATE ingredients SET user_id = ${adminId} WHERE user_id IS NULL`);
    await db.execute(sql`UPDATE recipes SET user_id = ${adminId} WHERE user_id IS NULL`);
    await db.execute(sql`UPDATE inventory_logs SET user_id = ${adminId} WHERE user_id IS NULL`);
    await db.execute(sql`UPDATE production_plans SET user_id = ${adminId} WHERE user_id IS NULL`);
    console.log("✓ Existing data assigned to admin user");

    // Now add NOT NULL constraints and foreign keys
    await db.execute(sql`ALTER TABLE categories ALTER COLUMN user_id SET NOT NULL`);
    await db.execute(sql`ALTER TABLE ingredient_categories ALTER COLUMN user_id SET NOT NULL`);
    await db.execute(sql`ALTER TABLE ingredients ALTER COLUMN user_id SET NOT NULL`);
    await db.execute(sql`ALTER TABLE recipes ALTER COLUMN user_id SET NOT NULL`);
    await db.execute(sql`ALTER TABLE inventory_logs ALTER COLUMN user_id SET NOT NULL`);
    await db.execute(sql`ALTER TABLE production_plans ALTER COLUMN user_id SET NOT NULL`);
    console.log("✓ NOT NULL constraints applied");

    // Add foreign key constraints (only if they don't exist)
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE categories ADD CONSTRAINT categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE ingredient_categories ADD CONSTRAINT ingredient_categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE ingredients ADD CONSTRAINT ingredients_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE recipes ADD CONSTRAINT recipes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE inventory_logs ADD CONSTRAINT inventory_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE production_plans ADD CONSTRAINT production_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    console.log("✓ Foreign key constraints added");

    // Remove unique constraint on categories.name so different users can have same category name
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_unique;
      EXCEPTION WHEN undefined_object THEN NULL;
      END $$;
    `);
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE ingredient_categories DROP CONSTRAINT IF EXISTS ingredient_categories_name_unique;
      EXCEPTION WHEN undefined_object THEN NULL;
      END $$;
    `);
    console.log("✓ Unique name constraints removed for multi-user support");

    console.log("\n✅ Migration completed successfully!");
    console.log("\nDefault admin credentials:");
    console.log("  Username: admin");
    console.log("  Password: admin123");
    console.log("\nIMPORTANT: Please change the admin password after first login!");

  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await (pool as any).end?.();
  }
}

migrate().catch(console.error);
