#!/usr/bin/env node

// Check RLS policies and fix authentication for DukaFiti
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kwdzbssuovwemthmiuht.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU0MTIwNiwiZXhwIjoyMDY3MTE3MjA2fQ.zSvksJ4fZLhaXKs8Ir_pq-yse-8x1NTKFTCWdiSLweQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndFixRLS() {
  console.log('🔐 Checking RLS policies and authentication setup...');
  
  try {
    // Check current RLS status
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('schemaname', 'public')
      .in('tablename', ['products', 'customers', 'orders', 'order_items', 'notifications']);
    
    if (rlsError) {
      console.error('❌ RLS check failed:', rlsError.message);
      
      // Alternative: Check table permissions
      console.log('📋 Checking table permissions...');
      
      const tables = ['products', 'customers', 'orders', 'order_items', 'notifications'];
      
      for (const table of tables) {
        try {
          // Test with service key (should work)
          const { data: serviceData, error: serviceError } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          if (serviceError) {
            console.error(`❌ ${table} (service key): ${serviceError.message}`);
          } else {
            console.log(`✅ ${table} (service key): ${serviceData.length} records`);
          }
        } catch (err) {
          console.error(`❌ ${table}: ${err.message}`);
        }
      }
    } else {
      console.log('RLS Status:', rlsStatus);
    }
    
    // Test creating a test user and signing in
    console.log('\n👤 Testing user authentication...');
    
    // Create test user
    const testEmail = 'test@dukafiti.com';
    const testPassword = 'TestPassword123!';
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          store_name: 'Test Store',
          owner_name: 'Test Owner'
        }
      }
    });
    
    if (signUpError) {
      console.log('User might already exist, trying to sign in...');
      
      // Try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });
      
      if (signInError) {
        console.error('❌ Sign in failed:', signInError.message);
      } else {
        console.log('✅ User signed in successfully');
        
        // Test operations with authenticated user
        await testAuthenticatedOperations();
      }
    } else {
      console.log('✅ User created successfully');
      
      // Test operations with authenticated user
      await testAuthenticatedOperations();
    }
    
  } catch (error) {
    console.error('💥 RLS check failed:', error.message);
  }
}

async function testAuthenticatedOperations() {
  console.log('\n🧪 Testing authenticated operations...');
  
  try {
    // Create authenticated client
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('❌ No authenticated user found');
      return;
    }
    
    console.log('✅ Authenticated user:', user.email);
    
    // Test product creation with authenticated user
    const testProduct = {
      name: 'Authenticated Test Product',
      sku: 'AUTH-TEST-001',
      price: 100,
      stock: 50,
      category: 'Test',
      description: 'Test product with authentication',
      low_stock_threshold: 10,
      sales_count: 0,
      cost_price: 60,
      store_id: user.id
    };
    
    const { data: newProduct, error: createError } = await supabase
      .from('products')
      .insert([testProduct])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Authenticated product creation failed:', createError.message);
      
      // Try without store_id
      const { data: newProduct2, error: createError2 } = await supabase
        .from('products')
        .insert([{...testProduct, store_id: null}])
        .select()
        .single();
      
      if (createError2) {
        console.error('❌ Product creation without store_id failed:', createError2.message);
      } else {
        console.log('✅ Product creation without store_id successful');
        
        // Clean up
        await supabase.from('products').delete().eq('id', newProduct2.id);
      }
    } else {
      console.log('✅ Authenticated product creation successful');
      
      // Clean up
      await supabase.from('products').delete().eq('id', newProduct.id);
    }
    
  } catch (error) {
    console.error('❌ Authenticated operations test failed:', error.message);
  }
}

checkAndFixRLS();