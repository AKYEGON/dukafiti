#!/usr/bin/env node

// Test Supabase connection with provided credentials
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kwdzbssuovwemthmiuht.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test 1: Basic connection
    console.log('📡 Testing basic connection...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth connection failed:', authError.message);
    } else {
      console.log('✅ Auth connection successful');
    }
    
    // Test 2: Database tables
    console.log('🗄️ Testing database tables...');
    
    const tables = ['products', 'customers', 'orders', 'notifications'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.error(`❌ ${table} table error:`, error.message);
        } else {
          console.log(`✅ ${table} table accessible (${data?.length || 0} records)`);
        }
      } catch (err) {
        console.error(`❌ ${table} table connection failed:`, err.message);
      }
    }
    
    // Test 3: Test database operations
    console.log('🧪 Testing database operations...');
    
    try {
      // Test product creation
      const testProduct = {
        name: 'Test Product',
        price: 100,
        quantity: 10,
        category: 'test'
      };
      
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert([testProduct])
        .select()
        .single();
      
      if (productError) {
        console.error('❌ Product creation failed:', productError.message);
      } else {
        console.log('✅ Product creation successful:', product.id);
        
        // Clean up test product
        await supabase.from('products').delete().eq('id', product.id);
        console.log('🧹 Test product cleaned up');
      }
      
    } catch (err) {
      console.error('❌ Database operation failed:', err.message);
    }
    
    console.log('\n🎉 Supabase connection test completed!');
    
  } catch (error) {
    console.error('💥 Connection test failed:', error.message);
  }
}

testSupabaseConnection();