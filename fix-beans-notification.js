/**
 * Fix beans low stock notification - create notification with correct schema
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kwdzbssuovwemthmiuht.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA'
);

async function fixBeansNotification() {
  console.log('=== FIXING BEANS LOW STOCK NOTIFICATION ===\n');
  
  try {
    // 1. Check current notifications table schema
    console.log('1. Checking notifications table schema...');
    const { data: sampleNotification } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);
    
    if (sampleNotification && sampleNotification.length > 0) {
      console.log('✅ Notifications table columns:', Object.keys(sampleNotification[0]));
    }
    
    // 2. Create low stock notification for beans using correct schema
    console.log('\n2. Creating low stock notification for beans...');
    
    // Try the MVP schema first (with entity_id)
    const { data: beansNotification, error: mvpError } = await supabase
      .from('notifications')
      .insert([{
        type: 'low_stock',
        entity_id: '7', // beans product ID
        title: 'Low Stock Alert',
        message: 'beans is running low (Current stock: 10)',
        is_read: false
      }])
      .select()
      .single();
    
    if (mvpError) {
      console.log('❌ MVP schema failed:', mvpError.message);
      
      // Try the original schema (with user_id)
      console.log('   🔄 Trying original schema with user_id...');
      const { data: originalNotification, error: originalError } = await supabase
        .from('notifications')
        .insert([{
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: 'beans is running low (Current stock: 10)',
          user_id: 1,
          is_read: false
        }])
        .select()
        .single();
      
      if (originalError) {
        console.error('❌ Original schema also failed:', originalError);
        return;
      } else {
        console.log('✅ Created notification with original schema:', originalNotification);
      }
    } else {
      console.log('✅ Created notification with MVP schema:', beansNotification);
    }
    
    // 3. Verify the notification was created
    console.log('\n3. Verifying notification creation...');
    const { data: notifications, error: verifyError } = await supabase
      .from('notifications')
      .select('*')
      .eq('type', 'low_stock')
      .ilike('message', '%beans%')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (verifyError) {
      console.error('❌ Error verifying notification:', verifyError);
    } else if (notifications && notifications.length > 0) {
      console.log('✅ Notification verified in database:', notifications[0]);
    } else {
      console.log('❌ No notification found for beans');
    }
    
    // 4. Check all unread notifications
    console.log('\n4. Checking all unread notifications...');
    const { data: allNotifications, error: allError } = await supabase
      .from('notifications')
      .select('*')
      .eq('is_read', false)
      .order('created_at', { ascending: false });
    
    if (allError) {
      console.error('❌ Error fetching all notifications:', allError);
    } else {
      console.log(`📋 Found ${allNotifications.length} unread notifications:`);
      allNotifications.forEach(n => {
        console.log(`   - ${n.type}: ${n.title} - ${n.message}`);
      });
    }
    
    console.log('\n🎯 Beans notification should now appear in the UI!');
    
  } catch (error) {
    console.error('❌ Error in fixing beans notification:', error);
  }
}

// Run the fix
fixBeansNotification();