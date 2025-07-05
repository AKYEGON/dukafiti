import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
const sqlite = new Database('./database.sqlite')
const db = drizzle(sqlite)
try {
  migrate(db, { migrationsFolder: './drizzle' })
  } catch (error) {
  console.error('Migration failed:', error)
  process.exit(1)
}