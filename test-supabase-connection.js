#!/usr/bin/env node
/**
 * Test Supabase connection with the provided credentials
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testSupabaseConnection() {
  console.log('🔗 Testing Supabase connection...');
  
  // Test with the provided credentials
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kwdzbssuovwemthmiuht.supabase.co';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA';
  
  console.log('📍 Supabase URL:', supabaseUrl);
  console.log('🔑 Using Anon Key:', supabaseKey.substring(0, 20) + '...');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Test basic connection
    console.log('\n1. Testing basic connection...');
    const { data: healthData, error: healthError } = await supabase
      .from('products')
      .select('id')
      .limit(1);
    
    if (healthError) {
      console.error('❌ Connection failed:', healthError.message);
      return;
    }
    
    console.log('✅ Basic connection successful');
    
    // Test table access
    console.log('\n2. Testing table access...');
    const tables = ['products', 'customers', 'orders', 'notifications'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: ${data ? data.length : 0} rows accessible`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }
    
    // Test authentication
    console.log('\n3. Testing authentication...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('⚠️ Auth error:', authError.message);
    } else {
      console.log('✅ Auth system accessible');
      console.log('📊 Current session:', authData.session ? 'Active' : 'None');
    }
    
    console.log('\n🎉 Supabase connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testSupabaseConnection().catch(console.error);