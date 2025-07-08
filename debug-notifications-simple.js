// Simple notifications debug without external deps
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kwdzbssuovwemthmiuht.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugNotifications() {
  try {
    console.log('=== NOTIFICATIONS DEEP DEBUG ===');
    
    // 1. Check if notifications table exists and get structure
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('❌ Error fetching notifications:', error);
      return;
    }
    
    console.log(`✅ Found ${notifications.length} notifications in database`);
    
    if (notifications.length > 0) {
      console.log('\n📋 Sample notifications:');
      notifications.slice(0, 5).forEach((n, i) => {
        console.log(`${i + 1}. ID: ${n.id} | Type: ${n.type} | Title: "${n.title}" | Read: ${n.is_read} | Created: ${n.created_at}`);
      });
    } else {
      console.log('🔍 Creating test notifications...');
      
      // Create a few test notifications
      const testNotifications = [
        {
          type: 'credit',
          title: 'Payment Reminder',
          message: 'Alice Nyong\'o owes KES 650 (7+ days overdue)',
          is_read: false
        },
        {
          type: 'credit', 
          title: 'Payment Reminder',
          message: 'Peter Kiprotich owes KES 1200 (7+ days overdue)',
          is_read: false
        },
        {
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: 'Coca Cola 500ml is running low (Stock: 3)',
          is_read: false
        }
      ];
      
      for (const notification of testNotifications) {
        const { data, error } = await supabase
          .from('notifications')
          .insert([notification])
          .select()
          .single();
          
        if (error) {
          console.error('❌ Error creating test notification:', error);
        } else {
          console.log(`✅ Created: ${data.title}`);
        }
      }
    }
    
    // 2. Check real-time functionality
    console.log('\n🔄 Testing real-time subscription...');
    
  } catch (error) {
    console.error('💥 Debug failed:', error);
  }
}

debugNotifications();