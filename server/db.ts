import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Use Supabase connection but try both methods
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const databaseUrl = process.env.DATABASE_URL!;

// Create Supabase client for auth and some operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Try to use direct PostgreSQL connection, fallback to local if needed
let connectionString = databaseUrl;

// If we can't connect to Supabase directly, we'll handle it in the storage layer
export const sql = postgres(connectionString, {
  ssl: connectionString.includes('localhost') ? false : 'prefer',
  max: 10,
  onnotice: () => {} // Suppress notices
});

export const db = drizzle(sql, { schema });