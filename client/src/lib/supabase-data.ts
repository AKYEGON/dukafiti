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

// Dashboard metrics
export const getDashboardMetrics = async () => {
  // Get total revenue
  const { data: orders } = await supabase
    .from('orders')
    .select('total');
  
  const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
  
  // Get order count for today
  const today = new Date().toISOString().split('T')[0];
  const { data: todayOrders, count: todayOrderCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .gte('created_at', today);
  
  // Get total products
  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact' });
  
  // Get low stock products
  const { data: lowStockProducts } = await supabase
    .from('products')
    .select('*')
    .lt('stock', 10);
  
  return {
    totalRevenue: totalRevenue.toFixed(2),
    totalOrders: orders?.length || 0,
    ordersToday: todayOrderCount || 0,
    inventoryItems: productCount || 0,
    lowStockCount: lowStockProducts?.length || 0,
  };
};

export const getRecentOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
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