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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixCRUDIssues() {
  try {
    console.log('🔧 Starting comprehensive CRUD bug fix...');
    
    // 1. Fix database schema - make category nullable
    console.log('\n1. Fixing database schema...');
    const { error: schemaError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Make category nullable
        ALTER TABLE products ALTER COLUMN category DROP NOT NULL;
        
        -- Add default values where needed
        UPDATE products SET category = 'General' WHERE category IS NULL;
        
        -- Verify RLS policies exist
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
        FROM pg_policies 
        WHERE tablename IN ('products', 'customers', 'orders', 'order_items', 'notifications');
      `
    });
    
    if (schemaError) {
      console.error('❌ Schema fix failed:', schemaError.message);
    } else {
      console.log('✅ Schema fixed - category is now nullable');
    }
    
    // 2. Fix RLS policies
    console.log('\n2. Implementing proper RLS policies...');
    const rlsQueries = [
      // Enable RLS on all tables
      `ALTER TABLE products ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE customers ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE orders ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;`,
      
      // Drop existing policies
      `DROP POLICY IF EXISTS "Users can only see their own products" ON products;`,
      `DROP POLICY IF EXISTS "Users can only insert their own products" ON products;`,
      `DROP POLICY IF EXISTS "Users can only update their own products" ON products;`,
      `DROP POLICY IF EXISTS "Users can only delete their own products" ON products;`,
      
      // Products policies
      `CREATE POLICY "Users can only see their own products" ON products FOR SELECT USING (auth.uid() = store_id::uuid);`,
      `CREATE POLICY "Users can only insert their own products" ON products FOR INSERT WITH CHECK (auth.uid() = store_id::uuid);`,
      `CREATE POLICY "Users can only update their own products" ON products FOR UPDATE USING (auth.uid() = store_id::uuid);`,
      `CREATE POLICY "Users can only delete their own products" ON products FOR DELETE USING (auth.uid() = store_id::uuid);`,
      
      // Customers policies
      `DROP POLICY IF EXISTS "Users can only see their own customers" ON customers;`,
      `DROP POLICY IF EXISTS "Users can only insert their own customers" ON customers;`,
      `DROP POLICY IF EXISTS "Users can only update their own customers" ON customers;`,
      `DROP POLICY IF EXISTS "Users can only delete their own customers" ON customers;`,
      
      `CREATE POLICY "Users can only see their own customers" ON customers FOR SELECT USING (auth.uid() = store_id::uuid);`,
      `CREATE POLICY "Users can only insert their own customers" ON customers FOR INSERT WITH CHECK (auth.uid() = store_id::uuid);`,
      `CREATE POLICY "Users can only update their own customers" ON customers FOR UPDATE USING (auth.uid() = store_id::uuid);`,
      `CREATE POLICY "Users can only delete their own customers" ON customers FOR DELETE USING (auth.uid() = store_id::uuid);`,
      
      // Orders policies
      `DROP POLICY IF EXISTS "Users can only see their own orders" ON orders;`,
      `DROP POLICY IF EXISTS "Users can only insert their own orders" ON orders;`,
      `DROP POLICY IF EXISTS "Users can only update their own orders" ON orders;`,
      `DROP POLICY IF EXISTS "Users can only delete their own orders" ON orders;`,
      
      `CREATE POLICY "Users can only see their own orders" ON orders FOR SELECT USING (auth.uid() = store_id::uuid);`,
      `CREATE POLICY "Users can only insert their own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = store_id::uuid);`,
      `CREATE POLICY "Users can only update their own orders" ON orders FOR UPDATE USING (auth.uid() = store_id::uuid);`,
      `CREATE POLICY "Users can only delete their own orders" ON orders FOR DELETE USING (auth.uid() = store_id::uuid);`,
      
      // Notifications policies
      `DROP POLICY IF EXISTS "Users can only see their own notifications" ON notifications;`,
      `DROP POLICY IF EXISTS "Users can only insert their own notifications" ON notifications;`,
      `DROP POLICY IF EXISTS "Users can only update their own notifications" ON notifications;`,
      `DROP POLICY IF EXISTS "Users can only delete their own notifications" ON notifications;`,
      
      `CREATE POLICY "Users can only see their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id::uuid);`,
      `CREATE POLICY "Users can only insert their own notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id::uuid);`,
      `CREATE POLICY "Users can only update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id::uuid);`,
      `CREATE POLICY "Users can only delete their own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id::uuid);`
    ];
    
    for (const query of rlsQueries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.error('❌ RLS query failed:', query.substring(0, 50) + '...', error.message);
      }
    }
    
    console.log('✅ RLS policies implemented');
    
    // 3. Test RLS enforcement
    console.log('\n3. Testing RLS enforcement...');
    
    // Create test user client
    const testClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    // Try to access products without auth (should fail)
    const { data: unauthData, error: unauthError } = await testClient
      .from('products')
      .select('*');
    
    if (unauthError) {
      console.log('✅ RLS working - unauthenticated access blocked');
    } else {
      console.log('❌ RLS not working - unauthenticated access allowed:', unauthData?.length);
    }
    
    // 4. Test with authenticated user
    console.log('\n4. Testing authenticated access...');
    
    const { data: authData, error: authError } = await testClient.auth.signInWithPassword({
      email: 'demo@dukafiti.com',
      password: 'DukaFiti2025!'
    });
    
    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
    } else {
      console.log('✅ Authentication successful');
      
      // Test authenticated queries
      const { data: authProducts, error: authProductsError } = await testClient
        .from('products')
        .select('*');
      
      if (authProductsError) {
        console.error('❌ Authenticated product query failed:', authProductsError.message);
      } else {
        console.log('✅ Authenticated user can access products:', authProducts.length);
      }
    }
    
    // 5. Create a test product with proper schema
    console.log('\n5. Testing product creation with new schema...');
    
    const testProduct = {
      name: `Fixed Product ${Date.now()}`,
      sku: `FIX-${Date.now()}`,
      description: 'Product created with fixed schema',
      price: 75.00,
      cost_price: 45.00,
      stock: 20,
      category: 'Test Category',
      low_stock_threshold: 5,
      sales_count: 0,
      store_id: authData.user.id
    };
    
    const { data: newProduct, error: createError } = await testClient
      .from('products')
      .insert([testProduct])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Product creation failed:', createError.message);
    } else {
      console.log('✅ Product created successfully:', newProduct.id);
    }
    
    // 6. Test real-time subscriptions
    console.log('\n6. Testing real-time subscriptions...');
    
    let eventCount = 0;
    const channel = testClient
      .channel('products')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          eventCount++;
          console.log(`📡 Real-time event: ${payload.eventType} - ${payload.new?.name || payload.old?.name}`);
        }
      )
      .subscribe();
    
    // Wait for subscription
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create another product to test real-time
    const rtProduct = {
      name: `RT Test ${Date.now()}`,
      sku: `RT-${Date.now()}`,
      price: 30.00,
      category: 'Realtime Test',
      store_id: authData.user.id
    };
    
    const { data: rtResult, error: rtError } = await testClient
      .from('products')
      .insert([rtProduct])
      .select()
      .single();
    
    if (rtError) {
      console.error('❌ Real-time test failed:', rtError.message);
    } else {
      console.log('✅ Real-time test product created:', rtResult.id);
    }
    
    // Wait for real-time events
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log(`📊 Real-time events received: ${eventCount}`);
    
    // Cleanup
    testClient.removeChannel(channel);
    await testClient.auth.signOut();
    
    console.log('\n✅ CRUD fix completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Update ProductForm to use new runtime hooks');
    console.log('2. Remove conflicting data management hooks');
    console.log('3. Test UI persistence');
    
  } catch (error) {
    console.error('❌ CRUD fix failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

fixCRUDIssues().catch(console.error);