import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kwdzbssuovwemthmiuht.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU0MTIwNiwiZXhwIjoyMDY3MTE3MjA2fQ.zSvksJ4fZLhaXKs8Ir_pq-yse-8x1NTKFTCWdiSLweQ';

console.log('Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey.substring(0, 20) + '...');

// Create clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testConnection() {
  try {
    console.log('\n🔗 Testing basic connection...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Auth connection failed:', error.message);
    } else {
      console.log('✅ Auth connection successful');
    }

    console.log('\n📊 Testing database access...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(5);

    if (productsError) {
      console.error('❌ Products table access failed:', productsError.message);
    } else {
      console.log('✅ Products table accessible');
      console.log(`📦 Found ${products?.length || 0} products`);
      if (products && products.length > 0) {
        console.log('Sample product:', products[0]);
      }
    }

    console.log('\n👥 Testing customers table...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(3);

    if (customersError) {
      console.error('❌ Customers table access failed:', customersError.message);
    } else {
      console.log('✅ Customers table accessible');
      console.log(`👤 Found ${customers?.length || 0} customers`);
    }

    console.log('\n📋 Testing orders table...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(3);

    if (ordersError) {
      console.error('❌ Orders table access failed:', ordersError.message);
    } else {
      console.log('✅ Orders table accessible');
      console.log(`🧾 Found ${orders?.length || 0} orders`);
    }

    console.log('\n🔔 Testing notifications table...');
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .limit(3);

    if (notificationsError) {
      console.error('❌ Notifications table access failed:', notificationsError.message);
    } else {
      console.log('✅ Notifications table accessible');
      console.log(`🔔 Found ${notifications?.length || 0} notifications`);
    }

    console.log('\n🔑 Testing admin access...');
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(3);

    if (usersError) {
      console.error('❌ Users table access failed:', usersError.message);
    } else {
      console.log('✅ Users table accessible with admin key');
      console.log(`👨‍💼 Found ${users?.length || 0} users`);
    }

    console.log('\n🎉 Supabase connection test completed!');

  } catch (error) {
    console.error('💥 Connection test failed:', error);
  }
}

testConnection();