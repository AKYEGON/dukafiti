import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kwdzbssuovwemthmiuht.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  try {
    console.log('Checking notifications table structure...');
    
    // Get sample notification to see actual fields
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Notification fields:', Object.keys(data[0]));
      console.log('Sample data:', data[0]);
    }
    
    // Test creating notification without entity_id
    const testNotification = {
      type: 'low_stock',
      title: 'Schema Test Notification',
      message: 'Testing notification creation without entity_id',
      is_read: false
    };
    
    console.log('Testing notification creation...');
    const { data: newNotification, error: createError } = await supabase
      .from('notifications')
      .insert([testNotification])
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating notification:', createError);
    } else {
      console.log('✓ Notification created successfully:', newNotification);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

checkSchema();