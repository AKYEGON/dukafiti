import { createClient } from '@supabase/supabase-js';

// Test Supabase connection with provided credentials
const supabaseUrl = 'https://kwdzbssuovwemthmiuht.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('products')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Error connecting to Supabase:', error);
      return;
    }
    
    console.log('✅ Successfully connected to Supabase!');
    console.log('Products table exists');
    
    // Test other tables
    const tables = ['customers', 'orders', 'notifications'];
    for (const table of tables) {
      const { data: tableData, error: tableError } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });
      
      if (tableError) {
        console.log(`⚠️ Table '${table}': ${tableError.message}`);
      } else {
        console.log(`✅ Table '${table}': exists`);
      }
    }
    
  } catch (err) {
    console.log('❌ Connection test failed:', err.message);
  }
}

testConnection();