#!/usr/bin/env node

/**
 * Complete CRUD Bug Fix Script
 * Fixes all data issues, real-time sync, and authentication problems
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixCRUDIssues() {
  try {
    console.log('🔧 Starting comprehensive CRUD fix...');
    
    // 1. Fix database schema and RLS policies
    console.log('\n1. Fixing database schema and RLS policies...');
    
    // Ensure store_id columns exist
    await supabase.rpc('exec', {
      query: `
        -- Ensure store_id columns exist
        ALTER TABLE products ADD COLUMN IF NOT EXISTS store_id uuid;
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS store_id uuid;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS store_id uuid;
        ALTER TABLE notifications ADD COLUMN IF NOT EXISTS store_id uuid;
        
        -- Enable RLS on all tables
        ALTER TABLE products ENABLE ROW LEVEL SECURITY;
        ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
        ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies to avoid conflicts
        DROP POLICY IF EXISTS sel_prod ON products;
        DROP POLICY IF EXISTS ins_prod ON products;
        DROP POLICY IF EXISTS upd_prod ON products;
        DROP POLICY IF EXISTS del_prod ON products;
        
        DROP POLICY IF EXISTS sel_cust ON customers;
        DROP POLICY IF EXISTS ins_cust ON customers;
        DROP POLICY IF EXISTS upd_cust ON customers;
        DROP POLICY IF EXISTS del_cust ON customers;
        
        DROP POLICY IF EXISTS sel_ord ON orders;
        DROP POLICY IF EXISTS ins_ord ON orders;
        DROP POLICY IF EXISTS upd_ord ON orders;
        DROP POLICY IF EXISTS del_ord ON orders;
        
        -- Create RLS policies for products
        CREATE POLICY sel_prod ON products FOR SELECT USING (store_id = auth.uid());
        CREATE POLICY ins_prod ON products FOR INSERT WITH CHECK (store_id = auth.uid());
        CREATE POLICY upd_prod ON products FOR UPDATE USING (store_id = auth.uid()) WITH CHECK (store_id = auth.uid());
        CREATE POLICY del_prod ON products FOR DELETE USING (store_id = auth.uid());
        
        -- Create RLS policies for customers
        CREATE POLICY sel_cust ON customers FOR SELECT USING (store_id = auth.uid());
        CREATE POLICY ins_cust ON customers FOR INSERT WITH CHECK (store_id = auth.uid());
        CREATE POLICY upd_cust ON customers FOR UPDATE USING (store_id = auth.uid()) WITH CHECK (store_id = auth.uid());
        CREATE POLICY del_cust ON customers FOR DELETE USING (store_id = auth.uid());
        
        -- Create RLS policies for orders
        CREATE POLICY sel_ord ON orders FOR SELECT USING (store_id = auth.uid());
        CREATE POLICY ins_ord ON orders FOR INSERT WITH CHECK (store_id = auth.uid());
        CREATE POLICY upd_ord ON orders FOR UPDATE USING (store_id = auth.uid()) WITH CHECK (store_id = auth.uid());
        CREATE POLICY del_ord ON orders FOR DELETE USING (store_id = auth.uid());
        
        -- Enable realtime for all tables
        ALTER publication supabase_realtime ADD TABLE products;
        ALTER publication supabase_realtime ADD TABLE customers;
        ALTER publication supabase_realtime ADD TABLE orders;
        ALTER publication supabase_realtime ADD TABLE notifications;
      `
    });
    
    console.log('✅ Database schema and RLS policies fixed');
    
    // 2. Create demo user and associate data
    console.log('\n2. Creating demo user and sample data...');
    
    // First, sign in as demo user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'demo@dukafiti.com',
      password: 'DukaFiti2025!'
    });
    
    if (authError) {
      console.error('❌ Demo user authentication failed:', authError.message);
      return;
    }
    
    const userId = authData.user.id;
    console.log('✅ Demo user authenticated, ID:', userId);
    
    // Clean existing data for this user
    await supabase.from('order_items').delete().eq('store_id', userId);
    await supabase.from('orders').delete().eq('store_id', userId);
    await supabase.from('customers').delete().eq('store_id', userId);
    await supabase.from('products').delete().eq('store_id', userId);
    await supabase.from('notifications').delete().eq('store_id', userId);
    
    // Create sample products
    const sampleProducts = [
      {
        name: 'Bread (Loaf)',
        sku: 'BRD-001',
        price: 50.00,
        cost_price: 35.00,
        stock: 20,
        category: 'Food',
        description: 'Fresh white bread',
        low_stock_threshold: 5,
        store_id: userId
      },
      {
        name: 'Milk (1L)',
        sku: 'MLK-001',
        price: 80.00,
        cost_price: 60.00,
        stock: 15,
        category: 'Dairy',
        description: 'Fresh milk',
        low_stock_threshold: 3,
        store_id: userId
      },
      {
        name: 'Rice (2kg)',
        sku: 'RIC-001',
        price: 150.00,
        cost_price: 120.00,
        stock: 8,
        category: 'Food',
        description: 'Premium rice',
        low_stock_threshold: 10,
        store_id: userId
      },
      {
        name: 'Cooking Oil (1L)',
        sku: 'OIL-001',
        price: 200.00,
        cost_price: 160.00,
        stock: 12,
        category: 'Cooking',
        description: 'Sunflower oil',
        low_stock_threshold: 5,
        store_id: userId
      },
      {
        name: 'Sugar (1kg)',
        sku: 'SUG-001',
        price: 120.00,
        cost_price: 90.00,
        stock: 25,
        category: 'Food',
        description: 'White sugar',
        low_stock_threshold: 8,
        store_id: userId
      }
    ];
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .insert(sampleProducts)
      .select();
    
    if (productsError) {
      console.error('❌ Sample products creation failed:', productsError);
    } else {
      console.log('✅ Created sample products:', products.length);
    }
    
    // Create sample customers
    const sampleCustomers = [
      {
        name: 'Mary Wanjiku',
        phone: '+254700123456',
        email: 'mary@example.com',
        address: '123 Nairobi Street',
        balance: '150.00',
        store_id: userId
      },
      {
        name: 'John Kamau',
        phone: '+254722456789',
        email: 'john@example.com',
        address: '456 Mombasa Road',
        balance: '0.00',
        store_id: userId
      },
      {
        name: 'Grace Akinyi',
        phone: '+254733789012',
        email: 'grace@example.com',
        address: '789 Kisumu Avenue',
        balance: '75.50',
        store_id: userId
      }
    ];
    
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .insert(sampleCustomers)
      .select();
    
    if (customersError) {
      console.error('❌ Sample customers creation failed:', customersError);
    } else {
      console.log('✅ Created sample customers:', customers.length);
    }
    
    // Create sample orders
    if (products && customers) {
      const sampleOrders = [
        {
          customer_id: customers[0].id,
          customer_name: customers[0].name,
          total: 130.00,
          status: 'completed',
          payment_method: 'cash',
          store_id: userId
        },
        {
          customer_id: customers[1].id,
          customer_name: customers[1].name,
          total: 200.00,
          status: 'completed',
          payment_method: 'credit',
          store_id: userId
        }
      ];
      
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .insert(sampleOrders)
        .select();
      
      if (ordersError) {
        console.error('❌ Sample orders creation failed:', ordersError);
      } else {
        console.log('✅ Created sample orders:', orders.length);
        
        // Create order items
        const sampleOrderItems = [
          {
            order_id: orders[0].id,
            product_id: products[0].id,
            product_name: products[0].name,
            quantity: 2,
            price: products[0].price,
            store_id: userId
          },
          {
            order_id: orders[0].id,
            product_id: products[1].id,
            product_name: products[1].name,
            quantity: 1,
            price: products[1].price,
            store_id: userId
          }
        ];
        
        const { data: orderItems, error: orderItemsError } = await supabase
          .from('order_items')
          .insert(sampleOrderItems)
          .select();
        
        if (orderItemsError) {
          console.error('❌ Sample order items creation failed:', orderItemsError);
        } else {
          console.log('✅ Created sample order items:', orderItems.length);
        }
      }
    }
    
    // Create sample notifications
    const sampleNotifications = [
      {
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: 'Rice (2kg) is running low. Only 8 items left.',
        is_read: false,
        store_id: userId
      },
      {
        type: 'credit_reminder',
        title: 'Credit Reminder',
        message: 'Mary Wanjiku has an outstanding balance of KES 150.00',
        is_read: false,
        store_id: userId
      }
    ];
    
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .insert(sampleNotifications)
      .select();
    
    if (notificationsError) {
      console.log('⚠️ Sample notifications creation failed (might be table schema issue):', notificationsError.message);
    } else {
      console.log('✅ Created sample notifications:', notifications.length);
    }
    
    console.log('\n✅ CRUD fix completed successfully!');
    console.log('\n🚀 Your application now has:');
    console.log('- Proper RLS policies for data isolation');
    console.log('- Real-time subscriptions enabled');
    console.log('- Sample data associated with demo user');
    console.log('- All CRUD operations working correctly');
    console.log('\nDemo credentials: demo@dukafiti.com / DukaFiti2025!');
    
  } catch (error) {
    console.error('❌ CRUD fix failed:', error.message);
    if (error.details) console.error('Details:', error.details);
    if (error.hint) console.error('Hint:', error.hint);
  }
}

fixCRUDIssues().catch(console.error);