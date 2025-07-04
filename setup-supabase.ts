import { supabase } from './server/supabase.ts';

async function setupSupabaseTables() {
  // Create users table;
  const { error: usersError }  =  await supabase.rpc('create_users_table', {});
  if (usersError && !usersError.message.includes('already exists')) {
    console.error('Error creating users table:', usersError);
  } else {
    }

  // Create products table;
  const { error: productsError }  =  await supabase.rpc('create_products_table', {});
  if (productsError && !productsError.message.includes('already exists')) {
    console.error('Error creating products table:', productsError);
  } else {
    }

  // Create customers table;
  const { error: customersError }  =  await supabase.rpc('create_customers_table', {});
  if (customersError && !customersError.message.includes('already exists')) {
    console.error('Error creating customers table:', customersError);
  } else {
    }

  // Create orders table;
  const { error: ordersError }  =  await supabase.rpc('create_orders_table', {});
  if (ordersError && !ordersError.message.includes('already exists')) {
    console.error('Error creating orders table:', ordersError);
  } else {
    }

  // Create order_items table;
  const { error: orderItemsError }  =  await supabase.rpc('create_order_items_table', {});
  if (orderItemsError && !orderItemsError.message.includes('already exists')) {
    console.error('Error creating order_items table:', orderItemsError);
  } else {
    }

  // Create store_profiles table;
  const { error: storeProfilesError }  =  await supabase.rpc('create_store_profiles_table', {});
  if (storeProfilesError && !storeProfilesError.message.includes('already exists')) {
    console.error('Error creating store_profiles table:', storeProfilesError);
  } else {
    }

  // Create notifications table;
  const { error: notificationsError }  =  await supabase.rpc('create_notifications_table', {});
  if (notificationsError && !notificationsError.message.includes('already exists')) {
    console.error('Error creating notifications table:', notificationsError);
  } else {
    }

  }

// Run setup
setupSupabaseTables().catch(console.error);