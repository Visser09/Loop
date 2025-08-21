
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@shared/schema';

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set - database functionality will be limited');
  // Set a mock connection string to prevent crash
  process.env.DATABASE_URL = 'postgresql://mock:mock@localhost:5432/mock';
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
export * from '@shared/schema';
