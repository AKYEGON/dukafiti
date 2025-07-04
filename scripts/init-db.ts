import { db } from '../server/db.js';
import {
  products,
  customers,
  orders,
  orderItems,
  users,
  businessProfiles,
  payments,
  storeProfiles,
  userSettings;
} from '../shared/schema.js';
import bcrypt from 'bcryptjs';

async function initializeDatabase() {
  try {
    // Create tables - SQLite will automatically create them if they don't exist
    // We'll insert some sample data to verify everything works

    // Create a default user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const [defaultUser] = await db.insert(users).values({
      username: 'admin',
      email: 'admin@dukasmart.com',
      passwordHash: hashedPassword,
      phone: '+254700000000'
    }).returning();

    // Create some sample products
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

    } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Run the initialization
initializeDatabase().catch(console.error);