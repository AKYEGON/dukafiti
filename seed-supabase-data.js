#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = 'https://kwdzbssuovwemthmiuht.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU0MTIwNiwiZXhwIjoyMDY3MTE3MjA2fQ.zSvksJ4fZLhaXKs8Ir_pq-yse-8x1NTKFTCWdiSLweQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🌱 Seeding Supabase database with sample data...');

async function seedDatabase() {
  try {
    // Create a test user account for demonstration
    const testUserId = '123e4567-e89b-12d3-a456-426614174000'; // Mock UUID for demo
    
    console.log('\n1. Creating sample products...');
    const products = [
      {
        name: 'White Bread',
        sku: 'BREAD-001',
        description: 'Fresh white bread loaf',
        price: 60.00,
        cost_price: 40.00,
        stock: 25,
        category: 'Bakery',
        low_stock_threshold: 5,
        sales_count: 15,
        store_id: testUserId
      },
      {
        name: 'Milk 1L',
        sku: 'MILK-001',
        description: 'Fresh cow milk 1 liter',
        price: 80.00,
        cost_price: 60.00,
        stock: 30,
        category: 'Dairy',
        low_stock_threshold: 8,
        sales_count: 22,
        store_id: testUserId
      },
      {
        name: 'Rice 2kg',
        sku: 'RICE-002',
        description: 'Premium white rice 2kg bag',
        price: 180.00,
        cost_price: 120.00,
        stock: 15,
        category: 'Grains',
        low_stock_threshold: 5,
        sales_count: 8,
        store_id: testUserId
      },
      {
        name: 'Cooking Oil 500ml',
        sku: 'OIL-500',
        description: 'Vegetable cooking oil 500ml',
        price: 150.00,
        cost_price: 100.00,
        stock: 20,
        category: 'Cooking',
        low_stock_threshold: 6,
        sales_count: 12,
        store_id: testUserId
      },
      {
        name: 'Sugar 1kg',
        sku: 'SUGAR-001',
        description: 'White granulated sugar 1kg',
        price: 120.00,
        cost_price: 85.00,
        stock: 18,
        category: 'Cooking',
        low_stock_threshold: 5,
        sales_count: 18,
        store_id: testUserId
      },
      {
        name: 'Beans 1kg',
        sku: 'BEANS-001',
        description: 'Dried red kidney beans 1kg',
        price: 200.00,
        cost_price: 140.00,
        stock: 8,
        category: 'Grains',
        low_stock_threshold: 10,
        sales_count: 5,
        store_id: testUserId
      }
    ];

    const { data: insertedProducts, error: productsError } = await supabase
      .from('products')
      .insert(products)
      .select();

    if (productsError) {
      console.error('❌ Products creation failed:', productsError.message);
    } else {
      console.log('✅ Created', insertedProducts.length, 'products');
    }

    console.log('\n2. Creating sample customers...');
    const customers = [
      {
        name: 'Mary Wanjiku',
        email: 'mary@example.com',
        phone: '+254712345678',
        balance: 250.00,
        store_id: testUserId
      },
      {
        name: 'John Kamau',
        email: 'john@example.com',
        phone: '+254723456789',
        balance: 0.00,
        store_id: testUserId
      },
      {
        name: 'Grace Akinyi',
        email: 'grace@example.com',
        phone: '+254734567890',
        balance: 180.00,
        store_id: testUserId
      },
      {
        name: 'David Mwangi',
        email: null,
        phone: '+254745678901',
        balance: 320.00,
        store_id: testUserId
      },
      {
        name: 'Sarah Nyong\'o',
        email: 'sarah@example.com',
        phone: '+254756789012',
        balance: 0.00,
        store_id: testUserId
      }
    ];

    const { data: insertedCustomers, error: customersError } = await supabase
      .from('customers')
      .insert(customers)
      .select();

    if (customersError) {
      console.error('❌ Customers creation failed:', customersError.message);
    } else {
      console.log('✅ Created', insertedCustomers.length, 'customers');
    }

    console.log('\n3. Creating sample orders...');
    if (insertedProducts && insertedCustomers) {
      const orders = [
        {
          customer_id: insertedCustomers[0].id,
          customer_name: insertedCustomers[0].name,
          total_amount: 320.00,
          payment_method: 'cash',
          status: 'completed',
          store_id: testUserId
        },
        {
          customer_id: insertedCustomers[1].id,
          customer_name: insertedCustomers[1].name,
          total_amount: 140.00,
          payment_method: 'credit',
          status: 'completed',
          store_id: testUserId
        },
        {
          customer_id: insertedCustomers[2].id,
          customer_name: insertedCustomers[2].name,
          total_amount: 260.00,
          payment_method: 'mobileMoney',
          status: 'completed',
          store_id: testUserId
        }
      ];

      const { data: insertedOrders, error: ordersError } = await supabase
        .from('orders')
        .insert(orders)
        .select();

      if (ordersError) {
        console.error('❌ Orders creation failed:', ordersError.message);
      } else {
        console.log('✅ Created', insertedOrders.length, 'orders');

        // Create order items
        console.log('\n4. Creating order items...');
        const orderItems = [
          // Order 1 items
          {
            order_id: insertedOrders[0].id,
            product_id: insertedProducts[0].id,
            product_name: insertedProducts[0].name,
            quantity: 2,
            price: insertedProducts[0].price,
            store_id: testUserId
          },
          {
            order_id: insertedOrders[0].id,
            product_id: insertedProducts[1].id,
            product_name: insertedProducts[1].name,
            quantity: 1,
            price: insertedProducts[1].price,
            store_id: testUserId
          },
          {
            order_id: insertedOrders[0].id,
            product_id: insertedProducts[2].id,
            product_name: insertedProducts[2].name,
            quantity: 1,
            price: insertedProducts[2].price,
            store_id: testUserId
          },
          // Order 2 items
          {
            order_id: insertedOrders[1].id,
            product_id: insertedProducts[0].id,
            product_name: insertedProducts[0].name,
            quantity: 1,
            price: insertedProducts[0].price,
            store_id: testUserId
          },
          {
            order_id: insertedOrders[1].id,
            product_id: insertedProducts[1].id,
            product_name: insertedProducts[1].name,
            quantity: 1,
            price: insertedProducts[1].price,
            store_id: testUserId
          },
          // Order 3 items
          {
            order_id: insertedOrders[2].id,
            product_id: insertedProducts[3].id,
            product_name: insertedProducts[3].name,
            quantity: 1,
            price: insertedProducts[3].price,
            store_id: testUserId
          },
          {
            order_id: insertedOrders[2].id,
            product_id: insertedProducts[4].id,
            product_name: insertedProducts[4].name,
            quantity: 1,
            price: insertedProducts[4].price,
            store_id: testUserId
          }
        ];

        const { data: insertedOrderItems, error: orderItemsError } = await supabase
          .from('order_items')
          .insert(orderItems)
          .select();

        if (orderItemsError) {
          console.error('❌ Order items creation failed:', orderItemsError.message);
        } else {
          console.log('✅ Created', insertedOrderItems.length, 'order items');
        }
      }
    }

    console.log('\n5. Creating sample notifications...');
    const notifications = [
      {
        user_id: testUserId,
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: 'Beans stock is running low (8 remaining, threshold: 10)',
        is_read: false
      },
      {
        user_id: testUserId,
        type: 'credit_reminder',
        title: 'Payment Reminder',
        message: 'Mary Wanjiku has an outstanding balance of KES 250.00',
        is_read: false
      },
      {
        user_id: testUserId,
        type: 'sale_success',
        title: 'Sale Completed',
        message: 'Successfully processed sale of KES 320.00',
        is_read: true
      }
    ];

    const { data: insertedNotifications, error: notificationsError } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (notificationsError) {
      console.error('❌ Notifications creation failed:', notificationsError.message);
    } else {
      console.log('✅ Created', insertedNotifications.length, 'notifications');
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- Products:', insertedProducts?.length || 0);
    console.log('- Customers:', insertedCustomers?.length || 0);
    console.log('- Orders:', insertedOrders?.length || 0);
    console.log('- Notifications:', insertedNotifications?.length || 0);
    console.log('\n🔗 You can now test the application with this sample data.');
    console.log('📝 Demo account email: demo@dukafiti.com');
    console.log('🔑 Demo password: DukaFiti2025!');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  }
}

// Run the seeding
seedDatabase().catch(console.error);