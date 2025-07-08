#!/usr/bin/env node

// Check current database schema
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kwdzbssuovwemthmiuht.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU0MTIwNiwiZXhwIjoyMDY3MTE3MjA2fQ.zSvksJ4fZLhaXKs8Ir_pq-yse-8x1NTKFTCWdiSLweQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('📊 Checking database schema...');
  
  try {
    // Check table structures
    const { data: tables, error } = await supabase
      .rpc('get_table_columns', { table_names: ['products', 'customers', 'orders', 'notifications', 'order_items'] });
    
    if (error) {
      console.error('Schema check failed:', error.message);
      
      // Fallback: Check each table individually
      const tablesToCheck = ['products', 'customers', 'orders', 'notifications', 'order_items'];
      
      for (const tableName of tablesToCheck) {
        try {
          const { data, error: tableError } = await supabase
            .from(tableName)
            .select('*')
            .limit(0);
          
          if (tableError) {
            console.log(`❌ ${tableName}: ${tableError.message}`);
          } else {
            console.log(`✅ ${tableName}: Table exists`);
          }
        } catch (err) {
          console.log(`❌ ${tableName}: ${err.message}`);
        }
      }
    } else {
      console.log('Schema data:', tables);
    }
    
    // Try to get columns for products table specifically
    console.log('\n🔍 Checking products table columns...');
    
    try {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .limit(1);
      
      if (productError) {
        console.error('Products table error:', productError.message);
      } else {
        console.log('Products table structure available');
      }
    } catch (err) {
      console.error('Products table check failed:', err.message);
    }
    
  } catch (error) {
    console.error('Schema check failed:', error.message);
  }
}

checkSchema();