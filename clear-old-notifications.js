import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kwdzbssuovwemthmiuht.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU0MTIwNiwiZXhwIjoyMDY3MTE3MjA2fQ.zSvksJ4fZLhaXKs8Ir_pq-yse-8x1NTKFTCWdiSLweQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearAndCreateRealNotifications() {
  console.log('=== CLEANING UP NOTIFICATIONS ===');
  
  try {
    // 1. Get current notifications
    const { data: currentNotifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (fetchError) {
      console.error('❌ Failed to fetch notifications:', fetchError);
      return;
    }
    
    console.log(`Found ${currentNotifications.length} existing notifications`);
    
    // 2. Clear old test notifications (keep only notifications from today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .lt('created_at', today.toISOString());
      
    if (deleteError) {
      console.error('❌ Failed to delete old notifications:', deleteError);
    } else {
      console.log('✅ Cleared old notifications');
    }
    
    // 3. Check for customers with overdue balances and create real credit reminders
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .gt('balance', 0);
      
    if (customersError) {
      console.error('❌ Failed to fetch customers:', customersError);
    } else {
      console.log(`Found ${customers.length} customers with credit balances`);
      
      // Create credit reminders for customers with balances
      for (const customer of customers) {
        if (customer.balance > 0) {
          const { error: notifyError } = await supabase
            .from('notifications')
            .insert([{
              type: 'credit',
              title: 'Payment Reminder',
              message: `${customer.name} owes KES ${customer.balance.toLocaleString()}`,
              is_read: false
            }]);
            
          if (!notifyError) {
            console.log(`✅ Created credit reminder for ${customer.name}`);
          }
        }
      }
    }
    
    // 4. Check for low stock products and create alerts
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .not('stock', 'is', null)
      .lte('stock', 10);
      
    if (productsError) {
      console.error('❌ Failed to fetch products:', productsError);
    } else {
      console.log(`Found ${products.length} low stock products`);
      
      // Create low stock alerts
      for (const product of products) {
        if (product.stock !== null && product.stock <= 10) {
          const { error: notifyError } = await supabase
            .from('notifications')
            .insert([{
              type: 'low_stock',
              title: 'Low Stock Alert',
              message: `${product.name} is running low (Stock: ${product.stock})`,
              is_read: false
            }]);
            
          if (!notifyError) {
            console.log(`✅ Created low stock alert for ${product.name}`);
          }
        }
      }
    }
    
    console.log('✅ Notifications cleanup and refresh complete');
    
  } catch (error) {
    console.error('💥 Script failed:', error);
  }
}

clearAndCreateRealNotifications();