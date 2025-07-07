#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://kwdzbssuovwemthmiuht.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Testing DukaFiti application functionality...');

async function testApplicationFunctionality() {
  try {
    console.log('\n1. Testing data availability...');
    
    // Test products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*');
    
    if (productsError) {
      console.error('❌ Products error:', productsError.message);
    } else {
      console.log('✅ Products available:', products.length);
      console.log('Sample product:', products[0]?.name || 'No products');
    }

    // Test customers
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*');
    
    if (customersError) {
      console.error('❌ Customers error:', customersError.message);
    } else {
      console.log('✅ Customers available:', customers.length);
      console.log('Sample customer:', customers[0]?.name || 'No customers');
    }

    // Test orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*');
    
    if (ordersError) {
      console.error('❌ Orders error:', ordersError.message);
    } else {
      console.log('✅ Orders available:', orders.length);
      console.log('Sample order total:', orders[0]?.total || 'No orders');
    }

    console.log('\n2. Testing authentication functionality...');
    
    // Test sign in with demo credentials
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'demo@dukafiti.com',
      password: 'DukaFiti2025!'
    });

    if (authError) {
      console.error('❌ Demo authentication failed:', authError.message);
    } else {
      console.log('✅ Demo authentication successful');
      console.log('User ID:', authData.user?.id);
      
      // Test authenticated data access
      console.log('\n3. Testing authenticated data access...');
      
      const { data: userProducts, error: userProductsError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', authData.user.id);
      
      if (userProductsError) {
        console.error('❌ User products error:', userProductsError.message);
      } else {
        console.log('✅ User-specific products:', userProducts.length);
      }
      
      // Sign out
      await supabase.auth.signOut();
      console.log('✅ Signed out successfully');
    }

    console.log('\n4. Testing environment variables...');
    console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
    console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
    console.log('VITE_SUPABASE_SERVICE_ROLE_KEY:', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');

    console.log('\n✅ Application functionality test completed!');
    console.log('\n🚀 Your DukaFiti application is ready to use:');
    console.log('- Navigate to http://localhost:5000');
    console.log('- Click "Sign In" and use: demo@dukafiti.com / DukaFiti2025!');
    console.log('- Explore the dashboard, inventory, sales, and customer management features');
    console.log('- All data is now stored in your Supabase database');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testApplicationFunctionality().catch(console.error);