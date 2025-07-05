import { db } from './server/db'
import { orders, orderItems, products, customers } from './shared/schema'
import { eq } from 'drizzle-orm'

export async function createSampleSales() {
  try {
    // Get existing products and customers
    const existingProducts = await db.select().from(products)
    const existingCustomers = await db.select().from(customers)

    if (existingProducts.length  ===  0 || existingCustomers.length  ===  0) {
      return
    }

    // Create sample orders
    const sampleOrders = [
      {
        customerId: existingCustomers[0].id,
        customerName: existingCustomers[0].name,
        total: '350.00',
        paymentMethod: 'cash',
        status: 'completed',
        items: [
          { productId: existingProducts[0].id, quantity: 2 }, // Rice 2kg
          { productId: existingProducts[1].id, quantity: 1 }, // Cooking Oil 1L
        ]
      },
      {
        customerId: existingCustomers[1].id,
        customerName: existingCustomers[1].name,
        total: '180.00',
        paymentMethod: 'mobileMoney',
        status: 'completed',
        items: [
          { productId: existingProducts[5].id, quantity: 1 }, // Eggs
        ]
      },
      {
        customerId: existingCustomers[2].id,
        customerName: existingCustomers[2].name,
        total: '525.00',
        paymentMethod: 'cash',
        status: 'completed',
        items: [
          { productId: existingProducts[0].id, quantity: 1 }, // Rice 2kg
          { productId: existingProducts[2].id, quantity: 2 }, // Sugar 1kg
          { productId: existingProducts[3].id, quantity: 3 }, // Bread Loaf
          { productId: existingProducts[4].id, quantity: 2 }, // Milk 1L
        ]
      },
      {
        customerId: existingCustomers[0].id,
        customerName: existingCustomers[0].name,
        total: '240.00',
        paymentMethod: 'cash',
        status: 'completed',
        items: [
          { productId: existingProducts[1].id, quantity: 2 }, // Cooking Oil 1L
        ]
      },
      {
        customerId: existingCustomers[1].id,
        customerName: existingCustomers[1].name,
        total: '295.00',
        paymentMethod: 'credit',
        status: 'completed',
        items: [
          { productId: existingProducts[3].id, quantity: 2 }, // Bread Loaf
          { productId: existingProducts[4].id, quantity: 1 }, // Milk 1L
          { productId: existingProducts[5].id, quantity: 1 }, // Eggs
        ]
      }
    ]

    for (const orderData of sampleOrders) {
      // Create order
      const [order]  =  await db
        .insert(orders)
        .values({
          customerId: orderData.customerId,
          customerName: orderData.customerName,
          total: orderData.total,
          paymentMethod: orderData.paymentMethod,
          status: orderData.status,
        })
        .returning()
      // Create order items and update product stats
      for (const item of orderData.items) {
        const product = existingProducts.find(p => p.id  ===  item.productId)
        if (product) {
          // Create order item
          await db.insert(orderItems).values({
            orderId: order.id,
            productId: item.productId,
            productName: product.name,
            quantity: item.quantity,
            price: product.price,
          })
          // Update product stock and sales count
          if (product.stock !== null) {
            await db
              .update(products)
              .set({
                stock: Math.max(0, product.stock - item.quantity),
                salesCount: product.salesCount + item.quantity,
              })
              .where(eq(products.id, item.productId))
          } else {
            await db
              .update(products)
              .set({
                salesCount: product.salesCount + item.quantity,
              })
              .where(eq(products.id, item.productId))
          }
        }
      }
    }

    } catch (error) {
    console.error('Error creating sample sales:', error)
    throw error
  }
}