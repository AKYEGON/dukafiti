import { supabase } from '../supabaseClient';

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
  const { data, error } = await supabase
    .from('products')
    .insert([{
      name: product.name,
      sku: product.sku,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      low_stock_threshold: product.lowStockThreshold || 10,
      sales_count: 0,
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateProduct = async (id: number, updates: any) => {
  const { data, error } = await supabase
    .from('products')
    .update({
      name: updates.name,
      sku: updates.sku,
      description: updates.description,
      price: updates.price,
      stock: updates.stock,
      category: updates.category,
      low_stock_threshold: updates.lowStockThreshold,
    })
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
  const { data, error } = await supabase
    .from('customers')
    .insert([{
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      balance: customer.balance || 0,
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateCustomer = async (id: number, updates: any) => {
  const { data, error } = await supabase
    .from('customers')
    .update({
      name: updates.name,
      email: updates.email,
      phone: updates.phone,
      balance: updates.balance,
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
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
    // Get total revenue from orders
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('total, created_at');
    
    if (ordersError) throw ordersError;

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
        customers(name),
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