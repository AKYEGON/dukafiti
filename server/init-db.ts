import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { db } from './db';
import {
  products,
  customers,
  users,
  userSettings;
} from '../shared/schema';

export async function initializeDatabase() {
  try {
    // Create tables using raw SQL since Drizzle migrations aren't working
    const sqlite = new Database('./database.sqlite');

    // Create users table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        phone TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      );
    `);

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
      );
    `);

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
      );
    `);

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
      );
    `);

    // Create order_items table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL
      );
    `);

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
      );
    `);

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
      );
    `);

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
      );
    `);

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
      );
    `);

    sqlite.close();
    // Check if we need to create initial data
    const existingUsers = await db.select().from(users).limit(1);

    if (existingUsers.length === 0) {
      // Create default user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const defaultUser = await db.insert(users).values({
        username: 'admin',
        email: 'admin@dukasmart.com',
        passwordHash: hashedPassword,
        phone: '+254700000000'
      }).returning().get();

      // Create sample products
      const sampleProducts = [
        {
          name: 'Rice 2kg',
          sku: 'RICE-2KG',
          description: 'Premium quality rice',
          price: 150.00,
          stock: 50,
          category: 'Grains',
          lowStockThreshold: 10
        },
        {
          name: 'Cooking Oil 1L',
          sku: 'OIL-1L',
          description: 'Pure vegetable cooking oil',
          price: 120.00,
          stock: 30,
          category: 'Cooking',
          lowStockThreshold: 5
        },
        {
          name: 'Sugar 1kg',
          sku: 'SUGAR-1KG',
          description: 'White refined sugar',
          price: 80.00,
          stock: 25,
          category: 'Baking',
          lowStockThreshold: 8
        }
      ];

      for (const product of sampleProducts) {
        await db.insert(products).values(product);
      }

      // Create sample customers
      const sampleCustomers = [
        {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+254700123456',
          address: '123 Main St, Nairobi',
          balance: 0.00
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+254700654321',
          address: '456 Oak Ave, Mombasa',
          balance: 50.00
        }
      ];

      for (const customer of sampleCustomers) {
        await db.insert(customers).values(customer);
      }

      // Create user settings for the default user
      await db.insert(userSettings).values({
        userId: defaultUser.id,
        theme: 'light',
        currency: 'KES',
        language: 'en',
        notifications: true
      });

      }

    } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}