import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Set a default DATABASE_URL if not provided
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/dukasmart?sslmode=require';

export const pool = new Pool({ connectionString: DATABASE_URL });
export const db = drizzle({ client: pool, schema });