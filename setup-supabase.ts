import { supabase } from './server/supabase.ts';

async function setupSupabaseTables() {
  console.log('Setting up Supabase database tables...');

  // Create users table
  const { error: usersError } = await supabase.rpc('create_users_table', {});
  if (usersError && !usersError.message.includes('already exists')) {
    console.error('Error creating users table:', usersError);
  } else {
    console.log('✅ Users table ready');
  }

  // Create products table
  const { error: productsError } = await supabase.rpc('create_products_table', {});
  if (productsError && !productsError.message.includes('already exists')) {
    console.error('Error creating products table:', productsError);
  } else {
    console.log('✅ Products table ready');
  }

  // Create customers table
  const { error: customersError } = await supabase.rpc('create_customers_table', {});
  if (customersError && !customersError.message.includes('already exists')) {
    console.error('Error creating customers table:', customersError);
  } else {
    console.log('✅ Customers table ready');
  }

  // Create orders table
  const { error: ordersError } = await supabase.rpc('create_orders_table', {});
  if (ordersError && !ordersError.message.includes('already exists')) {
    console.error('Error creating orders table:', ordersError);
  } else {
    console.log('✅ Orders table ready');
  }

  // Create order_items table
  const { error: orderItemsError } = await supabase.rpc('create_order_items_table', {});
  if (orderItemsError && !orderItemsError.message.includes('already exists')) {
    console.error('Error creating order_items table:', orderItemsError);
  } else {
    console.log('✅ Order items table ready');
  }

  // Create store_profiles table
  const { error: storeProfilesError } = await supabase.rpc('create_store_profiles_table', {});
  if (storeProfilesError && !storeProfilesError.message.includes('already exists')) {
    console.error('Error creating store_profiles table:', storeProfilesError);
  } else {
    console.log('✅ Store profiles table ready');
  }

  // Create notifications table
  const { error: notificationsError } = await supabase.rpc('create_notifications_table', {});
  if (notificationsError && !notificationsError.message.includes('already exists')) {
    console.error('Error creating notifications table:', notificationsError);
  } else {
    console.log('✅ Notifications table ready');
  }

  console.log('Database setup completed!');
}

// Run setup
setupSupabaseTables().catch(console.error);