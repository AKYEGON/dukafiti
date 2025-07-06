import { createClient } from '@supabase/supabase-js';

// Test Supabase real-time notifications directly
const supabaseUrl = 'https://kwdzbssuovwemthmiuht.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🧪 Testing Supabase Real-time Notifications');

async function testNotificationsSystem() {
  console.log('\n📡 Step 1: Testing basic connection...');
  
  try {
    const { data, error } = await supabase.from('notifications').select('count').limit(1);
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }
    console.log('✅ Basic connection successful');
  } catch (err) {
    console.error('❌ Connection test failed:', err);
    return;
  }

  console.log('\n📡 Step 2: Setting up real-time subscription...');
  
  const subscription = supabase
    .channel('test-notifications-channel')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: 'user_id=eq.1'
    }, (payload) => {
      console.log('🚀 Real-time INSERT received:', {
        id: payload.new.id,
        title: payload.new.title,
        type: payload.new.type,
        created_at: payload.new.created_at
      });
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'notifications',
      filter: 'user_id=eq.1'
    }, (payload) => {
      console.log('🔄 Real-time UPDATE received:', {
        id: payload.new.id,
        title: payload.new.title,
        is_read: payload.new.is_read
      });
    })
    .subscribe((status) => {
      console.log('📊 Subscription status:', status);
      
      if (status === 'SUBSCRIBED') {
        console.log('✅ Real-time subscription is active!');
        console.log('\n🧪 Step 3: Creating test notification...');
        createTestNotification();
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Real-time subscription failed');
      }
    });

  async function createTestNotification() {
    try {
      const testData = {
        type: 'sync_failed',
        title: 'Real-time Test Notification',
        message: `Test notification created at ${new Date().toLocaleTimeString()}`,
        user_id: 1,
        is_read: false
      };

      console.log('Creating notification with data:', testData);

      const { data, error } = await supabase
        .from('notifications')
        .insert([testData])
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create test notification:', error);
      } else {
        console.log('✅ Test notification created:', data);
        
        // Test marking as read after 3 seconds
        setTimeout(async () => {
          console.log('\n🧪 Step 4: Testing mark as read...');
          const { error: updateError } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', data.id);
          
          if (updateError) {
            console.error('❌ Failed to mark as read:', updateError);
          } else {
            console.log('✅ Notification marked as read');
          }
        }, 3000);
      }
    } catch (err) {
      console.error('❌ Error in createTestNotification:', err);
    }
  }

  // Cleanup after 10 seconds
  setTimeout(() => {
    console.log('\n🧹 Cleaning up subscription...');
    subscription.unsubscribe();
    console.log('✅ Test completed');
  }, 10000);
}

testNotificationsSystem();