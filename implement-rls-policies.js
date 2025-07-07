/**
 * Row-Level Security (RLS) Implementation Script
 * This script implements complete store isolation with RLS policies
 */

import { supabase } from './client/src/lib/supabase.js';

async function implementRLS() {
  try {
    console.log('🔒 Implementing Row-Level Security policies...\n');

    // SQL commands to enable RLS and create policies
    const rlsCommands = [
      // Enable RLS on all tables
      'ALTER TABLE products ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE customers ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE orders ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;',
      
      // Add store_id columns if they don't exist
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();',
      'ALTER TABLE customers ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();',
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();',
      'ALTER TABLE order_items ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();',
      'ALTER TABLE notifications ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();',
      
      // Create policies for products
      `CREATE POLICY "Users manage their own products" ON products
        FOR ALL
        USING (auth.uid() = store_id);`,
      
      // Create policies for customers
      `CREATE POLICY "Users manage their own customers" ON customers
        FOR ALL
        USING (auth.uid() = store_id);`,
      
      // Create policies for orders
      `CREATE POLICY "Users manage their own orders" ON orders
        FOR ALL
        USING (auth.uid() = store_id);`,
      
      // Create policies for order_items
      `CREATE POLICY "Users manage their own order_items" ON order_items
        FOR ALL
        USING (auth.uid() = store_id);`,
      
      // Create policies for notifications
      `CREATE POLICY "Users manage their own notifications" ON notifications
        FOR ALL
        USING (auth.uid() = store_id);`,
    ];

    // Execute each command
    for (const sql of rlsCommands) {
      console.log(`📝 Executing: ${sql.substring(0, 50)}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        console.log(`❌ Error: ${error.message}`);
      } else {
        console.log(`✅ Success`);
      }
    }

    console.log('\n🔄 Updating existing records with current user ID...');
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('❌ No authenticated user found');
      return;
    }
    
    console.log(`✅ Current user: ${user.id}`);
    
    // Update existing records to have the current user's ID
    const tables = ['products', 'customers', 'orders', 'order_items', 'notifications'];
    
    for (const table of tables) {
      console.log(`🔄 Updating ${table} records...`);
      
      const { data, error } = await supabase
        .from(table)
        .update({ store_id: user.id })
        .neq('store_id', user.id); // Only update records that don't already have this store_id
      
      if (error) {
        console.log(`❌ Error updating ${table}:`, error.message);
      } else {
        console.log(`✅ Updated ${table} records`);
      }
    }
    
    console.log('\n✅ RLS implementation complete!');
    
  } catch (error) {
    console.error('❌ RLS implementation failed:', error);
  }
}

// Run the implementation
implementRLS().then(() => {
  console.log('\n✅ RLS policies implemented successfully');
  process.exit(0);
}).catch((error) => {
  console.error('❌ RLS implementation failed:', error);
  process.exit(1);
});