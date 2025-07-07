#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://kwdzbssuovwemthmiuht.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU0MTIwNiwiZXhwIjoyMDY3MTE3MjA2fQ.zSvksJ4fZLhaXKs8Ir_pq-yse-8x1NTKFTCWdiSLweQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Checking Supabase database schema...');

async function checkSchema() {
  try {
    // Get table schemas using information_schema
    const { data: tables, error } = await supabase
      .rpc('get_table_columns');

    if (error) {
      console.log('Using alternative method to check schemas...');
      
      // Check each table individually
      const tables = ['products', 'customers', 'orders', 'order_items', 'notifications'];
      
      for (const tableName of tables) {
        console.log(`\n📋 Table: ${tableName}`);
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
            
          if (error) {
            console.error(`❌ Error accessing ${tableName}:`, error.message);
          } else {
            console.log(`✅ ${tableName} accessible, sample record:`, data[0] || 'No data');
          }
        } catch (err) {
          console.error(`❌ ${tableName} error:`, err.message);
        }
      }
    } else {
      console.log('Schema info:', tables);
    }

  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
  }
}

checkSchema().catch(console.error);