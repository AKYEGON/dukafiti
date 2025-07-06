import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kwdzbssuovwemthmiuht.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU0MTIwNiwiZXhwIjoyMDY3MTE3MjA2fQ.zSvksJ4fZLhaXKs8Ir_pq-yse-8x1NTKFTCWdiSLweQ';

const supabase = createClient(supabaseUrl, serviceKey);

async function disableRLS() {
  console.log('=== DISABLING RLS POLICIES ===');
  
  // The service role key should already bypass RLS, but let's confirm by testing direct access
  try {
    // Test if we can write to orders table
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        customer_id: null,
        customer_name: 'Test Customer',
        total: 100.0,
        status: 'completed',
        payment_method: 'cash',
      }])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Service role key still blocked by RLS:', error);
      
      // Try to get current RLS status
      const { data: rlsData, error: rlsError } = await supabase
        .from('information_schema.tables')
        .select('table_name, row_security')
        .eq('table_schema', 'public')
        .in('table_name', ['orders', 'order_items', 'products', 'customers']);
      
      if (rlsError) {
        console.error('Error checking RLS status:', rlsError);
      } else {
        console.log('Current RLS status:', rlsData);
      }
    } else {
      console.log('✅ Service role key working correctly:', data);
      
      // Clean up test data
      await supabase.from('orders').delete().eq('id', data.id);
      console.log('✅ Test data cleaned up');
    }
  } catch (error) {
    console.error('💥 Critical error:', error);
  }
}

disableRLS();