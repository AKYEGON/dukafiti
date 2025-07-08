import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Service key exists:', !!supabaseServiceKey);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

// Use service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSettingsTable() {
  try {
    console.log('Attempting to create settings table using Supabase REST API...');
    
    // Try to use the raw SQL execution endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql: `
          CREATE TABLE IF NOT EXISTS settings (
              id SERIAL PRIMARY KEY,
              store_name TEXT DEFAULT '',
              owner_name TEXT DEFAULT '',
              address TEXT DEFAULT '',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

          DROP POLICY IF EXISTS "Allow all access to settings" ON settings;
          CREATE POLICY "Allow all access to settings" ON settings 
              FOR ALL 
              USING (true) 
              WITH CHECK (true);

          INSERT INTO settings (store_name, owner_name, address) 
          SELECT '', '', ''
          WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);
        `
      })
    });

    if (!response.ok) {
      console.log('Raw SQL approach failed, trying alternative...');
      
      // Alternative: Try to create using the admin client
      // First check if we can access any existing table to confirm connection
      const { data: products, error: productsError } = await supabaseAdmin
        .from('products')
        .select('id')
        .limit(1);
        
      if (productsError) {
        console.error('Cannot connect to Supabase:', productsError);
        return false;
      }
      
      console.log('Supabase connection verified. Products table accessible.');
      
      // Since we can't create tables via client, let's work around the settings table issue
      // by modifying the application to handle missing settings gracefully
      console.log('Settings table creation requires manual intervention.');
      console.log('Implementing fallback solution in the application...');
      return 'fallback';
    }

    const result = await response.text();
    console.log('SQL execution result:', result);
    return true;
    
  } catch (error) {
    console.error('Error creating settings table:', error);
    return false;
  }
}

const result = await createSettingsTable();

if (result === true) {
  console.log('✅ Settings table created successfully');
} else if (result === 'fallback') {
  console.log('⚠️  Using fallback approach - will modify application');
} else {
  console.log('❌ Settings table creation failed');
}