import Database from 'better-sqlite3'
const sqlite = new Database('./database.sqlite')
try {
  // Create users table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      phone TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `)
  // Create products table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      description TEXT,
      price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      category TEXT NOT NULL,
      low_stock_threshold INTEGER NOT NULL DEFAULT 10,
      sales_count INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `)
  // Create customers table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      balance REAL NOT NULL DEFAULT 0.00,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `)
  // Create orders table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      customer_name TEXT NOT NULL,
      total REAL NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'cash',
      status TEXT NOT NULL DEFAULT 'pending',
      reference TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `)
  // Create order_items table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL
    )
  `)
  // Create business_profiles table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS business_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      business_name TEXT NOT NULL,
      business_type TEXT NOT NULL,
      location TEXT,
      description TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `)
  // Create payments table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      method TEXT NOT NULL,
      reference TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `)
  // Create store_profiles table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS store_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      store_name TEXT NOT NULL,
      store_type TEXT NOT NULL,
      location TEXT,
      description TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `)
  // Create user_settings table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      theme TEXT NOT NULL DEFAULT 'light',
      currency TEXT NOT NULL DEFAULT 'KES',
      language TEXT NOT NULL DEFAULT 'en',
      notifications INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `)

  } catch (error) {
  console.error('Error creating tables:', error)
  throw error
} finally {
  sqlite.close()
}