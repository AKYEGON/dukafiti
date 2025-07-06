import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kwdzbssuovwemthmiuht.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU0MTIwNiwiZXhwIjoyMDY3MTE3MjA2fQ.zSvksJ4fZLhaXKs8Ir_pq-yse-8x1NTKFTCWdiSLweQ'; // Using service role key to bypass RLS

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data: tables, error: tablesError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (tablesError) {
      console.error('Error accessing products table:', tablesError);
      return;
    }
    
    console.log('✓ Products table accessible, sample:', tables?.[0]);
    
    // Test order creation (the failing part)
    const testOrder = {
      customer_name: 'Test Customer',
      total: 100.00,
      status: 'completed',
      payment_method: 'cash'
    };
    
    console.log('Testing order creation with:', testOrder);
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([testOrder])
      .select()
      .single();
    
    if (orderError) {
      console.error('Order creation failed:', orderError);
      return;
    }
    
    console.log('✓ Order created successfully:', order);
    
    // Clean up test order
    await supabase.from('orders').delete().eq('id', order.id);
    console.log('✓ Test order cleaned up');
    
    // Test dashboard metrics
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('total, created_at');
    
    if (ordersError) {
      console.error('Dashboard metrics test failed:', ordersError);
    } else {
      console.log('✓ Dashboard metrics accessible, orders count:', ordersData?.length || 0);
    }
    
  } catch (error) {
    console.error('Test failed with exception:', error);
  }
}

testSupabaseConnection();