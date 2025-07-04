#!/usr/bin/env node
import { supabaseDb } from './supabase-db.js'
async function seedSupabaseDatabase() {
  try {
    // Create test user first
    const testUser = {
      email: 'admin@dukafiti.com',
      password: 'password123',
      username: 'admin',
      phone: '+254700000000'
    }

    let userId = 1
    try {
      const user = await supabaseDb.createUser(testUser)
      userId = user.id
      } catch (error) {
      }

    // Create sample products
    const sampleProducts = [
      {
        name: 'Coca Cola 500ml',
        sku: 'CC-500',
        description: 'Refreshing cola drink',
        price: 50.00,
        stock: 100,
        category: 'Beverages',
        lowStockThreshold: 10,
        salesCount: 25
      },
      {
        name: 'Bread White',
        sku: 'BW-001',
        description: 'Fresh white bread loaf',
        price: 45.00,
        stock: 20,
        category: 'Bakery',
        lowStockThreshold: 5,
        salesCount: 18
      },
      {
        name: 'Milk 1L',
        sku: 'MK-1L',
        description: 'Fresh cow milk',
        price: 85.00,
        stock: 50,
        category: 'Dairy',
        lowStockThreshold: 10,
        salesCount: 30
      },
      {
        name: 'Rice 2kg',
        sku: 'RC-2KG',
        description: 'Premium basmati rice',
        price: 180.00,
        stock: 25,
        category: 'Grains',
        lowStockThreshold: 5,
        salesCount: 12
      },
      {
        name: 'Cooking Oil 1L',
        sku: 'OIL-1L',
        description: 'Pure cooking oil',
        price: 220.00,
        stock: 15,
        category: 'Cooking',
        lowStockThreshold: 5,
        salesCount: 8
      }
    ]

    for (const product of sampleProducts) {
      try {
        await supabaseDb.createProduct(product)
        } catch (error) {
        }
    }

    // Create sample customers
    const sampleCustomers = [
      {
        name: 'Mary Wanjiku',
        phone: '+254712345678',
        email: 'mary.wanjiku@example.com',
        balance: 150.00
      },
      {
        name: 'John Kamau',
        phone: '+254723456789',
        email: 'john.kamau@example.com',
        balance: 0.00
      },
      {
        name: 'Grace Akinyi',
        phone: '+254734567890',
        email: 'grace.akinyi@example.com',
        balance: 75.00
      }
    ]

    for (const customer of sampleCustomers) {
      try {
        await supabaseDb.createCustomer(customer)
        } catch (error) {
        }
    }

    // Create sample orders
    const products = await supabaseDb.getProducts()
    const customers = await supabaseDb.getCustomers()

    if (products.length > 0 && customers.length > 0) {
      const sampleOrders = [
        {
          items: [
            { productId: products[0].id, quantity: 2, price: products[0].price },
            { productId: products[1].id, quantity: 1, price: products[1].price }
          ],
          paymentMethod: 'cash',
          customerId: customers[0].id,
          customerName: customers[0].name,
          total: (products[0].price * 2) + products[1].price,
          status: 'completed'
        },
        {
          items: [
            { productId: products[2].id, quantity: 1, price: products[2].price }
          ],
          paymentMethod: 'credit',
          customerId: customers[1].id,
          customerName: customers[1].name,
          total: products[2].price,
          status: 'completed'
        },
        {
          items: [
            { productId: products[3].id, quantity: 1, price: products[3].price },
            { productId: products[4].id, quantity: 1, price: products[4].price }
          ],
          paymentMethod: 'mobileMoney',
          customerId: customers[2].id,
          customerName: customers[2].name,
          total: products[3].price + products[4].price,
          status: 'completed'
        }
      ]

      for (const order of sampleOrders) {
        try {
          await supabaseDb.createOrder(order)
          } catch (error) {
          }
      }
    }

    // Create sample notifications
    const sampleNotifications = [
      {
        userId: userId,
        title: 'Low Stock Alert',
        message: 'Rice 2kg is running low (5 items remaining)',
        type: 'warning',
        isRead: false
      },
      {
        userId: userId,
        title: 'Sale Completed',
        message: 'New sale of KES 145.00 completed',
        type: 'success',
        isRead: false
      },
      {
        userId: userId,
        title: 'Customer Payment',
        message: 'Mary Wanjiku made a payment of KES 100.00',
        type: 'info',
        isRead: true
      }
    ]

    for (const notification of sampleNotifications) {
      try {
        await supabaseDb.createNotification(notification)
        } catch (error) {
        }
    }

    // Create store profile
    try {
      const storeProfile = {
        userId: userId,
        storeName: 'Mama Grace Duka',
        ownerName: 'Grace Wanjiku',
        storeType: 'retail',
        location: 'Nairobi, Kenya',
        description: 'Your friendly neighborhood duka'
      }
      await supabaseDb.createStoreProfile(storeProfile)
      } catch (error) {
      }

    // Create user settings
    try {
      const userSettings = {
        userId: userId,
        theme: 'light',
        currency: 'KES',
        language: 'en',
        notifications: true,
        mpesaEnabled: true
      }
      await supabaseDb.createUserSettings(userSettings)
      } catch (error) {
      }

    } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

// Run the seeding if this file is executed directly
if (import.meta.url  ===  `file://${process.argv[1]}`) {
  seedSupabaseDatabase()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error)
      process.exit(1)
    })
}
export { seedSupabaseDatabase };