import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kwdzbssuovwemthmiuht.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(5);
    
    if (productsError) {
      console.error('Error accessing products table:', productsError);
      return;
    }
    
    console.log('✓ Products table accessible, found:', products?.length || 0, 'products');
    
    // Test authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.log('Auth check (expected null for anon):', authError.message);
    } else {
      console.log('Current user:', user ? user.email : 'Anonymous');
    }
    
    // Test other tables
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(3);
    
    if (customersError) {
      console.error('Error accessing customers table:', customersError);
    } else {
      console.log('✓ Customers table accessible, found:', customers?.length || 0, 'customers');
    }
    
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(3);
    
    if (ordersError) {
      console.error('Error accessing orders table:', ordersError);
    } else {
      console.log('✓ Orders table accessible, found:', orders?.length || 0, 'orders');
    }
    
    console.log('✓ Supabase connection test completed successfully!');
    
  } catch (error) {
    console.error('Supabase connection test failed:', error);
  }
}

testSupabaseConnection();