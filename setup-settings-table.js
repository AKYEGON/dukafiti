import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupSettingsTable() {
  try {
    console.log('Setting up settings table...');
    
    // First, let's check what tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.log('Cannot check existing tables, but continuing...');
    } else {
      console.log('Existing tables:', tables?.map(t => t.table_name));
    }
    
    // Since we cannot directly execute DDL with RLS via the client, 
    // let's try to insert a record to see if the table exists
    console.log('Testing if settings table exists by attempting insert...');
    
    const { data: testData, error: testError } = await supabase
      .from('settings')
      .select('*')
      .limit(1);
    
    if (testError && testError.code === '42P01') {
      console.log('Settings table does not exist. You need to create it manually in Supabase SQL Editor.');
      console.log('Please run the following SQL in your Supabase SQL Editor:');
      console.log(`
-- Create settings table for DukaFiti store profile
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    store_name TEXT DEFAULT '',
    owner_name TEXT DEFAULT '',
    address TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all access (for simplicity)
CREATE POLICY "Allow all access to settings" ON settings 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- Insert default settings row if none exists
INSERT INTO settings (store_name, owner_name, address) 
SELECT '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);
      `);
      
      return false;
    } else if (testError) {
      console.error('Error checking settings table:', testError);
      return false;
    } else {
      console.log('Settings table exists!');
      console.log('Current settings data:', testData);
      
      // If no data exists, insert default
      if (!testData || testData.length === 0) {
        console.log('No settings data found, inserting default...');
        const { data: insertData, error: insertError } = await supabase
          .from('settings')
          .insert([{
            store_name: '',
            owner_name: '',
            address: ''
          }])
          .select()
          .single();
        
        if (insertError) {
          console.error('Failed to insert default settings:', insertError);
          return false;
        }
        
        console.log('Default settings inserted:', insertData);
      }
      
      return true;
    }
  } catch (error) {
    console.error('Error in setupSettingsTable:', error);
    return false;
  }
}

setupSettingsTable().then(success => {
  if (success) {
    console.log('✅ Settings table setup completed successfully');
  } else {
    console.log('❌ Settings table setup failed - manual creation required');
  }
  process.exit(success ? 0 : 1);
});