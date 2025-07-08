#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kwdzbssuovwemthmiuht.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU0MTIwNiwiZXhwIjoyMDY3MTE3MjA2fQ.zSvksJ4fZLhaXKs8Ir_pq-yse-8x1NTKFTCWdiSLweQ';

// Create Supabase clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Testing Supabase Integration...');
console.log('URL:', supabaseUrl);
console.log('Service Key Available:', !!supabaseServiceKey);

async function testSupabaseIntegration() {
  try {
    // Test 1: Basic connection
    console.log('\n1. Testing basic connection...');
    const { data, error } = await supabase
      .from('products')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Basic connection failed:', error.message);
      if (error.message.includes('relation "products" does not exist')) {
        console.log('📝 Products table does not exist. Creating schema...');
        await createSchema();
      }
    } else {
      console.log('✅ Basic connection successful');
    }

    // Test 2: Check existing tables
    console.log('\n2. Checking existing tables...');
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.error('❌ Cannot check tables:', tablesError.message);
    } else {
      console.log('✅ Tables found:', tables.map(t => t.table_name));
    }

    // Test 3: Check authentication
    console.log('\n3. Testing authentication...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth error:', authError.message);
    } else {
      console.log('✅ Auth system working, session:', authData.session ? 'Active' : 'None');
    }

    // Test 4: Test data operations
    console.log('\n4. Testing data operations...');
    
    // Try to fetch products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(5);
    
    if (productsError) {
      console.error('❌ Products fetch failed:', productsError.message);
    } else {
      console.log('✅ Products fetched:', products.length, 'items');
    }

    // Try to fetch customers
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(5);
    
    if (customersError) {
      console.error('❌ Customers fetch failed:', customersError.message);
    } else {
      console.log('✅ Customers fetched:', customers.length, 'items');
    }

    // Try to fetch orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(5);
    
    if (ordersError) {
      console.error('❌ Orders fetch failed:', ordersError.message);
    } else {
      console.log('✅ Orders fetched:', orders.length, 'items');
    }

    console.log('\n✅ Supabase integration test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function createSchema() {
  console.log('🔧 Creating database schema...');
  
  try {
    // Create products table
    const { error: productsError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          sku VARCHAR(100) UNIQUE NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          cost_price DECIMAL(10,2),
          stock INTEGER,
          category VARCHAR(100) DEFAULT 'General',
          low_stock_threshold INTEGER DEFAULT 10,
          sales_count INTEGER DEFAULT 0,
          store_id UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (productsError) {
      console.error('❌ Products table creation failed:', productsError.message);
    } else {
      console.log('✅ Products table created');
    }

    // Create customers table
    const { error: customersError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS customers (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(20),
          balance DECIMAL(10,2) DEFAULT 0,
          store_id UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (customersError) {
      console.error('❌ Customers table creation failed:', customersError.message);
    } else {
      console.log('✅ Customers table created');
    }

    // Create orders table
    const { error: ordersError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          customer_id INTEGER REFERENCES customers(id),
          customer_name VARCHAR(255),
          total_amount DECIMAL(10,2) NOT NULL,
          payment_method VARCHAR(50) DEFAULT 'cash',
          status VARCHAR(20) DEFAULT 'completed',
          store_id UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (ordersError) {
      console.error('❌ Orders table creation failed:', ordersError.message);
    } else {
      console.log('✅ Orders table created');
    }

    // Create order_items table
    const { error: orderItemsError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS order_items (
          id SERIAL PRIMARY KEY,
          order_id INTEGER REFERENCES orders(id),
          product_id INTEGER REFERENCES products(id),
          product_name VARCHAR(255),
          quantity INTEGER NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          store_id UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (orderItemsError) {
      console.error('❌ Order items table creation failed:', orderItemsError.message);
    } else {
      console.log('✅ Order items table created');
    }

    // Create notifications table
    const { error: notificationsError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          user_id UUID,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (notificationsError) {
      console.error('❌ Notifications table creation failed:', notificationsError.message);
    } else {
      console.log('✅ Notifications table created');
    }

    console.log('✅ Database schema created successfully!');
    
  } catch (error) {
    console.error('❌ Schema creation failed:', error.message);
  }
}

// Run the test
testSupabaseIntegration().catch(console.error);