import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kwdzbssuovwemthmiuht.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testMVPNotifications() {
  console.log('Testing MVP Notifications System...');
  
  try {
    // Check if notifications table exists and what structure it has
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .limit(5);
    
    if (fetchError) {
      console.error('Error fetching notifications:', fetchError);
      console.log('The notifications table may need to be created. Run the MVP setup SQL in Supabase.');
      return;
    }
    
    console.log('✅ Notifications table accessible');
    console.log('Current notifications:', notifications);
    
    // Test creating a low stock notification
    const { data: lowStockNotification, error: lowStockError } = await supabase
      .from('notifications')
      .insert([{
        type: 'low_stock',
        entity_id: 'test-product-id',
        title: 'Low Stock Alert',
        message: 'Test Product is low: 2 left',
        is_read: false
      }])
      .select()
      .single();
    
    if (lowStockError) {
      console.error('Error creating low stock notification:', lowStockError);
    } else {
      console.log('✅ Low stock notification created:', lowStockNotification);
    }
    
    // Test creating a credit reminder notification  
    const { data: creditNotification, error: creditError } = await supabase
      .from('notifications')
      .insert([{
        type: 'credit',
        entity_id: 'test-customer-id',
        title: 'Payment Reminder',
        message: 'Test Customer owes KES 2,500',
        is_read: false
      }])
      .select()
      .single();
    
    if (creditError) {
      console.error('Error creating credit notification:', creditError);
    } else {
      console.log('✅ Credit reminder notification created:', creditNotification);
    }
    
    console.log('🎉 MVP Notifications system test completed!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testMVPNotifications();