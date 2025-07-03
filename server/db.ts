import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const DATABASE_URL = process.env.DATABASE_URL!;

export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});
export const db = drizzle(pool, { schema });