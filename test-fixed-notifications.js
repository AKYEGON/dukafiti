import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kwdzbssuovwemthmiuht.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFixedNotifications() {
  try {
    console.log('Testing fixed notifications system...');
    
    // Create a test notification with corrected schema
    const testNotification = {
      type: 'low_stock',
      title: 'TEST: Stock Alert',
      message: 'This is a test notification to verify the dropdown works',
      user_id: 1,
      is_read: false
    };
    
    console.log('Creating test notification...');
    const { data: newNotification, error: createError } = await supabase
      .from('notifications')
      .insert([testNotification])
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating notification:', createError);
      return;
    }
    
    console.log('✓ Test notification created successfully:', newNotification);
    
    // Fetch recent notifications to verify
    const { data: recent, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (fetchError) {
      console.error('Error fetching notifications:', fetchError);
      return;
    }
    
    console.log('✓ Recent notifications fetched:', recent?.length);
    console.log('Latest notification:', recent?.[0]);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testFixedNotifications();