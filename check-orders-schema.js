#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://kwdzbssuovwemthmiuht.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU0MTIwNiwiZXhwIjoyMDY3MTE3MjA2fQ.zSvksJ4fZLhaXKs8Ir_pq-yse-8x1NTKFTCWdiSLweQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Checking orders table structure...');

async function checkOrdersSchema() {
  try {
    // Try to insert a minimal order to see required fields
    console.log('Testing required fields for orders table...');
    
    const testOrder = {
      customer_id: 1,
      customer_name: 'Test Customer'
    };
    
    const { data, error } = await supabase
      .from('orders')
      .insert([testOrder])
      .select();
    
    if (error) {
      console.log('Insert error (shows required fields):', error.message);
      console.log('Full error:', error);
    } else {
      console.log('✅ Test order created:', data);
      
      // Clean up test order
      if (data && data[0]) {
        await supabase
          .from('orders')
          .delete()
          .eq('id', data[0].id);
        console.log('✅ Test order cleaned up');
      }
    }

    // Try different field combinations
    console.log('\nTesting with additional fields...');
    
    const testOrder2 = {
      customer_id: 1,
      customer_name: 'Test Customer',
      total: 100.00,
      payment_method: 'cash',
      status: 'completed'
    };
    
    const { data: data2, error: error2 } = await supabase
      .from('orders')
      .insert([testOrder2])
      .select();
    
    if (error2) {
      console.log('Insert error with total field:', error2.message);
    } else {
      console.log('✅ Test order with total created:', data2);
      
      // Clean up
      if (data2 && data2[0]) {
        await supabase
          .from('orders')
          .delete()
          .eq('id', data2[0].id);
        console.log('✅ Test order cleaned up');
      }
    }

    // Check if there are any existing orders to see the structure
    console.log('\nChecking existing orders structure...');
    const { data: existingOrders, error: existingError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (existingError) {
      console.error('Error fetching existing orders:', existingError.message);
    } else {
      console.log('Existing orders sample:', existingOrders);
    }

  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
  }
}

checkOrdersSchema().catch(console.error);