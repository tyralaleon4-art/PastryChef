import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { Pool as PgPool } from 'pg';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Check if we're using an external database (Render) or Neon (Replit)
const isExternalDatabase = process.env.DATABASE_URL.includes('render.com') || 
                           process.env.DATABASE_URL.includes('railway.app') ||
                           !process.env.DATABASE_URL.includes('neon.tech');

let db;
let pool;

if (isExternalDatabase) {
  // Use standard PostgreSQL driver for external databases (Render, Railway, etc.)
  pool = new PgPool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Required for Render
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  
  pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
  });
  
  db = drizzlePg({ client: pool, schema });
} else {
  // Use Neon serverless driver for Replit
  neonConfig.webSocketConstructor = ws;
  
  pool = new NeonPool({ 
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  
  pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
  });
  
  db = drizzleNeon({ client: pool, schema });
}

export { db, pool };