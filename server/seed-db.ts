import { db } from './db';
import bcrypt from 'bcryptjs';
import {
  products,
  customers,
  users,
  userSettings,
  notifications,
  storeProfiles;
} from '../shared/schema';
;
export async function seedDatabase() {
  try {
    // Check if we need to create initial data;
    const existingUsers  =  await db.select().from(users).limit(1);
;
    if (existingUsers.length  ===  0) {
      // Create default user;
      const hashedPassword  =  await bcrypt.hash('password', 10);
      const [defaultUser]  =  await db.insert(users).values({
        username: 'test',
        email: 'test@example.com',
        passwordHash: hashedPassword,
        phone: '+254700000000'
      }).returning();

      // Create sample products;
      const sampleProducts  =  [
        {
          name: 'Rice 2kg',
          sku: 'RICE-2KG',
          description: 'Premium quality rice',
          price: '150.00',
          stock: 50,
          category: 'Grains',
          lowStockThreshold: 10
        },
        {
          name: 'Cooking Oil 1L',
          sku: 'OIL-1L',
          description: 'Pure vegetable cooking oil',
          price: '120.00',
          stock: 30,
          category: 'Cooking',
          lowStockThreshold: 5
        },
        {
          name: 'Sugar 1kg',
          sku: 'SUGAR-1KG',
          description: 'White refined sugar',
          price: '80.00',
          stock: 25,
          category: 'Baking',
          lowStockThreshold: 8
        },
        {
          name: 'Bread Loaf',
          sku: 'BREAD-LOAF',
          description: 'Fresh white bread',
          price: '45.00',
          stock: 20,
          category: 'Bakery',
          lowStockThreshold: 5
        },
        {
          name: 'Milk 1L',
          sku: 'MILK-1L',
          description: 'Fresh whole milk',
          price: '60.00',
          stock: 15,
          category: 'Dairy',
          lowStockThreshold: 10
        },
        {
          name: 'Eggs (12 pcs)',
          sku: 'EGGS-12',
          description: 'Fresh chicken eggs',
          price: '180.00',
          stock: 40,
          category: 'Dairy',
          lowStockThreshold: 15
        }
      ];
;
      for (const product of sampleProducts) {
        await db.insert(products).values(product);
      }

      // Create sample customers;
      const sampleCustomers  =  [
        {
          name: 'Mary Wanjiku',
          email: 'mary@example.com',
          phone: '+254700123456',
          address: '123 Main St, Nairobi',
          balance: '0.00'
        },
        {
          name: 'John Kamau',
          email: 'john@example.com',
          phone: '+254700654321',
          address: '456 Oak Ave, Mombasa',
          balance: '150.00'
        },
        {
          name: 'Grace Achieng',
          email: 'grace@example.com',
          phone: '+254700987654',
          address: '789 Pine Rd, Kisumu',
          balance: '75.00'
        }
      ];
;
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

      // Create sample store profile
      await db.insert(storeProfiles).values({
        userId: defaultUser.id,
        storeName: 'DukaFiti Demo Store',
        ownerName: 'Test Owner',
        storeType: 'retail',
        location: 'Nairobi, Kenya',
        description: 'A demo store for testing DukaFiti features'
      });

      // Create sample notifications
      await db.insert(notifications).values([
        {
          userId: defaultUser.id,
          title: 'Welcome to DukaFiti!',
          message: 'Your business management system is ready to use.',
          type: 'success',
          isRead: false
        },
        {
          userId: defaultUser.id,
          title: 'Low Stock Alert',
          message: 'Some products are running low on stock.',
          type: 'warning',
          isRead: false
        }
      ]);

      }

    } catch (error) {
    console.error('Database seeding error:', error);
    throw error;
  }
}