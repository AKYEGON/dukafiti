#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = 'https://kwdzbssuovwemthmiuht.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU0MTIwNiwiZXhwIjoyMDY3MTE3MjA2fQ.zSvksJ4fZLhaXKs8Ir_pq-yse-8x1NTKFTCWdiSLweQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🧹 Cleaning and seeding Supabase database...');

async function cleanAndSeedDatabase() {
  try {
    // Step 1: Clean existing data
    console.log('\n1. Cleaning existing data...');
    
    // Delete in correct order to respect foreign key constraints
    await supabase.from('order_items').delete().neq('id', 0);
    await supabase.from('orders').delete().neq('id', 0);
    await supabase.from('notifications').delete().neq('id', 0);
    await supabase.from('customers').delete().neq('id', 0);
    await supabase.from('products').delete().neq('id', 0);
    
    console.log('✅ Existing data cleaned');

    // Step 2: Create a demo user account
    console.log('\n2. Creating demo user account...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'demo@dukafiti.com',
      password: 'DukaFiti2025!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Demo Store Owner'
      }
    });

    if (authError && !authError.message.includes('already registered')) {
      console.error('❌ Demo user creation failed:', authError.message);
      return;
    }

    const demoUserId = authData?.user?.id || '550e8400-e29b-41d4-a716-446655440000'; // fallback UUID
    console.log('✅ Demo user created/found:', demoUserId);

    // Step 3: Create sample products
    console.log('\n3. Creating sample products...');
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
        store_id: demoUserId
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
        store_id: demoUserId
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
        store_id: demoUserId
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
        store_id: demoUserId
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
        store_id: demoUserId
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
        store_id: demoUserId
      }
    ];

    const { data: insertedProducts, error: productsError } = await supabase
      .from('products')
      .insert(products)
      .select();

    if (productsError) {
      console.error('❌ Products creation failed:', productsError.message);
      return;
    } else {
      console.log('✅ Created', insertedProducts.length, 'products');
    }

    // Step 4: Create sample customers
    console.log('\n4. Creating sample customers...');
    const customers = [
      {
        name: 'Mary Wanjiku',
        email: 'mary@example.com',
        phone: '+254712345678',
        balance: 250.00,
        store_id: demoUserId
      },
      {
        name: 'John Kamau',
        email: 'john@example.com',
        phone: '+254723456789',
        balance: 0.00,
        store_id: demoUserId
      },
      {
        name: 'Grace Akinyi',
        email: 'grace@example.com',
        phone: '+254734567890',
        balance: 180.00,
        store_id: demoUserId
      },
      {
        name: 'David Mwangi',
        email: null,
        phone: '+254745678901',
        balance: 320.00,
        store_id: demoUserId
      },
      {
        name: 'Sarah Nyong\'o',
        email: 'sarah@example.com',
        phone: '+254756789012',
        balance: 0.00,
        store_id: demoUserId
      }
    ];

    const { data: insertedCustomers, error: customersError } = await supabase
      .from('customers')
      .insert(customers)
      .select();

    if (customersError) {
      console.error('❌ Customers creation failed:', customersError.message);
      return;
    } else {
      console.log('✅ Created', insertedCustomers.length, 'customers');
    }

    // Step 5: Create sample orders
    console.log('\n5. Creating sample orders...');
    const orders = [
      {
        customer_id: insertedCustomers[0].id,
        customer_name: insertedCustomers[0].name,
        total_amount: 320.00,
        payment_method: 'cash',
        status: 'completed',
        store_id: demoUserId
      },
      {
        customer_id: insertedCustomers[1].id,
        customer_name: insertedCustomers[1].name,
        total_amount: 140.00,
        payment_method: 'credit',
        status: 'completed',
        store_id: demoUserId
      },
      {
        customer_id: insertedCustomers[2].id,
        customer_name: insertedCustomers[2].name,
        total_amount: 260.00,
        payment_method: 'mobileMoney',
        status: 'completed',
        store_id: demoUserId
      }
    ];

    const { data: insertedOrders, error: ordersError } = await supabase
      .from('orders')
      .insert(orders)
      .select();

    if (ordersError) {
      console.error('❌ Orders creation failed:', ordersError.message);
      return;
    } else {
      console.log('✅ Created', insertedOrders.length, 'orders');
    }

    // Step 6: Create order items
    console.log('\n6. Creating order items...');
    const orderItems = [
      // Order 1 items
      {
        order_id: insertedOrders[0].id,
        product_id: insertedProducts[0].id,
        product_name: insertedProducts[0].name,
        quantity: 2,
        price: insertedProducts[0].price,
        store_id: demoUserId
      },
      {
        order_id: insertedOrders[0].id,
        product_id: insertedProducts[1].id,
        product_name: insertedProducts[1].name,
        quantity: 1,
        price: insertedProducts[1].price,
        store_id: demoUserId
      },
      {
        order_id: insertedOrders[0].id,
        product_id: insertedProducts[2].id,
        product_name: insertedProducts[2].name,
        quantity: 1,
        price: insertedProducts[2].price,
        store_id: demoUserId
      },
      // Order 2 items
      {
        order_id: insertedOrders[1].id,
        product_id: insertedProducts[0].id,
        product_name: insertedProducts[0].name,
        quantity: 1,
        price: insertedProducts[0].price,
        store_id: demoUserId
      },
      {
        order_id: insertedOrders[1].id,
        product_id: insertedProducts[1].id,
        product_name: insertedProducts[1].name,
        quantity: 1,
        price: insertedProducts[1].price,
        store_id: demoUserId
      },
      // Order 3 items
      {
        order_id: insertedOrders[2].id,
        product_id: insertedProducts[3].id,
        product_name: insertedProducts[3].name,
        quantity: 1,
        price: insertedProducts[3].price,
        store_id: demoUserId
      },
      {
        order_id: insertedOrders[2].id,
        product_id: insertedProducts[4].id,
        product_name: insertedProducts[4].name,
        quantity: 1,
        price: insertedProducts[4].price,
        store_id: demoUserId
      }
    ];

    const { data: insertedOrderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select();

    if (orderItemsError) {
      console.error('❌ Order items creation failed:', orderItemsError.message);
      return;
    } else {
      console.log('✅ Created', insertedOrderItems.length, 'order items');
    }

    // Step 7: Create sample notifications
    console.log('\n7. Creating sample notifications...');
    const notifications = [
      {
        user_id: demoUserId,
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: 'Beans stock is running low (8 remaining, threshold: 10)',
        is_read: false
      },
      {
        user_id: demoUserId,
        type: 'credit_reminder',
        title: 'Payment Reminder',
        message: 'Mary Wanjiku has an outstanding balance of KES 250.00',
        is_read: false
      },
      {
        user_id: demoUserId,
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
      console.error('Error details:', notificationsError);
    } else {
      console.log('✅ Created', insertedNotifications.length, 'notifications');
    }

    console.log('\n✅ Database cleaning and seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- Products:', insertedProducts?.length || 0);
    console.log('- Customers:', insertedCustomers?.length || 0);
    console.log('- Orders:', insertedOrders?.length || 0);
    console.log('- Order Items:', insertedOrderItems?.length || 0);
    console.log('- Notifications:', insertedNotifications?.length || 0);
    console.log('\n🔗 Your Supabase database is now ready!');
    console.log('📝 Demo account email: demo@dukafiti.com');
    console.log('🔑 Demo password: DukaFiti2025!');
    console.log('\nTo test the application:');
    console.log('1. Navigate to your DukaFiti application');
    console.log('2. Log in with the demo credentials above');
    console.log('3. Explore the dashboard, inventory, sales, and other features');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the cleaning and seeding
cleanAndSeedDatabase().catch(console.error);