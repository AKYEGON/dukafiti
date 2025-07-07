import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kwdzbssuovwemthmiuht.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA'
);

async function checkData() {
  console.log('🔍 Checking current Supabase data...\n');
  
  try {
    // Check products
    const { data: products } = await supabase.from('products').select('*').limit(5);
    console.log(`📦 Products: ${products?.length || 0} records`);
    if (products && products.length > 0) {
      console.log('   Sample:', products[0].name, `- KES ${products[0].price}`);
    }
    
    // Check customers
    const { data: customers } = await supabase.from('customers').select('*').limit(5);
    console.log(`👥 Customers: ${customers?.length || 0} records`);
    if (customers && customers.length > 0) {
      console.log('   Sample:', customers[0].name, `- Balance: KES ${customers[0].balance || 0}`);
    }
    
    // Check orders
    const { data: orders } = await supabase.from('orders').select('*').limit(5);
    console.log(`🛒 Orders: ${orders?.length || 0} records`);
    if (orders && orders.length > 0) {
      console.log('   Sample: Order', orders[0].id, `- Total: KES ${orders[0].total}`);
    }
    
    // Check notifications
    const { data: notifications } = await supabase.from('notifications').select('*').limit(3);
    console.log(`🔔 Notifications: ${notifications?.length || 0} records`);
    if (notifications && notifications.length > 0) {
      console.log('   Latest:', notifications[0].title);
    }
    
    // Check users (auth table)
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    if (!usersError && users) {
      console.log(`👤 Users: ${users.length} registered`);
      if (users.length > 0) {
        console.log('   Sample user:', users[0].email);
      }
    }
    
    console.log('\n✅ Data check complete!');
    
  } catch (error) {
    console.error('❌ Error checking data:', error);
  }
}

checkData();