import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";

const sqlite = new Database('./database.sqlite');
const db = drizzle(sqlite);

console.log("Running migrations...");

try {
  migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations completed successfully!");
} catch (error) {
  console.error("Migration failed:", error);
  process.exit(1);
}