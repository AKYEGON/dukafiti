#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://kwdzbssuovwemthmiuht.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU0MTIwNiwiZXhwIjoyMDY3MTE3MjA2fQ.zSvksJ4fZLhaXKs8Ir_pq-yse-8x1NTKFTCWdiSLweQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🌱 Creating complete sample data for DukaFiti...');

async function seedCompleteData() {
  try {
    // Clean existing data first
    console.log('\n1. Cleaning existing data...');
    await supabase.from('order_items').delete().neq('id', 0);
    await supabase.from('orders').delete().neq('id', 0);
    await supabase.from('notifications').delete().neq('id', 0);
    console.log('✅ Cleaned old data');

    // Get existing customers and products
    console.log('\n2. Using existing customers and products...');
    const { data: customers } = await supabase
      .from('customers')
      .select('*')
      .limit(5);
    
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .limit(6);

    console.log('✅ Found', customers?.length || 0, 'customers and', products?.length || 0, 'products');

    if (!customers?.length || !products?.length) {
      console.log('❌ Need customers and products first. Please run clean-and-seed-supabase.js first');
      return;
    }

    // Create orders with proper schema
    console.log('\n3. Creating sample orders...');
    const orders = [
      {
        customer_id: customers[0].id,
        customer_name: customers[0].name,
        total: 320.00,
        payment_method: 'cash',
        status: 'completed',
        store_id: customers[0].store_id || null
      },
      {
        customer_id: customers[1].id,
        customer_name: customers[1].name,
        total: 140.00,
        payment_method: 'credit',
        status: 'completed',
        store_id: customers[1].store_id || null
      },
      {
        customer_id: customers[2].id,
        customer_name: customers[2].name,
        total: 260.00,
        payment_method: 'mobileMoney',
        status: 'completed',
        store_id: customers[2].store_id || null
      },
      {
        customer_id: customers[0].id,
        customer_name: customers[0].name,
        total: 180.00,
        payment_method: 'cash',
        status: 'completed',
        store_id: customers[0].store_id || null
      },
      {
        customer_id: customers[3].id,
        customer_name: customers[3].name,
        total: 400.00,
        payment_method: 'credit',
        status: 'completed',
        store_id: customers[3].store_id || null
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

    // Create order items
    console.log('\n4. Creating order items...');
    const orderItems = [
      // Order 1 items (total: 320)
      {
        order_id: insertedOrders[0].id,
        product_id: products[0].id,
        product_name: products[0].name,
        quantity: 2,
        price: products[0].price,
        store_id: products[0].store_id || null
      },
      {
        order_id: insertedOrders[0].id,
        product_id: products[1].id,
        product_name: products[1].name,
        quantity: 1,
        price: products[1].price,
        store_id: products[1].store_id || null
      },
      {
        order_id: insertedOrders[0].id,
        product_id: products[2].id,
        product_name: products[2].name,
        quantity: 1,
        price: products[2].price,
        store_id: products[2].store_id || null
      },
      // Order 2 items (total: 140)
      {
        order_id: insertedOrders[1].id,
        product_id: products[0].id,
        product_name: products[0].name,
        quantity: 1,
        price: products[0].price,
        store_id: products[0].store_id || null
      },
      {
        order_id: insertedOrders[1].id,
        product_id: products[1].id,
        product_name: products[1].name,
        quantity: 1,
        price: products[1].price,
        store_id: products[1].store_id || null
      },
      // Order 3 items (total: 260)
      {
        order_id: insertedOrders[2].id,
        product_id: products[3].id,
        product_name: products[3].name,
        quantity: 1,
        price: products[3].price,
        store_id: products[3].store_id || null
      },
      {
        order_id: insertedOrders[2].id,
        product_id: products[4].id,
        product_name: products[4].name,
        quantity: 1,
        price: products[4].price,
        store_id: products[4].store_id || null
      },
      // Order 4 items (total: 180)
      {
        order_id: insertedOrders[3].id,
        product_id: products[2].id,
        product_name: products[2].name,
        quantity: 1,
        price: products[2].price,
        store_id: products[2].store_id || null
      },
      // Order 5 items (total: 400)
      {
        order_id: insertedOrders[4].id,
        product_id: products[5].id,
        product_name: products[5].name,
        quantity: 2,
        price: products[5].price,
        store_id: products[5].store_id || null
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

    // Create notifications with proper user_id (UUID)
    console.log('\n5. Creating sample notifications...');
    const demoUserId = customers[0].store_id || '550e8400-e29b-41d4-a716-446655440000';
    
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
        message: `${customers[0].name} has an outstanding balance of KES ${customers[0].balance}.00`,
        is_read: false
      },
      {
        user_id: demoUserId,
        type: 'sale_success',
        title: 'Sale Completed',
        message: 'Successfully processed sale of KES 320.00',
        is_read: true
      },
      {
        user_id: demoUserId,
        type: 'low_stock',
        title: 'Stock Alert',
        message: 'Rice stock is getting low (15 remaining, threshold: 5)',
        is_read: false
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

    console.log('\n✅ Complete sample data created successfully!');
    console.log('\n📊 Final Summary:');
    console.log('- Products:', products?.length || 0);
    console.log('- Customers:', customers?.length || 0);
    console.log('- Orders:', insertedOrders?.length || 0);
    console.log('- Order Items:', insertedOrderItems?.length || 0);
    console.log('- Notifications:', insertedNotifications?.length || 0);
    console.log('\n🎉 Your DukaFiti application is now fully setup with sample data!');
    console.log('\n📝 Login credentials:');
    console.log('Email: demo@dukafiti.com');
    console.log('Password: DukaFiti2025!');
    console.log('\n🔗 Navigate to your application and log in to see all the data in action!');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  }
}

seedCompleteData().catch(console.error);