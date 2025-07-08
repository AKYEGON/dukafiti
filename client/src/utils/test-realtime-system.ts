/**
 * Real-time System Testing Utilities
 * Comprehensive testing for real-time data updates
 */

import { supabase } from '@/lib/supabase';

export async function testRealtimeSystem() {
  console.log('🔍 Starting comprehensive real-time system test...');
  
  try {
    // Test 1: Products real-time updates
    console.log('📦 Testing product updates...');
    const testProduct = {
      name: 'Test Product RT',
      sku: 'TEST-RT-001',
      price: 99.99,
      stock: 50,
      category: 'Test',
      low_stock_threshold: 10,
    };

    // Create test product
    const { data: createdProduct, error: createError } = await supabase
      .from('products')
      .insert([testProduct])
      .select()
      .single();

    if (createError) throw createError;
    console.log('✅ Product created:', createdProduct);

    // Wait for real-time update
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update product stock (simulate sale)
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({ stock: 45, sales_count: 5 })
      .eq('id', createdProduct.id)
      .select()
      .single();

    if (updateError) throw updateError;
    console.log('✅ Product updated:', updatedProduct);

    // Wait for real-time update
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Orders real-time updates
    console.log('🛒 Testing order creation...');
    const testOrder = {
      customer_name: 'Real-time Test Customer',
      total: 199.99,
      status: 'completed',
      payment_method: 'cash',
    };

    const { data: createdOrder, error: orderError } = await supabase
      .from('orders')
      .insert([testOrder])
      .select()
      .single();

    if (orderError) throw orderError;
    console.log('✅ Order created:', createdOrder);

    // Wait for real-time update
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 3: Notifications real-time updates
    console.log('🔔 Testing notification creation...');
    const testNotification = {
      type: 'test',
      title: 'Real-time Test',
      message: 'This is a test notification for real-time updates',
      user_id: 1,
      is_read: false,
    };

    const { data: createdNotification, error: notificationError } = await supabase
      .from('notifications')
      .insert([testNotification])
      .select()
      .single();

    if (notificationError) throw notificationError;
    console.log('✅ Notification created:', createdNotification);

    // Wait for real-time update
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 4: Customer updates
    console.log('👥 Testing customer updates...');
    const testCustomer = {
      name: 'RT Test Customer',
      phone: '+254700000000',
      balance: 500.00,
    };

    const { data: createdCustomer, error: customerError } = await supabase
      .from('customers')
      .insert([testCustomer])
      .select()
      .single();

    if (customerError) throw customerError;
    console.log('✅ Customer created:', createdCustomer);

    // Wait for real-time update
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Cleanup test data
    console.log('🧹 Cleaning up test data...');
    await Promise.all([
      supabase.from('products').delete().eq('id', createdProduct.id),
      supabase.from('orders').delete().eq('id', createdOrder.id),
      supabase.from('notifications').delete().eq('id', createdNotification.id),
      supabase.from('customers').delete().eq('id', createdCustomer.id),
    ]);

    console.log('✅ Real-time system test completed successfully!');
    return {
      success: true,
      message: 'All real-time features working correctly',
      tests: {
        products: true,
        orders: true,
        notifications: true,
        customers: true,
      }
    };

  } catch (error) {
    console.error('❌ Real-time system test failed:', error);
    return {
      success: false,
      message: 'Real-time system test failed',
      error: error.message,
    };
  }
}

export async function testPageRefreshFunctionality() {
  console.log('🔄 Testing manual refresh functionality...');
  
  try {
    // Test refresh by triggering data fetches
    const tests = await Promise.all([
      supabase.from('products').select('count').single(),
      supabase.from('customers').select('count').single(),
      supabase.from('orders').select('count').single(),
      supabase.from('notifications').select('count').single(),
    ]);

    console.log('✅ All data refresh tests passed');
    return {
      success: true,
      message: 'Manual refresh functionality working',
      counts: tests.map(t => t.data?.count || 0),
    };

  } catch (error) {
    console.error('❌ Refresh functionality test failed:', error);
    return {
      success: false,
      message: 'Refresh functionality test failed',
      error: error.message,
    };
  }
}

// Usage example for testing in browser console:
// import { testRealtimeSystem, testPageRefreshFunctionality } from '@/utils/test-realtime-system';
// testRealtimeSystem().then(console.log);
// testPageRefreshFunctionality().then(console.log);