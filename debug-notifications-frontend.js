// Debug script to run in browser console
console.log('=== NOTIFICATIONS DEBUG SCRIPT ===');

// Check if the hook is working
const checkNotifications = async () => {
  try {
    // Import the Supabase client
    const { supabase } = await import('/src/lib/supabase.js');
    
    console.log('1. Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('notifications')
      .select('count(*)')
      .single();
      
    if (testError) {
      console.error('❌ Connection failed:', testError);
      return;
    }
    
    console.log('✅ Supabase connected');
    
    console.log('2. Fetching all notifications...');
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('❌ Fetch failed:', error);
      return;
    }
    
    console.log(`✅ Found ${notifications.length} notifications`);
    console.log('Raw notifications data:', notifications);
    
    console.log('3. Creating a new test notification...');
    const { data: newNotification, error: createError } = await supabase
      .from('notifications')
      .insert([{
        type: 'low_stock',
        title: 'DEBUG TEST: Low Stock Alert',
        message: 'This is a test notification created by debug script',
        is_read: false
      }])
      .select()
      .single();
      
    if (createError) {
      console.error('❌ Create failed:', createError);
    } else {
      console.log('✅ Test notification created:', newNotification);
    }
    
  } catch (error) {
    console.error('💥 Debug script failed:', error);
  }
};

checkNotifications();