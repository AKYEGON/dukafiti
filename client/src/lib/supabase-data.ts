import { supabase } from '../supabaseClient';

// Check if in development mode without Supabase credentials
const isDevelopmentMode = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return import.meta.env.DEV && (!supabaseUrl || !supabaseAnonKey);
};

// Product operations
export const getProducts = async () => {
  // Development mode fallback
  if (isDevelopmentMode()) {
    console.warn('Development mode: Loading demo products');
    const demoProducts = JSON.parse(localStorage.getItem('demo_products') || '[]');
    
    // Add some default demo products if none exist
    if (demoProducts.length === 0) {
      const defaultProducts = [
        {
          id: 1,
          name: "Demo Coca Cola 500ml",
          sku: "DEMO-COCA-500",
          description: "Demo refreshing cola drink",
          price: "50.00",
          stock: 100,
          category: "Beverages",
          low_stock_threshold: 10,
          sales_count: 5,
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          name: "Demo Bread Loaf",
          sku: "DEMO-BREAD-001",
          description: "Demo fresh white bread",
          price: "60.00",
          stock: null,
          category: "Bakery",
          low_stock_threshold: null,
          sales_count: 3,
          created_at: new Date().toISOString(),
        }
      ];
      localStorage.setItem('demo_products', JSON.stringify(defaultProducts));
      return defaultProducts;
    }
    
    return demoProducts;
  }
  
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
    
    // Development mode fallback
    if (isDevelopmentMode()) {
      console.warn('Development mode: Simulating product creation');
      const mockProduct = {
        id: Math.floor(Math.random() * 1000),
        name: product.name,
        sku: product.sku,
        description: product.description || null,
        price: product.price,
        stock: product.unknownQuantity ? null : product.stock,
        category: product.category || 'General',
        low_stock_threshold: product.unknownQuantity ? null : (product.lowStockThreshold || 10),
        sales_count: 0,
        created_at: new Date().toISOString(),
      };
      
      // Store in localStorage for demo purposes
      const existingProducts = JSON.parse(localStorage.getItem('demo_products') || '[]');
      existingProducts.push(mockProduct);
      localStorage.setItem('demo_products', JSON.stringify(existingProducts));
      
      console.log('Demo product created:', mockProduct);
      return mockProduct;
    }
    
    const insertData = {
      name: product.name,
      sku: product.sku,
      description: product.description || null,
      price: product.price,
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
  // Development mode fallback
  if (isDevelopmentMode()) {
    console.warn('Development mode: Simulating product update');
    const existingProducts = JSON.parse(localStorage.getItem('demo_products') || '[]');
    const updatedProducts = existingProducts.map((product: any) => {
      if (product.id === id) {
        return {
          ...product,
          name: updates.name,
          sku: updates.sku,
          description: updates.description,
          price: updates.price,
          stock: updates.unknownQuantity ? null : updates.stock,
          category: updates.category,
          low_stock_threshold: updates.unknownQuantity ? null : updates.lowStockThreshold,
        };
      }
      return product;
    });
    localStorage.setItem('demo_products', JSON.stringify(updatedProducts));
    const updatedProduct = updatedProducts.find((p: any) => p.id === id);
    console.log('Demo product updated:', updatedProduct);
    return updatedProduct;
  }
  
  const { data, error } = await supabase
    .from('products')
    .update({
      name: updates.name,
      sku: updates.sku,
      description: updates.description,
      price: updates.price,
      stock: updates.unknownQuantity ? null : updates.stock,
      category: updates.category,
      low_stock_threshold: updates.unknownQuantity ? null : updates.lowStockThreshold,
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteProduct = async (id: number) => {
  // Development mode fallback
  if (isDevelopmentMode()) {
    console.warn('Development mode: Simulating product deletion');
    const existingProducts = JSON.parse(localStorage.getItem('demo_products') || '[]');
    const filteredProducts = existingProducts.filter((product: any) => product.id !== id);
    localStorage.setItem('demo_products', JSON.stringify(filteredProducts));
    console.log('Demo product deleted:', id);
    return;
  }
  
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
    // First check if customer has any orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .eq('customer_id', id)
      .limit(1);
    
    if (ordersError) {
      console.error('Error checking customer orders:', ordersError);
      throw ordersError;
    }
    
    if (orders && orders.length > 0) {
      throw new Error('Cannot delete customer with existing orders. Please contact support to archive this customer.');
    }
    
    // Also check if customer has any payments
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('id')
      .eq('customer_id', id)
      .limit(1);
    
    if (paymentsError) {
      console.error('Error checking customer payments:', paymentsError);
      throw paymentsError;
    }
    
    if (payments && payments.length > 0) {
      throw new Error('Cannot delete customer with payment history. Please contact support to archive this customer.');
    }
    
    // If no orders or payments, proceed with deletion
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
    
    console.log('Customer deleted successfully');
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
    
    // Get orders within the date range
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('total, payment_method, status')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('status', 'completed');
    
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

export const getReportsTrend = async (period: 'daily' | 'weekly' | 'monthly') => {
  try {
    console.log('Fetching reports trend for period:', period);
    
    let startDate: Date;
    const endDate = new Date();
    
    // Calculate date range for trend data
    switch (period) {
      case 'daily':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30); // Last 30 days
        break;
      case 'weekly':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 84); // Last 12 weeks
        break;
      case 'monthly':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 12); // Last 12 months
        break;
    }
    
    // Get orders within the date range
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('total, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('status', 'completed')
      .order('created_at', { ascending: true });
    
    if (ordersError) {
      console.error('Error fetching orders for trend:', ordersError);
      throw ordersError;
    }
    
    // Group orders by period and calculate totals
    const trendData: Array<{ label: string; value: number }> = [];
    
    if (period === 'daily') {
      // Group by day
      const salesByDay = new Map<string, number>();
      orders.forEach(order => {
        const date = new Date(order.created_at);
        const dayKey = date.toISOString().split('T')[0];
        const currentTotal = salesByDay.get(dayKey) || 0;
        salesByDay.set(dayKey, currentTotal + parseFloat(order.total));
      });
      
      // Fill in missing days with 0
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayKey = d.toISOString().split('T')[0];
        const value = salesByDay.get(dayKey) || 0;
        trendData.push({
          label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: value
        });
      }
    } else if (period === 'weekly') {
      // Group by week
      const salesByWeek = new Map<string, number>();
      orders.forEach(order => {
        const date = new Date(order.created_at);
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
        const weekKey = weekStart.toISOString().split('T')[0];
        const currentTotal = salesByWeek.get(weekKey) || 0;
        salesByWeek.set(weekKey, currentTotal + parseFloat(order.total));
      });
      
      salesByWeek.forEach((value, weekKey) => {
        const weekDate = new Date(weekKey);
        trendData.push({
          label: weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: value
        });
      });
    } else {
      // Group by month
      const salesByMonth = new Map<string, number>();
      orders.forEach(order => {
        const date = new Date(order.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const currentTotal = salesByMonth.get(monthKey) || 0;
        salesByMonth.set(monthKey, currentTotal + parseFloat(order.total));
      });
      
      salesByMonth.forEach((value, monthKey) => {
        const [year, month] = monthKey.split('-');
        const monthDate = new Date(parseInt(year), parseInt(month) - 1);
        trendData.push({
          label: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          value: value
        });
      });
    }
    
    return trendData.sort((a, b) => new Date(a.label).getTime() - new Date(b.label).getTime());
  } catch (error) {
    console.error('Reports trend failed:', error);
    throw error;
  }
};

export const getTopCustomers = async (period: 'today' | 'weekly' | 'monthly') => {
  try {
    console.log('Fetching top customers for period:', period);
    
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
    
    // Get customers with credit sales in the period
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
        .eq('payment_method', 'credit')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      
      return {
        customerName: customer.name,
        totalOwed: customer.balance,
        outstandingOrders: orders?.length || 0
      };
    }));
    
    return topCustomers.filter(c => c.outstandingOrders > 0);
  } catch (error) {
    console.error('Top customers failed:', error);
    throw error;
  }
};

export const getTopProducts = async (period: 'today' | 'weekly' | 'monthly') => {
  try {
    console.log('Fetching top products for period:', period);
    
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
    
    // Get order items with product info from the period
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select(`
        product_id,
        quantity,
        price,
        products (name)
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    if (orderItemsError) {
      console.error('Error fetching order items:', orderItemsError);
      throw orderItemsError;
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
      .lte('created_at', endDate.toISOString())
      .eq('status', 'completed');
    
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
        customers (name)
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('status', 'completed')
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
        customerName: (order.customers as any)?.name || 'Walk-in Customer',
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
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Complete sales transaction
export const createSale = async (saleData: any) => {
  try {
    console.log('Creating sale with data:', saleData);
    
    // Create the order first
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        customer_id: saleData.customerId || null,
        customer_name: saleData.customerName || 'Walk-in Customer',
        total: saleData.total,
        status: 'completed',
        payment_method: saleData.paymentMethod || 'cash',
      }])
      .select()
      .single();
    
    if (orderError) {
      console.error('Error creating order:', orderError);
      throw orderError;
    }
    
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
        *,
        order_items(*, products(name))
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    return [];
  }
};