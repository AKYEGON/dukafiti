import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

const DATABASE_URL = process.env.SUPABASE_DATABASE_URL || 'postgresql://postgres:alvinkibet@db.kwdzbssuovwemthmiuht.supabase.co:5432/postgres';

const sql = postgres(DATABASE_URL, { ssl: 'require' });
export const db = drizzle(sql, { schema });