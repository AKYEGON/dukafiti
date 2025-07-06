import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndCreateSettingsTable() {
  try {
    console.log('Checking if settings table exists...');
    
    // Try to query the settings table
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      console.log('Settings table not found. Creating it...');
      
      // Create the settings table using RPC call or direct SQL
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS settings (
            id SERIAL PRIMARY KEY,
            store_name TEXT,
            owner_name TEXT,
            address TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
          
          -- Enable RLS
          ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
          
          -- Create a policy that allows everyone to read and write (for demo purposes)
          CREATE POLICY "Allow all access" ON settings FOR ALL USING (true);
        `
      });
      
      if (createError) {
        console.error('Failed to create settings table via RPC:', createError);
        console.log('Trying alternative approach...');
        
        // Alternative: Try creating a simple record to see if table exists
        const { error: insertError } = await supabase
          .from('settings')
          .insert([{
            store_name: 'Default Store',
            owner_name: '',
            address: ''
          }]);
        
        if (insertError) {
          console.error('Settings table does not exist and cannot be created:', insertError);
          return false;
        }
      }
      
      console.log('Settings table created successfully');
    } else if (error) {
      console.error('Error checking settings table:', error);
      return false;
    } else {
      console.log('Settings table exists. Current data:', data);
    }
    
    return true;
  } catch (error) {
    console.error('Error in checkAndCreateSettingsTable:', error);
    return false;
  }
}

checkAndCreateSettingsTable();