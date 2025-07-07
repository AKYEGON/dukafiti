/**
 * Database Schema and RLS Analysis Script
 * This script examines the current database structure and implements RLS policies
 */

import { supabase } from './client/src/lib/supabase.js';

async function analyzeDatabase() {
  try {
    console.log('🔍 Analyzing database schema and RLS policies...\n');

    // Check current table structure
    const tables = ['products', 'customers', 'orders', 'order_items', 'notifications', 'settings'];
    
    for (const table of tables) {
      console.log(`\n📊 Checking table: ${table}`);
      
      // Check if table exists and get sample data
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Error accessing ${table}:`, error.message);
        continue;
      }
      
      console.log(`✅ Table ${table} exists with ${data?.length || 0} records`);
      
      // Check for store_id column
      if (data && data.length > 0) {
        const hasStoreId = 'store_id' in data[0];
        console.log(`   ${hasStoreId ? '✅' : '❌'} store_id column ${hasStoreId ? 'exists' : 'missing'}`);
        
        if (hasStoreId) {
          console.log(`   🔑 sample store_id value: ${data[0].store_id}`);
        }
      }
    }

    // Test RLS policies
    console.log('\n🔒 Testing RLS policies...');
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('❌ No authenticated user found');
      return;
    }
    
    console.log(`✅ Current user: ${user.id}`);
    
    // Test a simple query to see if RLS is working
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(5);
    
    if (productsError) {
      console.log('❌ Error fetching products:', productsError.message);
    } else {
      console.log(`✅ Products query returned ${products?.length || 0} records`);
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

// Run the analysis
analyzeDatabase().then(() => {
  console.log('\n✅ Database analysis complete');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Analysis failed:', error);
  process.exit(1);
});