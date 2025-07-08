import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kwdzbssuovwemthmiuht.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testNotifications() {
  try {
    console.log('Testing notifications data...');
    
    // Check existing notifications
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching notifications:', error);
      return;
    }
    
    console.log('Found notifications:', notifications?.length || 0);
    if (notifications && notifications.length > 0) {
      console.log('Sample notification:', notifications[0]);
    }
    
    // Create a test notification
    const testNotification = {
      type: 'low_stock',
      entity_id: crypto.randomUUID(),
      title: 'Test Low Stock Alert',
      message: 'Test product is running low (Stock: 2)',
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
    } else {
      console.log('Test notification created:', newNotification);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testNotifications();