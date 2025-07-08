import { createClient } from '@supabase/supabase-js';

async function testSupabaseHTTP() {
  const supabaseUrl = 'https://kwdzbssuovwemthmiuht.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU0MTIwNiwiZXhwIjoyMDY3MTE3MjA2fQ.zSvksJ4fZLhaXKs8Ir_pq-yse-8x1NTKFTCWdiSLweQ';

  try {
    console.log('Testing Supabase HTTP connection...');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Test with a simple query
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('Supabase query error (expected if tables don\'t exist):', error.message);
    } else {
      console.log('Connected to Supabase successfully via HTTP!');
      console.log('Data:', data);
    }
    
  } catch (error) {
    console.error('Supabase HTTP connection error:', error);
  }
}

testSupabaseHTTP();