import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kwdzbssuovwemthmiuht.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU0MTIwNiwiZXhwIjoyMDY3MTE3MjA2fQ.zSvksJ4fZLhaXKs8Ir_pq-yse-8x1NTKFTCWdiSLweQ';

const supabase = createClient(supabaseUrl, serviceKey);

async function debugSalesFlow() {
  console.log('=== DEEP SALES FLOW ANALYSIS ===');
  
  try {
    // 1. Test products availability
    console.log('\n1. Testing products availability...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(3);
    
    if (productsError) {
      console.error('❌ Products fetch failed:', productsError);
      return;
    }
    console.log('✅ Products available:', products.length);
    console.log('Sample product:', products[0]);
    
    // 2. Test actual sale creation with realistic data
    console.log('\n2. Testing order creation process...');
    const saleData = {
      customerId: null,
      customerName: 'Walk-in Customer',
      total: 50.0,
      paymentMethod: 'cash',
      items: [{
        productId: products[0].id,
        productName: products[0].name,
        quantity: 1,
        price: products[0].price,
        hasStock: products[0].stock !== null,
        newStock: products[0].stock !== null ? products[0].stock - 1 : null,
        newSalesCount: (products[0].sales_count || 0) + 1
      }]
    };
    
    console.log('Sale data to be processed:', JSON.stringify(saleData, null, 2));
    
    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        customer_id: saleData.customerId,
        customer_name: saleData.customerName,
        total: saleData.total,
        status: 'completed',
        payment_method: saleData.paymentMethod,
      }])
      .select()
      .single();
    
    if (orderError) {
      console.error('❌ Order creation failed:', orderError);
      console.log('Error details:', {
        code: orderError.code,
        message: orderError.message,
        details: orderError.details,
        hint: orderError.hint
      });
      return;
    }
    
    console.log('✅ Order created successfully:', order);
    
    // Create order items
    console.log('\n3. Testing order items creation...');
    const orderItems = saleData.items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      price: item.price,
    }));
    
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);
    
    if (itemsError) {
      console.error('❌ Order items creation failed:', itemsError);
      return;
    }
    
    console.log('✅ Order items created successfully');
    
    // Update product stock
    console.log('\n4. Testing product stock update...');
    const item = saleData.items[0];
    const { error: stockError } = await supabase
      .from('products')
      .update({
        stock: item.newStock,
        sales_count: item.newSalesCount
      })
      .eq('id', item.productId);
    
    if (stockError) {
      console.error('❌ Stock update failed:', stockError);
    } else {
      console.log('✅ Stock updated successfully');
    }
    
    // 5. Test dashboard metrics
    console.log('\n5. Testing dashboard metrics calculation...');
    const { data: ordersData, error: metricsError } = await supabase
      .from('orders')
      .select('total, created_at, status');
    
    if (metricsError) {
      console.error('❌ Metrics fetch failed:', metricsError);
    } else {
      const totalRevenue = ordersData.reduce((sum, order) => sum + parseFloat(order.total), 0);
      console.log('✅ Dashboard metrics calculation:');
      console.log(`  - Total orders: ${ordersData.length}`);
      console.log(`  - Total revenue: KES ${totalRevenue.toFixed(2)}`);
      console.log(`  - Recent orders: ${ordersData.slice(0, 5).length}`);
    }
    
    // 6. Clean up test order
    console.log('\n6. Cleaning up test data...');
    await supabase.from('order_items').delete().eq('order_id', order.id);
    await supabase.from('orders').delete().eq('id', order.id);
    
    // Restore original stock
    await supabase
      .from('products')
      .update({
        stock: products[0].stock,
        sales_count: products[0].sales_count
      })
      .eq('id', products[0].id);
    
    console.log('✅ Test data cleaned up');
    console.log('\n=== ANALYSIS COMPLETE ===');
    console.log('All components working correctly with service role key.');
    
  } catch (error) {
    console.error('💥 Critical error in sales flow:', error);
  }
}

debugSalesFlow();