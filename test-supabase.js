import { createClient } from '@supabase/supabase-js';

// Use the provided keys
const supabaseUrl = 'https://kwdzbssuovwemthmiuht.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabase() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log('✓ Connected to Supabase successfully');
    console.log('✓ Products table accessible');
    console.log('Found products:', data?.length || 0);
    
    // Test other tables
    const { data: customers } = await supabase
      .from('customers')
      .select('*')
      .limit(3);
    
    console.log('✓ Customers table accessible, found:', customers?.length || 0);
    
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .limit(3);
    
    console.log('✓ Orders table accessible, found:', orders?.length || 0);
    
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testSupabase();