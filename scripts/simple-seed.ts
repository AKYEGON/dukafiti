import { db } from '../server/db'
import { users, products, customers, storeProfiles, userSettings, notifications } from '../shared/schema'
async function seedDatabase() {
  try {
    // Insert test user
    const [user] = await db.insert(users).values({
      email: 'test@example.com',
      username: 'test',
      passwordHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      phone: '+254700000000'
    }).returning()
    // Insert store profile
    await db.insert(storeProfiles).values({
      userId: user.id,
      storeName: 'DukaFiti Demo Store',
      ownerName: 'Test User',
      storeType: 'retail',
      location: 'Nairobi, Kenya',
      description: 'A sample retail store'
    })
    // Insert user settings
    await db.insert(userSettings).values({
      userId: user.id,
      theme: 'light',
      currency: 'KES',
      language: 'en',
      notifications: true,
      mpesaEnabled: false
    })
    // Insert sample products
    const sampleProducts = [
      {
        name: 'Coca Cola 500ml',
        sku: 'CC500',
        description: 'Refreshing soft drink',
        price: '50.00',
        stock: 100,
        category: 'Beverages',
        lowStockThreshold: 10,
        salesCount: 45
      },
      {
        name: 'Bread Loaf',
        sku: 'BL001',
        description: 'Fresh white bread',
        price: '60.00',
        stock: 50,
        category: 'Bakery',
        lowStockThreshold: 5,
        salesCount: 30
      },
      {
        name: 'Milk 1L',
        sku: 'MK1L',
        description: 'Fresh dairy milk',
        price: '80.00',
        stock: 25,
        category: 'Dairy',
        lowStockThreshold: 10,
        salesCount: 20
      },
      {
        name: 'Sugar 2kg',
        sku: 'SG2K',
        description: 'White granulated sugar',
        price: '150.00',
        stock: null, // Unknown quantity
        category: 'Groceries',
        lowStockThreshold: 5,
        salesCount: 15
      },
      {
        name: 'Rice 5kg',
        sku: 'RC5K',
        description: 'Premium basmati rice',
        price: '450.00',
        stock: 30,
        category: 'Groceries',
        lowStockThreshold: 5,
        salesCount: 25
      }
    ]
    await db.insert(products).values(sampleProducts)
    // Insert sample customers
    const sampleCustomers = [
      {
        name: 'Mary Wanjiku',
        email: 'mary@example.com',
        phone: '+254701234567',
        address: 'Nairobi, Kenya',
        balance: '150.00'
      },
      {
        name: 'John Kamau',
        email: 'john@example.com',
        phone: '+254702345678',
        address: 'Mombasa, Kenya',
        balance: '0.00'
      },
      {
        name: 'Grace Akinyi',
        email: 'grace@example.com',
        phone: '+254703456789',
        address: 'Kisumu, Kenya',
        balance: '75.50'
      }
    ]
    await db.insert(customers).values(sampleCustomers)
    // Insert sample notifications
    const sampleNotifications = [
      {
        userId: user.id,
        title: 'Welcome to DukaFiti!',
        message: 'Your business management system is ready to use.',
        type: 'success',
        isRead: false
      },
      {
        userId: user.id,
        title: 'Low Stock Alert',
        message: 'Some products are running low on stock.',
        type: 'warning',
        isRead: false
      }
    ]
    await db.insert(notifications).values(sampleNotifications)
    } catch (error) {
    console.error('Error seeding database:', error)
  }
}

seedDatabase().then(() => {
  process.exit(0)
});