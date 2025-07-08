import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kwdzbssuovwemthmiuht.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU0MTIwNiwiZXhwIjoyMDY3MTE3MjA2fQ.zSvksJ4fZLhaXKs8Ir_pq-yse-8x1NTKFTCWdiSLweQ'
);

console.log('Checking Supabase database schema...');

// Check main tables
const mainTables = ['users', 'products', 'customers', 'orders', 'order_items', 'notifications'];

for (const table of mainTables) {
  try {
    const { data, error } = await supabase.from(table).select('*').limit(2);
    if (error) {
      console.log(`Table ${table}: Error - ${error.message}`);
    } else {
      console.log(`Table ${table}: ${data.length} records (showing first 2)`);
      if (data.length > 0) {
        console.log('Sample data:', JSON.stringify(data[0], null, 2));
      }
    }
  } catch (err) {
    console.log(`Table ${table}: Exception - ${err.message}`);
  }
}

console.log('\nDatabase schema check complete');