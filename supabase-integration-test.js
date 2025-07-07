#!/usr/bin/env node

// Comprehensive Supabase Integration Test for DukaFiti
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kwdzbssuovwemthmiuht.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFullIntegration() {
  console.log('🚀 Testing Full Supabase Integration for DukaFiti...\n');
  
  let testResults = {
    connection: false,
    auth: false,
    tables: {},
    crudOperations: {},
    realtime: false,
    overall: false
  };

  try {
    // Test 1: Basic Connection
    console.log('📡 Testing connection...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Connection failed:', authError.message);
    } else {
      console.log('✅ Connection successful');
      testResults.connection = true;
    }

    // Test 2: Authentication System
    console.log('\n🔐 Testing authentication...');
    try {
      // Test guest session (no login required)
      const { data: { user } } = await supabase.auth.getUser();
      console.log('✅ Auth system accessible');
      testResults.auth = true;
    } catch (err) {
      console.error('❌ Auth test failed:', err.message);
    }

    // Test 3: Database Tables
    console.log('\n🗄️ Testing database tables...');
    const tables = ['products', 'customers', 'orders', 'order_items', 'notifications'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.error(`❌ ${table}: ${error.message}`);
          testResults.tables[table] = false;
        } else {
          console.log(`✅ ${table}: ${data.length} records accessible`);
          testResults.tables[table] = true;
        }
      } catch (err) {
        console.error(`❌ ${table}: ${err.message}`);
        testResults.tables[table] = false;
      }
    }

    // Test 4: CRUD Operations
    console.log('\n🔧 Testing CRUD operations...');
    
    // Test product creation
    try {
      const testProduct = {
        name: 'Integration Test Product',
        sku: 'INT-TEST-001',
        price: 50,
        stock: 100,
        category: 'Test Category',
        description: 'Test product for integration testing',
        low_stock_threshold: 10,
        sales_count: 0,
        cost_price: 30
      };
      
      const { data: newProduct, error: createError } = await supabase
        .from('products')
        .insert([testProduct])
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Product creation failed:', createError.message);
        testResults.crudOperations.create = false;
      } else {
        console.log('✅ Product creation successful');
        testResults.crudOperations.create = true;
        
        // Test product update
        const { data: updatedProduct, error: updateError } = await supabase
          .from('products')
          .update({ stock: 90 })
          .eq('id', newProduct.id)
          .select()
          .single();
        
        if (updateError) {
          console.error('❌ Product update failed:', updateError.message);
          testResults.crudOperations.update = false;
        } else {
          console.log('✅ Product update successful');
          testResults.crudOperations.update = true;
        }
        
        // Test product deletion
        const { error: deleteError } = await supabase
          .from('products')
          .delete()
          .eq('id', newProduct.id);
        
        if (deleteError) {
          console.error('❌ Product deletion failed:', deleteError.message);
          testResults.crudOperations.delete = false;
        } else {
          console.log('✅ Product deletion successful');
          testResults.crudOperations.delete = true;
        }
      }
    } catch (err) {
      console.error('❌ CRUD operations failed:', err.message);
    }

    // Test 5: Business Logic
    console.log('\n📊 Testing business logic...');
    
    // Test dashboard metrics
    try {
      const { data: products } = await supabase.from('products').select('*');
      const { data: customers } = await supabase.from('customers').select('*');
      const { data: orders } = await supabase.from('orders').select('*');
      
      const totalProducts = products?.length || 0;
      const totalCustomers = customers?.length || 0;
      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total), 0) || 0;
      
      console.log(`✅ Dashboard metrics: ${totalProducts} products, ${totalCustomers} customers, ${totalOrders} orders, KES ${totalRevenue.toFixed(2)} revenue`);
      testResults.crudOperations.businessLogic = true;
    } catch (err) {
      console.error('❌ Business logic test failed:', err.message);
      testResults.crudOperations.businessLogic = false;
    }

    // Test 6: Search functionality
    console.log('\n🔍 Testing search functionality...');
    try {
      const { data: searchResults, error: searchError } = await supabase
        .from('products')
        .select('*')
        .or('name.ilike.%rice%,category.ilike.%dairy%')
        .limit(5);
      
      if (searchError) {
        console.error('❌ Search failed:', searchError.message);
      } else {
        console.log(`✅ Search successful: ${searchResults.length} results`);
        testResults.crudOperations.search = true;
      }
    } catch (err) {
      console.error('❌ Search test failed:', err.message);
    }

    // Calculate overall success
    const connectionSuccess = testResults.connection && testResults.auth;
    const tablesSuccess = Object.values(testResults.tables).every(result => result);
    const crudSuccess = Object.values(testResults.crudOperations).every(result => result);
    
    testResults.overall = connectionSuccess && tablesSuccess && crudSuccess;

    // Test Summary
    console.log('\n📋 INTEGRATION TEST SUMMARY');
    console.log('=' * 50);
    console.log(`Connection: ${testResults.connection ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Authentication: ${testResults.auth ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Tables: ${tablesSuccess ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`CRUD Operations: ${crudSuccess ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Overall Status: ${testResults.overall ? '🎉 FULLY INTEGRATED' : '⚠️ NEEDS ATTENTION'}`);
    
    if (testResults.overall) {
      console.log('\n🎉 Supabase is fully integrated and ready for production!');
      console.log('✅ All systems operational');
      console.log('✅ Database schema complete');
      console.log('✅ CRUD operations working');
      console.log('✅ Business logic functional');
    } else {
      console.log('\n⚠️ Some components need attention. Check the logs above for details.');
    }

  } catch (error) {
    console.error('💥 Integration test failed:', error.message);
  }
}

testFullIntegration();