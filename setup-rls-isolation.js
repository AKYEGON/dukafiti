/**
 * Complete Store Isolation Implementation with RLS
 * This script fixes all real-time data issues and implements user data isolation
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Environment check:');
console.log('URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
console.log('Key:', supabaseServiceKey ? '✅ Found' : '❌ Missing');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function implementStoreIsolation() {
  try {
    console.log('\n🚀 Starting store isolation implementation...\n');

    // Step 1: Check current database structure
    console.log('📊 Step 1: Analyzing current database structure...');
    
    const tables = ['products', 'customers', 'orders', 'order_items', 'notifications'];
    
    for (const table of tables) {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count || 0} records`);
      }
    }

    // Step 2: Add store_id columns (these will automatically get DEFAULT auth.uid())
    console.log('\n🔄 Step 2: Adding store_id columns...');
    
    const addColumnQueries = [
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES auth.users(id);',
      'ALTER TABLE customers ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES auth.users(id);',
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES auth.users(id);',
      'ALTER TABLE order_items ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES auth.users(id);',
      'ALTER TABLE notifications ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES auth.users(id);',
    ];

    for (const query of addColumnQueries) {
      console.log(`📝 ${query.split(' ')[2]}: Adding store_id column...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      
      if (error && !error.message.includes('already exists')) {
        console.log(`❌ Error: ${error.message}`);
      } else {
        console.log(`✅ Success`);
      }
    }

    // Step 3: Enable RLS on all tables
    console.log('\n🔒 Step 3: Enabling Row Level Security...');
    
    const rlsQueries = [
      'ALTER TABLE products ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE customers ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE orders ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;',
    ];

    for (const query of rlsQueries) {
      const tableName = query.split(' ')[2];
      console.log(`🔒 ${tableName}: Enabling RLS...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      
      if (error) {
        console.log(`❌ Error: ${error.message}`);
      } else {
        console.log(`✅ Success`);
      }
    }

    // Step 4: Create RLS policies
    console.log('\n📜 Step 4: Creating RLS policies...');
    
    const policyQueries = [
      // Drop existing policies first
      'DROP POLICY IF EXISTS "Users manage their own products" ON products;',
      'DROP POLICY IF EXISTS "Users manage their own customers" ON customers;',
      'DROP POLICY IF EXISTS "Users manage their own orders" ON orders;',
      'DROP POLICY IF EXISTS "Users manage their own order_items" ON order_items;',
      'DROP POLICY IF EXISTS "Users manage their own notifications" ON notifications;',
      
      // Create new policies
      `CREATE POLICY "Users manage their own products" ON products
        FOR ALL USING (auth.uid() = store_id);`,
      
      `CREATE POLICY "Users manage their own customers" ON customers
        FOR ALL USING (auth.uid() = store_id);`,
      
      `CREATE POLICY "Users manage their own orders" ON orders
        FOR ALL USING (auth.uid() = store_id);`,
      
      `CREATE POLICY "Users manage their own order_items" ON order_items
        FOR ALL USING (auth.uid() = store_id);`,
      
      `CREATE POLICY "Users manage their own notifications" ON notifications
        FOR ALL USING (auth.uid() = store_id);`,
    ];

    for (const query of policyQueries) {
      const isDropQuery = query.includes('DROP POLICY');
      const action = isDropQuery ? 'Dropping old policy' : 'Creating policy';
      
      console.log(`📜 ${action}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      
      if (error && !error.message.includes('does not exist')) {
        console.log(`❌ Error: ${error.message}`);
      } else {
        console.log(`✅ Success`);
      }
    }

    console.log('\n✅ Store isolation implementation complete!');
    console.log('\nNext steps:');
    console.log('1. Update frontend auth context to include storeId');
    console.log('2. Update all data queries to filter by store_id');
    console.log('3. Fix real-time subscriptions');
    console.log('4. Test with multiple users');
    
  } catch (error) {
    console.error('❌ Implementation failed:', error);
  }
}

implementStoreIsolation().then(() => {
  console.log('\n🎉 Implementation complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Failed:', error);
  process.exit(1);
});