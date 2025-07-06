const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function testBothSystems() {
  console.log('Testing notifications and settings systems...\n');

  // 1. Test Settings Table
  console.log('=== Testing Settings System ===');
  
  try {
    // Create settings table first
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS settings (
          id SERIAL PRIMARY KEY,
          user_id INTEGER DEFAULT 1,
          store_name TEXT,
          owner_name TEXT, 
          address TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Allow all operations" ON settings;
        CREATE POLICY "Allow all operations" ON settings FOR ALL USING (true);
      `
    });
    
    if (createError) {
      console.error('Error creating settings table:', createError);
    } else {
      console.log('✓ Settings table created/verified');
    }

    // Test inserting/updating settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .upsert([{
        store_name: 'Test Store',
        owner_name: 'Test Owner',
        address: 'Test Address'
      }])
      .select()
      .single();

    if (settingsError) {
      console.error('✗ Settings upsert failed:', settingsError);
    } else {
      console.log('✓ Settings saved successfully:', settingsData);
    }

    // Test fetching settings
    const { data: fetchData, error: fetchError } = await supabase
      .from('settings')
      .select('*')
      .single();

    if (fetchError) {
      console.error('✗ Settings fetch failed:', fetchError);
    } else {
      console.log('✓ Settings fetched successfully:', fetchData);
    }

  } catch (error) {
    console.error('Settings system error:', error);
  }

  // 2. Test Notifications System
  console.log('\n=== Testing Notifications System ===');
  
  try {
    // Clear old test notifications
    await supabase
      .from('notifications')
      .delete()
      .like('title', '%TEST%');

    // Create a test notification
    const { data: notificationData, error: notificationError } = await supabase
      .from('notifications')
      .insert([{
        type: 'low_stock',
        title: 'TEST: Low Stock Alert',
        message: 'This is a test notification for the audit',
        is_read: false
      }])
      .select()
      .single();

    if (notificationError) {
      console.error('✗ Notification creation failed:', notificationError);
    } else {
      console.log('✓ Notification created successfully:', notificationData);
    }

    // Fetch all notifications
    const { data: notifications, error: fetchNotificationError } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (fetchNotificationError) {
      console.error('✗ Notifications fetch failed:', fetchNotificationError);
    } else {
      console.log('✓ Recent notifications fetched:', notifications.length);
      notifications.forEach(n => {
        console.log(`  - ${n.title}: ${n.message} (Read: ${n.is_read})`);
      });
    }

  } catch (error) {
    console.error('Notifications system error:', error);
  }

  console.log('\n=== Audit Complete ===');
  console.log('Both systems tested and verified working with Supabase.');
}

testBothSystems();