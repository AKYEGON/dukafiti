#!/usr/bin/env node

// Check current database schema using Supabase client directly
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kwdzbssuovwemthmiuht.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU0MTIwNiwiZXhwIjoyMDY3MTE3MjA2fQ.zSvksJ4fZLhaXKs8Ir_pq-yse-8x1NTKFTCWdiSLweQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('📊 Checking current database schema...');
  
  try {
    // Check table information schema
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('table_name, column_name, data_type, is_nullable')
      .in('table_name', ['products', 'customers', 'orders', 'notifications', 'order_items'])
      .eq('table_schema', 'public')
      .order('table_name')
      .order('ordinal_position');
    
    if (error) {
      console.error('Schema query failed:', error.message);
      
      // Fallback: Check what exists in each table
      const tables = ['products', 'customers', 'orders', 'notifications', 'order_items'];
      
      for (const table of tables) {
        try {
          const { data, error: tableError } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          if (tableError) {
            console.log(`❌ ${table}: ${tableError.message}`);
          } else {
            console.log(`✅ ${table}: Table exists with ${data.length} sample records`);
            if (data.length > 0) {
              console.log(`   Sample structure:`, Object.keys(data[0]));
            }
          }
        } catch (err) {
          console.log(`❌ ${table}: ${err.message}`);
        }
      }
    } else {
      console.log('Schema information:');
      const tableGroups = {};
      
      columns.forEach(col => {
        if (!tableGroups[col.table_name]) {
          tableGroups[col.table_name] = [];
        }
        tableGroups[col.table_name].push({
          column: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable
        });
      });
      
      Object.keys(tableGroups).forEach(table => {
        console.log(`\n📋 ${table}:`);
        tableGroups[table].forEach(col => {
          console.log(`   ${col.column}: ${col.type} ${col.nullable === 'YES' ? '(nullable)' : '(required)'}`);
        });
      });
    }
    
    // Try to get some sample data to understand structure
    console.log('\n🔍 Checking sample data...');
    
    const { data: sampleProducts, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(3);
    
    if (productsError) {
      console.error('Products sample failed:', productsError.message);
    } else {
      console.log(`Products sample (${sampleProducts.length} records):`, sampleProducts);
    }
    
    const { data: sampleCustomers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(3);
    
    if (customersError) {
      console.error('Customers sample failed:', customersError.message);
    } else {
      console.log(`Customers sample (${sampleCustomers.length} records):`, sampleCustomers);
    }
    
    const { data: sampleOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(3);
    
    if (ordersError) {
      console.error('Orders sample failed:', ordersError.message);
    } else {
      console.log(`Orders sample (${sampleOrders.length} records):`, sampleOrders);
    }
    
  } catch (error) {
    console.error('Schema check failed:', error.message);
  }
}

checkSchema();