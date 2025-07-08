import { supabase } from './supabase';

// Product operations
export const getProducts = async () => {
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const createProduct = async (product: any) => {
  try {
    console.log('Supabase createProduct called with:', product);
    
    const insertData = {
      name: product.name,
      sku: product.sku,
      description: product.description || null,
      price: product.price,
      cost_price: product.costPrice || (product.price * 0.6), // Default to 60% of selling price
      stock: product.unknownQuantity ? null : product.stock,
      category: product.category || 'General',
      low_stock_threshold: product.unknownQuantity ? null : (product.lowStockThreshold || 10),
      sales_count: 0,
    };
    
    console.log('Insert data for Supabase:', insertData);
    
    const { data, error } = await supabase
      .from('products')
      .insert([insertData])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(error.message || 'Failed to create product in database');
    }
    
    console.log('Product created in Supabase:', data);
    return data;
  } catch (error) {
    console.error('CreateProduct function error:', error);
    throw error;
  }
};

export const updateProduct = async (id: number, updates: any) => {
  const updateData: any = {
    name: updates.name,
    sku: updates.sku,
    description: updates.description,
    price: updates.price,
    stock: updates.unknownQuantity ? null : updates.stock,
    category: updates.category,
    low_stock_threshold: updates.unknownQuantity ? null : updates.lowStockThreshold,
  };
  
  // Include cost_price if provided
  if (updates.costPrice !== undefined) {
    updateData.cost_price = updates.costPrice;
  }
  
  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteProduct = async (id: number) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Customer operations
export const getCustomers = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const createCustomer = async (customer: any) => {
  try {
    console.log('Creating customer with data:', customer);
    
    const { data, error } = await supabase
      .from('customers')
      .insert([{
        name: customer.name,
        email: customer.email || null,
        phone: customer.phone,
        balance: customer.balance || 0,
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase customer creation error:', error);
      throw error;
    }
    
    console.log('Customer created successfully:', data);
    return data;
  } catch (error) {
    console.error('Customer creation failed:', error);
    throw error;
  }
};

export const updateCustomer = async (id: number, updates: any) => {
  try {
    console.log('Updating customer', id, 'with data:', updates);
    
    // Prepare update object with only the fields that should be updated
    const updateObject: any = {
      name: updates.name,
      phone: updates.phone,
    };
    
    // Only include balance if it's provided (for edit mode, balance might not be included)
    if (updates.balance !== undefined) {
      updateObject.balance = updates.balance;
    }
    
    // Only include email if provided
    if (updates.email !== undefined) {
      updateObject.email = updates.email || null;
    }
    
    const { data, error } = await supabase
      .from('customers')
      .update(updateObject)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase customer update error:', error);
      throw new Error(`Failed to update customer: ${error.message}`);
    }
    
    console.log('Customer updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Customer update failed:', error);
    throw error;
  }
};

export const deleteCustomer = async (id: number) => {
  try {
    console.log('Deleting customer with ID:', id);
    
    // First delete any related orders and order items
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .eq('customer_id', id);
    
    if (ordersError) {
      console.error('Error fetching customer orders:', ordersError);
      throw ordersError;
    }
    
    if (orders && orders.length > 0) {
      // Delete order items first
      for (const order of orders) {
        const { error: orderItemsError } = await supabase
          .from('order_items')
          .delete()
          .eq('order_id', order.id);
        
        if (orderItemsError) {
          console.error('Error deleting order items:', orderItemsError);
          throw orderItemsError;
        }
      }
      
      // Then delete orders
      const { error: deleteOrdersError } = await supabase
        .from('orders')
        .delete()
        .eq('customer_id', id);
      
      if (deleteOrdersError) {
        console.error('Error deleting customer orders:', deleteOrdersError);
        throw deleteOrdersError;
      }
    }
    
    // Delete any payments
    const { error: paymentsError } = await supabase
      .from('payments')
      .delete()
      .eq('customer_id', id);
    
    if (paymentsError) {
      console.error('Error deleting customer payments:', paymentsError);
      throw paymentsError;
    }
    
    // Finally delete the customer
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
    
    console.log('Customer and all related data deleted successfully');
  } catch (error) {
    console.error('Customer deletion failed:', error);
    throw error;
  }
};

export const recordCustomerRepayment = async (customerId: number, amount: number, method: string, note?: string) => {
  try {
    console.log('Recording repayment for customer', customerId, 'amount:', amount);
    
    // Get current customer balance
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('balance')
      .eq('id', customerId)
      .single();
    
    if (customerError) {
      console.error('Error fetching customer:', customerError);
      throw customerError;
    }
    
    const currentBalance = parseFloat(customer.balance || '0');
    const newBalance = Math.max(0, currentBalance - amount);
    
    // Update customer balance
    const { data: updatedCustomer, error: updateError } = await supabase
      .from('customers')
      .update({ balance: newBalance })
      .eq('id', customerId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating customer balance:', updateError);
      throw updateError;
    }
    
    // Record the payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([{
        customer_id: customerId,
        amount: amount,
        method: method,
        reference: note || null,
        status: 'completed',
      }])
      .select()
      .single();
    
    if (paymentError) {
      console.error('Error recording payment:', paymentError);
      throw paymentError;
    }
    
    // MVP: Credit reminders are handled daily, not on individual payments

    console.log('Repayment recorded successfully:', payment);
    return { customer: updatedCustomer, payment };
  } catch (error) {
    console.error('Customer repayment failed:', error);
    throw error;
  }
};

