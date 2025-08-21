import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@shared/schema';

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set - database functionality will be limited');
  // You can set a default or mock database URL for development
  // process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/cineloop';
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });