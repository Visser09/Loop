
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@shared/schema';

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set - using in-memory storage');
}

// Only create database connection if DATABASE_URL is available
let db: any = null;
if (process.env.DATABASE_URL) {
  const sql = neon(process.env.DATABASE_URL);
  db = drizzle(sql, { schema });
}

export { db };
export * from '@shared/schema';