// Reports functions
export const getReportsSummary = async (period: 'today' | 'weekly' | 'monthly') => {
  try {
    console.log('Fetching reports summary for period:', period);
    
    let startDate: Date;
    const endDate = new Date();
    
    // Calculate date range based on period
    switch (period) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }
    
    // Get orders within the date range (all orders, not just completed)
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('total, payment_method, status')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      throw ordersError;
    }
    
    // Calculate totals by payment method
    const totalSales = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const cashSales = orders.filter(o => o.payment_method === 'cash').reduce((sum, order) => sum + parseFloat(order.total), 0);
    const mobileMoneySales = orders.filter(o => o.payment_method === 'mobileMoney').reduce((sum, order) => sum + parseFloat(order.total), 0);
    const creditSales = orders.filter(o => o.payment_method === 'credit').reduce((sum, order) => sum + parseFloat(order.total), 0);
    
    return {
      totalSales: totalSales.toString(),
      cashSales: cashSales.toString(),
      mobileMoneySales: mobileMoneySales.toString(),
      creditSales: creditSales.toString(),
    };
  } catch (error) {
    console.error('Reports summary failed:', error);
    throw error;
  }
};

export const getReportsTrend = async (period: 'hourly' | 'daily' | 'monthly') => {
  try {
    console.log('getReportsTrend called with period:', period);
    
    let startDate: Date;
    const endDate = new Date();
    
    // Calculate date range and fetch orders based on period
    if (period === 'hourly') {
      // Past 24 hours
      startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    } else if (period === 'daily') {
      // Past 30 days
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    } else {
      // Past 12 months
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    
    // Fetch orders from Supabase
    const { data: orders, error } = await supabase
      .from('orders')
      .select('created_at, total')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching orders for trend:', error);
      throw error;
    }
    
    const trendData: Array<{ label: string; value: number }> = [];
    
    if (period === 'hourly') {
      // Create 24 hourly buckets
      const buckets = Array.from({ length: 24 }, (_, i) => {
        const hour = new Date();
        hour.setHours(hour.getHours() - (23 - i), 0, 0, 0);
        return { 
          label: `${hour.getHours().toString().padStart(2, '0')}:00`, 
          value: 0 
        };
      });
      
      // Bucket orders by hour
      orders?.forEach(order => {
        const orderDate = new Date(order.created_at);
        const hourLabel = `${orderDate.getHours().toString().padStart(2, '0')}:00`;
        const bucket = buckets.find(b => b.label === hourLabel);
        if (bucket) {
          bucket.value += parseFloat(order.total);
        }
      });
      
      trendData.push(...buckets);
      
    } else if (period === 'daily') {
      // Create 30 daily buckets
      const buckets = Array.from({ length: 30 }, (_, i) => {
        const day = new Date();
        day.setDate(day.getDate() - (29 - i));
        day.setHours(0, 0, 0, 0);
        return { 
          label: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
          value: 0 
        };
      });
      
      // Bucket orders by day
      orders?.forEach(order => {
        const orderDate = new Date(order.created_at);
        const dayLabel = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const bucket = buckets.find(b => b.label === dayLabel);
        if (bucket) {
          bucket.value += parseFloat(order.total);
        }
      });
      
      trendData.push(...buckets);
      
    } else {
      // Create 12 monthly buckets
      const buckets = Array.from({ length: 12 }, (_, i) => {
        const month = new Date();
        month.setMonth(month.getMonth() - (11 - i));
        month.setDate(1);
        month.setHours(0, 0, 0, 0);
        return { 
          label: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), 
          value: 0 
        };
      });
      
      // Bucket orders by month
      orders?.forEach(order => {
        const orderDate = new Date(order.created_at);
        const monthLabel = orderDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const bucket = buckets.find(b => b.label === monthLabel);
        if (bucket) {
          bucket.value += parseFloat(order.total);
        }
      });
      
      trendData.push(...buckets);
    }
    
    console.log(`Fetched real trend data for ${period} with ${trendData.length} data points:`, trendData.slice(0, 3));
    return trendData;
    
  } catch (error) {
    console.error('Error in getReportsTrend:', error);
    throw error;
  }
};

export const getTopCustomers = async (period: 'today' | 'weekly' | 'monthly') => {
  try {
    console.log('Fetching top customers for period:', period);
    
    // Get customers with credit balance (debt) ordered by highest amount
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name, balance')
      .gt('balance', 0)
      .order('balance', { ascending: false })
      .limit(10);
    
    if (customersError) {
      console.error('Error fetching top customers:', customersError);
      throw customersError;
    }
    
    // Get order counts for each customer
    const topCustomers = await Promise.all(customers.map(async (customer) => {
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('customer_id', customer.id)
        .eq('payment_method', 'credit');
      
      return {
        customerName: customer.name,
        totalOwed: customer.balance.toFixed(2),
        outstandingOrders: orders?.length || 0
      };
    }));
    
    return topCustomers.filter(c => parseFloat(c.totalOwed) > 0);
  } catch (error) {
    console.error('Top customers failed:', error);
    return [];
  }
};

export const getTopProducts = async (period: 'today' | 'weekly' | 'monthly') => {
  try {
    console.log('Fetching top products for period:', period);
    
    // Get order items with product info (remove date filtering for now to get all data)
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select(`
        product_id,
        quantity,
        price,
        products (name)
      `);
    
    if (orderItemsError) {
      console.error('Error fetching order items:', orderItemsError);
      throw orderItemsError;
    }
    
    if (!orderItems || orderItems.length === 0) {
      console.log('No order items found');
      return [];
    }
    
    // Group by product and calculate totals
    const productStats = new Map<number, { name: string; unitsSold: number; totalRevenue: number }>();
    
    orderItems.forEach(item => {
      const productName = (item.products as any)?.name || 'Unknown Product';
      const existing = productStats.get(item.product_id) || { 
        name: productName,
        unitsSold: 0,
        totalRevenue: 0
      };
      
      existing.unitsSold += item.quantity;
      existing.totalRevenue += parseFloat(item.price) * item.quantity;
      productStats.set(item.product_id, existing);
    });
    
    // Convert to array and sort by units sold
    const topProducts = Array.from(productStats.values())
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 10)
      .map(product => ({
        productName: product.name,
        unitsSold: product.unitsSold,
        totalRevenue: product.totalRevenue.toString()
      }));
    
    return topProducts;
  } catch (error) {
    console.error('Top products failed:', error);
    throw error;
  }
};

export const getOrdersData = async (period: 'daily' | 'weekly' | 'monthly', page: number = 1, limit: number = 10) => {
  try {
    console.log('Fetching orders data for period:', period, 'page:', page);
    
    let startDate: Date;
    const endDate = new Date();
    
    // Calculate date range based on period
    switch (period) {
      case 'daily':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }
    
    // Get total count first
    const { count: totalCount, error: countError } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    if (countError) {
      console.error('Error counting orders:', countError);
      throw countError;
    }
    
    // Get paginated orders with customer info
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        total,
        payment_method,
        created_at,
        customer_name
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    
    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      throw ordersError;
    }
    
    // Get order items for each order
    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          quantity,
          products (name)
        `)
        .eq('order_id', order.id);
      
      return {
        orderId: order.id,
        customerName: order.customer_name || 'Walk-in Customer',
        total: order.total,
        paymentMethod: order.payment_method,
        date: new Date(order.created_at).toLocaleDateString(),
        products: orderItems?.map(item => ({
          name: (item.products as any)?.name || 'Unknown Product',
          quantity: item.quantity
        })) || []
      };
    }));
    
    const totalPages = Math.ceil((totalCount || 0) / limit);
    
    return {
      orders: ordersWithItems,
      total: totalCount || 0,
      page,
      totalPages
    };
  } catch (error) {
    console.error('Orders data failed:', error);
    throw error;
  }
};

export const getCustomerCredits = async () => {
  try {
    console.log('Fetching customer credits');
    
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('name, phone, balance')
      .gt('balance', 0)
      .order('balance', { ascending: false })
      .limit(10);
    
    if (customersError) {
      console.error('Error fetching customer credits:', customersError);
      throw customersError;
    }
    
    return customers.map(customer => ({
      name: customer.name,
      phone: customer.phone,
      balance: customer.balance
    }));
  } catch (error) {
    console.error('Customer credits failed:', error);
    throw error;
  }
};

// Order operations
export const getOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const createOrder = async (order: any) => {
  const { data, error } = await supabase
    .from('orders')
    .insert([{
      customer_id: order.customerId,
      customer_name: order.customerName,
      total: order.total,
      status: order.status || 'completed',
      payment_method: order.paymentMethod || 'cash',
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const createOrderItem = async (orderItem: any) => {
  const { data, error } = await supabase
    .from('order_items')
    .insert([{
      order_id: orderItem.orderId,
      product_id: orderItem.productId,
      product_name: orderItem.productName,
      quantity: orderItem.quantity,
      price: orderItem.price,
      cost_price_at_sale: orderItem.costPriceAtSale || 0,
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Complete sales transaction
export const createSale = async (saleData: any) => {
  try {
    console.log('=== SUPABASE SALE CREATION START ===');
    console.log('Sale data received:', JSON.stringify(saleData, null, 2));
    console.log('Supabase client configured:', !!supabase);
    
    // Create the order first
    const orderData = {
      customer_id: saleData.customerId || null,
      customer_name: saleData.customerName || 'Walk-in Customer',
      total: saleData.total,
      status: 'completed',
      payment_method: saleData.paymentMethod || 'cash',
    };
    
    console.log('Creating order with data:', orderData);
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();
    
    if (orderError) {
      console.error('❌ ERROR creating order:', orderError);
      console.error('Error details:', {
        code: orderError.code,
        message: orderError.message,
        details: orderError.details,
        hint: orderError.hint
      });
      throw orderError;
    }
    
    console.log('✅ Order created successfully:', order);
    
    // Create order items
    const orderItems = saleData.items.map((item: any) => ({
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
      console.error('Error creating order items:', itemsError);
      throw itemsError;
    }
    
    // Update product stock levels (only for products with stock tracking)
    for (const item of saleData.items) {
      if (item.hasStock) {
        const { error: stockError } = await supabase
          .from('products')
          .update({
            stock: item.newStock,
            sales_count: item.newSalesCount
          })
          .eq('id', item.productId);
        
        if (stockError) {
          console.error('Error updating product stock:', stockError);
          // Don't throw here, just log the error
        }
      } else {
        // Update sales count for products without stock tracking
        const { error: salesError } = await supabase
          .from('products')
          .update({
            sales_count: item.newSalesCount
          })
          .eq('id', item.productId);
        
        if (salesError) {
          console.error('Error updating sales count:', salesError);
          // Don't throw here, just log the error
        }
      }
    }
    
    // MVP: Check for low stock and create notifications after sale
    try {
      const productUpdates = saleData.items
        .filter((item: any) => item.hasStock && item.newStock !== null)
        .map((item: any) => ({
          id: item.productId,
          name: item.productName,
          stock: item.newStock,
          threshold: item.lowStockThreshold || 10
        }));
      
      if (productUpdates.length > 0) {
        await checkLowStockAfterSale(productUpdates);
      }
    } catch (lowStockError) {
      console.error('Error checking low stock after sale:', lowStockError);
      // Don't throw - low stock notifications are not critical for sale completion
    }
    
    // If credit sale, update customer balance
    if (saleData.paymentMethod === 'credit' && saleData.customerId) {
      const { error: balanceError } = await supabase
        .from('customers')
        .update({
          balance: saleData.newCustomerBalance
        })
        .eq('id', saleData.customerId);
      
      if (balanceError) {
        console.error('Error updating customer balance:', balanceError);
        // Don't throw here, just log the error
      }
    }
    
    // Create sale completion notification with rich payload
    try {
      await createNotification({
        type: 'sale_completed',
        title: 'Sale Completed',
        message: `Sale of KES ${saleData.total} to ${saleData.customerName || 'customer'} processed successfully`,
        payload: {
          saleId: order.id,
          customerName: saleData.customerName || 'Walk-in Customer',
          amount: saleData.total,
          paymentMethod: saleData.paymentMethod,
          itemsCount: saleData.items.length,
          orderReference: order.reference
        }
      });

      // Create payment notification for non-credit sales with rich payload
      if (saleData.paymentMethod !== 'credit') {
        await createNotification({
          type: 'payment_received',
          title: 'Payment Received',
          message: `Payment of KES ${saleData.total} received via ${saleData.paymentMethod}`,
          payload: {
            saleId: order.id,
            method: saleData.paymentMethod,
            amount: saleData.total,
            customerName: saleData.customerName || 'Walk-in Customer',
            orderReference: order.reference
          }
        });
      }
    } catch (notificationError) {
      console.error('Error creating sale notifications:', notificationError);
      // Don't throw - notifications are not critical for sale completion
    }

    console.log('Sale created successfully:', order);
    return order;
  } catch (error) {
    console.error('Sale creation failed:', error);
    throw error;
  }
};



// Search functionality
export const searchProducts = async (query: string) => {
  if (!query) return [];
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(`name.ilike.%${query}%,sku.ilike.%${query}%,category.ilike.%${query}%`)
    .limit(8);
  
  if (error) throw error;
  return data;
};

// Dashboard metrics functions
export const getDashboardMetrics = async () => {
  try {
    console.log('Fetching dashboard metrics...');
    
    // Get total revenue from orders
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('total, created_at');
    
    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      // If table doesn't exist, return empty metrics instead of throwing
      if (ordersError.message.includes('relation "orders" does not exist')) {
        console.warn('Orders table does not exist, returning empty metrics');
        return {
          totalRevenue: '0',
          totalOrders: 0,
          totalProducts: 0,
          totalCustomers: 0,
          lowStockItems: 0,
          activeCustomersCount: 0,
        };
      }
      throw ordersError;
    }

    // Get total products count
    const { count: totalProducts, error: productsError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    if (productsError) throw productsError;

    // Get total customers count
    const { count: totalCustomers, error: customersError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    if (customersError) throw customersError;

    // Get low stock count
    const { data: lowStockData, error: lowStockError } = await supabase
      .from('products')
      .select('id, stock, low_stock_threshold')
      .not('stock', 'is', null);
    
    if (lowStockError) throw lowStockError;

    // Calculate metrics
    const totalRevenue = ordersData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
    const totalOrders = ordersData?.length || 0;
    const lowStockCount = lowStockData?.filter(product => 
      product.stock !== null && 
      product.stock <= (product.low_stock_threshold || 10)
    ).length || 0;

    // Calculate today's data for growth
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysOrders = ordersData?.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= today;
    }) || [];

    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalOrders,
      totalProducts: totalProducts || 0,
      totalCustomers: totalCustomers || 0,
      revenueGrowth: "0.0", // Simplified for now
      ordersGrowth: "0.0", // Simplified for now
      lowStockCount,
      activeCustomersCount: totalCustomers || 0
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    // Return default values if there's an error
    return {
      totalRevenue: "0.00",
      totalOrders: 0,
      totalProducts: 0,
      totalCustomers: 0,
      revenueGrowth: "0.0",
      ordersGrowth: "0.0",
      lowStockCount: 0,
      activeCustomersCount: 0
    };
  }
};

export const getRecentOrders = async () => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        total,
        status,
        customer_name,
        payment_method,
        created_at,
        customer_id,
        reference
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    // Get order items for each order
    const ordersWithItems = await Promise.all((data || []).map(async (order) => {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          quantity,
          product_name
        `)
        .eq('order_id', order.id);
      
      return {
        id: order.id,
        total: order.total,
        status: order.status,
        customerName: order.customer_name || 'N/A',
        paymentMethod: order.payment_method,
        createdAt: new Date(order.created_at),
        customerId: order.customer_id,
        reference: order.reference,
        products: orderItems?.map(item => ({
          name: item.product_name || 'Unknown Product',
          quantity: item.quantity
        })) || []
      };
    }));
    
    return ordersWithItems;
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    return [];
  }
};

// Store Profile operations - with fallback to localStorage when Supabase settings table doesn't exist
// Store profile localStorage key
const STORE_PROFILE_KEY = 'dukafiti_store_profile_v2';

export const getStoreProfile = async () => {
  try {
    console.log('Fetching store profile...');
    
    // For now, use localStorage as primary storage since settings table doesn't exist
    const localData = localStorage.getItem(STORE_PROFILE_KEY);
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        console.log('Retrieved store profile from localStorage:', parsed);
        return {
          storeName: parsed.storeName || '',
          ownerName: parsed.ownerName || '',
          address: parsed.address || ''
        };
      } catch (parseError) {
        console.error('Error parsing localStorage data:', parseError);
      }
    }
    
    // Return empty profile if no data exists
    console.log('No store profile found, returning defaults');
    return {
      storeName: '',
      ownerName: '',
      address: ''
    };
  } catch (error) {
    console.error('Store profile fetch failed:', error);
    
    return {
      storeName: '',
      ownerName: '',
      address: ''
    };
  }
};

export const updateStoreProfile = async (profileData: {
  storeName: string;
  ownerName: string;
  address: string;
}) => {
  try {
    console.log('Updating store profile:', profileData);
    
    // Save to localStorage as primary storage (since settings table doesn't exist)
    const profileWithTimestamp = {
      ...profileData,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(STORE_PROFILE_KEY, JSON.stringify(profileWithTimestamp));
    console.log('Store profile saved to localStorage successfully');
    
    // Return the saved data
    return {
      storeName: profileData.storeName,
      ownerName: profileData.ownerName,
      address: profileData.address
    };
  } catch (error) {
    console.error('Store profile update failed:', error);
    throw new Error('Failed to save store profile. Please try again.');
  }
};

// Check if notifications table exists and create it if needed
export const ensureNotificationsTableExists = async () => {
  try {
    // Try to query the table to see if it exists
    const { error } = await supabase
      .from('notifications')
      .select('id')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      // Table doesn't exist, create it using RPC call
      console.log('Notifications table does not exist, creating it...');
      
      const { error: createError } = await supabase.rpc('create_notifications_table_if_not_exists');
      
      if (createError) {
        console.error('Error creating notifications table:', createError);
        throw createError;
      }
      
      console.log('Notifications table created successfully');
    } else if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking/creating notifications table:', error);
    return false;
  }
};

// Notifications operations
export const getNotifications = async (limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', 1) // Filter by current user
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('getNotifications error:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId: number) => {
  try {
    console.log('Marking notification as read:', notificationId);
    
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', 1)
      .select()
      .single();
    
    if (error) {
      console.error('Error marking notification as read:', error);
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
    
    console.log('Notification marked as read successfully:', data);
    return data;
  } catch (error) {
    console.error('markNotificationAsRead error:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    console.log('Marking all notifications as read...');
    
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', 1)
      .eq('is_read', false)
      .select();
    
    if (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
    
    console.log('All notifications marked as read successfully:', data?.length || 0, 'notifications updated');
    return data;
  } catch (error) {
    console.error('markAllNotificationsAsRead error:', error);
    throw error;
  }
};

export const createNotification = async (notification: {
  type: 'low_stock' | 'payment_received' | 'sync_failed' | 'sale_completed' | 'customer_payment';
  title: string;
  message?: string;
  payload?: Record<string, any>;
}) => {
  try {
    console.log('Creating notification with payload:', notification);
    
    // Create notification with payload data
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        type: notification.type,
        title: notification.title,
        message: notification.message || '',
        user_id: 1, // Default user - adjust as needed
        is_read: false,
        payload: notification.payload || {}
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase notification creation error:', error);
      throw new Error(`Failed to create notification: ${error.message}`);
    }
    
    console.log('Notification created successfully:', data);
    return data;
  } catch (error) {
    console.error('createNotification error:', error);
    throw error;
  }
};

// Low stock check function - creates notifications for products running low
export const checkAndNotifyLowStock = async (updatedProducts: Array<{id: number, name: string, stock: number | null}>) => {
  try {
    const LOW_STOCK_THRESHOLD = 10;
    
    for (const product of updatedProducts) {
      // Skip products with unknown stock (null)
      if (product.stock === null) continue;
      
      // Check if stock is low
      if (product.stock <= LOW_STOCK_THRESHOLD) {
        // Create low stock notification with rich payload
        await createNotification({
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: `${product.name} is running low (Stock: ${product.stock} vs threshold ${LOW_STOCK_THRESHOLD})`,
          payload: {
            productId: product.id,
            productName: product.name,
            currentQty: product.stock,
            threshold: LOW_STOCK_THRESHOLD
          }
        });
      }
    }
  } catch (error) {
    console.error('Error checking low stock:', error);
  }
};

export const getUnreadNotificationCount = async () => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false);
  
  if (error) throw error;
  return count || 0;
};

// Helper function to create sync failure notifications
export const createSyncFailureNotification = async (error: string, retryCount: number = 0) => {
  return await createNotification({
    type: 'sync_failed',
    title: 'Sync Failed',
    message: `Failed to sync data after ${retryCount} retries: ${error}`,
    payload: {
      errorDetail: error,
      retryCount: retryCount,
      timestamp: new Date().toISOString()
    }
  });
};

// Helper function to create low stock notifications
export const createLowStockNotification = async (productName: string, currentStock: number, threshold: number) => {
  return await createNotification({
    type: 'low_stock',
    title: 'Low Stock Alert',
    message: `Product "${productName}" is running low (Stock: ${currentStock}, Threshold: ${threshold})`
  });
};

// ===================
// MVP NOTIFICATIONS SYSTEM - Only Credit Reminders and Low Stock Alerts
// ===================

// MVP: Create credit reminder notification
export const createCreditReminderNotification = async (customerId: string, customerName: string, balance: number) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        type: 'payment_received',
        title: 'Payment Reminder',
        message: `${customerName} owes KES ${balance.toFixed(2)}`,
        user_id: 1,
        is_read: false
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating credit reminder notification:', error);
      throw error;
    }

    console.log(`✅ Created payment reminder for ${customerName}: KES ${balance.toFixed(2)}`);
    return data;
  } catch (error) {
    console.error('createCreditReminderNotification error:', error);
    throw error;
  }
};

// MVP: Create low stock alert notification
export const createLowStockAlertNotification = async (productId: string, productName: string, quantity: number) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: `${productName} is running low (Current stock: ${quantity})`,
        user_id: 1,
        is_read: false
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating low stock alert notification:', error);
      throw error;
    }

    console.log(`✅ Created low stock notification for ${productName}: ${quantity} units remaining`);
    return data;
  } catch (error) {
    console.error('createLowStockAlertNotification error:', error);
    throw error;
  }
};

// MVP: Check for low stock after sale and create notifications
export const checkLowStockAfterSale = async (productUpdates: Array<{id: string, name: string, stock: number | null, threshold: number | null}>) => {
  try {
    for (const product of productUpdates) {
      // Skip products with unknown quantity
      if (product.stock === null || product.threshold === null) continue;
      
      // Check if stock is below threshold
      if (product.stock <= product.threshold) {
        await createLowStockAlertNotification(product.id, product.name, product.stock);
      }
    }
  } catch (error) {
    console.error('Error checking low stock after sale:', error);
  }
};

// MVP: Daily function to check for overdue credit customers (7+ days)
export const checkOverdueCreditCustomers = async () => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, balance, updated_at')
      .gt('balance', 0)
      .lt('updated_at', sevenDaysAgo.toISOString());

    if (error) {
      console.error('Error fetching overdue customers:', error);
      return;
    }

    for (const customer of customers || []) {
      await createCreditReminderNotification(customer.id, customer.name, customer.balance);
    }

    console.log(`Created credit reminders for ${customers?.length || 0} overdue customers`);
  } catch (error) {
    console.error('Error checking overdue credit customers:', error);
  }
};

// Profit tracking functions
export const getProfitData = async (period: 'daily' | 'weekly' | 'monthly') => {
  try {
    let startDate: Date;
    const endDate = new Date();
    
    switch (period) {
      case 'daily':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }
    
    // Get order items with profit data
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select(`
        *,
        orders!inner(created_at, total)
      `)
      .gte('orders.created_at', startDate.toISOString())
      .lte('orders.created_at', endDate.toISOString());
    
    if (error) throw error;
    
    // Calculate profit metrics
    let totalProfit = 0;
    let totalRevenue = 0;
    const productProfits: { [key: string]: { profit: number; quantity: number; name: string } } = {};
    
    orderItems.forEach(item => {
      const profit = (item.price - (item.cost_price_at_sale || 0)) * item.quantity;
      const revenue = item.price * item.quantity;
      
      totalProfit += profit;
      totalRevenue += revenue;
      
      if (!productProfits[item.product_id]) {
        productProfits[item.product_id] = {
          profit: 0,
          quantity: 0,
          name: item.product_name
        };
      }
      
      productProfits[item.product_id].profit += profit;
      productProfits[item.product_id].quantity += item.quantity;
    });
    
    const marginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    // Convert to array and sort by profit
    const byProduct = Object.entries(productProfits)
      .map(([id, data]) => ({
        productId: id,
        productName: data.name,
        profit: data.profit,
        quantity: data.quantity,
        marginPercent: data.profit > 0 ? ((data.profit / (data.profit + (data.profit / 0.4))) * 100) : 0
      }))
      .sort((a, b) => b.profit - a.profit);
    
    return {
      totalProfit,
      marginPercent,
      byProduct,
      period
    };
  } catch (error) {
    console.error('Error fetching profit data:', error);
    throw error;
  }
};

// Restocking functions
export const restockProduct = async (restockData: {
  productId: number;
  quantity: number;
  supplier?: string;
  note?: string;
  userId?: number;
}) => {
  try {
    // Get current product data
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', restockData.productId)
      .single();
    
    if (productError) throw productError;
    
    // Update product stock
    const newStock = (product.stock || 0) + restockData.quantity;
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', restockData.productId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    // Record restock history
    const { error: historyError } = await supabase
      .from('restock_history')
      .insert([{
        product_id: restockData.productId,
        product_name: product.name,
        quantity: restockData.quantity,
        supplier: restockData.supplier || null,
        note: restockData.note || null,
        user_id: restockData.userId || null,
      }]);
    
    if (historyError) {
      console.error('Failed to record restock history:', historyError);
      // Don't throw, just log the error
    }
    
    return updatedProduct;
  } catch (error) {
    console.error('Error restocking product:', error);
    throw error;
  }
};

export const getRestockHistory = async (period?: 'today' | 'week' | 'month') => {
  try {
    let query = supabase
      .from('restock_history')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (period) {
      let startDate: Date;
      const endDate = new Date();
      
      switch (period) {
        case 'today':
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
          break;
      }
      
      query = query
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching restock history:', error);
    throw error;
  }
};