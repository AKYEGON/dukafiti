import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Development: Use SQLite for now since DATABASE_URL is not available
const sqlite = new Database('./database.sqlite');
export const db = drizzleSqlite(sqlite, { schema });
export const pool = null; // Not used in SQLite mode