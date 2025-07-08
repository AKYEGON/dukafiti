/**
 * Store-Isolated Data Access Layer
 * All functions enforce Row-Level Security with store_id filtering
 */

import { supabase } from './supabase';

// ==== PRODUCTS ====
export const getProducts = async (storeId: string) => {
  if (!storeId) throw new Error('Store ID required');
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const createProduct = async (product: any) => {
  // store_id will be set automatically by trigger
  const insertData = {
    name: product.name,
    sku: product.sku,
    description: product.description || null,
    price: product.price,
    cost_price: product.costPrice || (product.price * 0.6),
    stock: product.unknownQuantity ? null : product.stock,
    category: product.category || 'General',
    low_stock_threshold: product.unknownQuantity ? null : (product.low_stock_threshold || 10),
    sales_count: 0,
  };
  
  const { data, error } = await supabase
    .from('products')
    .insert([insertData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateProduct = async (id: number, updates: any, storeId: string) => {
  if (!storeId) throw new Error('Store ID required');
  
  const updateData: any = {
    name: updates.name,
    sku: updates.sku,
    description: updates.description,
    price: updates.price,
    stock: updates.unknownQuantity ? null : updates.stock,
    category: updates.category,
    low_stock_threshold: updates.unknownQuantity ? null : updates.low_stock_threshold,
  };
  
  if (updates.costPrice !== undefined) {
    updateData.cost_price = updates.costPrice;
  }
  
  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)
    .eq('store_id', storeId) // Ensure user owns this product
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteProduct = async (id: number, storeId: string) => {
  if (!storeId) throw new Error('Store ID required');
  
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('store_id', storeId); // Ensure user owns this product
  
  if (error) throw error;
};

export const restockProduct = async (id: number, quantity: number, buyingPrice?: number, storeId?: string) => {
  if (!storeId) throw new Error('Store ID required');
  
  // Update product stock
  const updateData: any = {
    stock: quantity,
  };
  
  if (buyingPrice !== undefined) {
    updateData.cost_price = buyingPrice;
  }
  
  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)
    .eq('store_id', storeId) // Ensure user owns this product
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// ==== CUSTOMERS ====
export const getCustomers = async (storeId: string) => {
  if (!storeId) throw new Error('Store ID required');
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const createCustomer = async (customer: any) => {
  // store_id will be set automatically by trigger
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
  
  if (error) throw error;
  return data;
};

export const updateCustomer = async (id: number, updates: any, storeId: string) => {
  if (!storeId) throw new Error('Store ID required');
  
  const updateObject: any = {
    name: updates.name,
    phone: updates.phone,
  };
  
  if (updates.balance !== undefined) {
    updateObject.balance = updates.balance;
  }
  
  if (updates.email !== undefined) {
    updateObject.email = updates.email || null;
  }
  
  const { data, error } = await supabase
    .from('customers')
    .update(updateObject)
    .eq('id', id)
    .eq('store_id', storeId) // Ensure user owns this customer
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteCustomer = async (id: number, storeId: string) => {
  if (!storeId) throw new Error('Store ID required');
  
  // Delete customer and let cascade handle related orders
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id)
    .eq('store_id', storeId); // Ensure user owns this customer
  
  if (error) throw error;
};

// ==== ORDERS ====
export const getOrders = async (storeId: string) => {
  if (!storeId) throw new Error('Store ID required');
  
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const getRecentOrders = async (storeId: string, limit = 10) => {
  if (!storeId) throw new Error('Store ID required');
  
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data || [];
};

export const createOrder = async (orderData: any) => {
  // store_id will be set automatically by trigger
  const { data, error } = await supabase
    .from('orders')
    .insert([orderData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// ==== NOTIFICATIONS ====
export const getNotifications = async (storeId: string) => {
  if (!storeId) throw new Error('Store ID required');
  
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const createNotification = async (notification: any) => {
  // store_id will be set automatically by trigger
  const { data, error } = await supabase
    .from('notifications')
    .insert([notification])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const markNotificationAsRead = async (id: number, storeId: string) => {
  if (!storeId) throw new Error('Store ID required');
  
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('store_id', storeId) // Ensure user owns this notification
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// ==== DASHBOARD METRICS ====
export const getDashboardMetrics = async (storeId: string) => {
  if (!storeId) throw new Error('Store ID required');
  
  try {
    console.log('🔍 Fetching dashboard metrics for store:', storeId);
    
    // Get all data for this store only
    const [ordersData, productsData, customersData] = await Promise.all([
      supabase.from('orders').select('total, created_at').eq('store_id', storeId),
      supabase.from('products').select('id, stock, low_stock_threshold').eq('store_id', storeId),
      supabase.from('customers').select('id').eq('store_id', storeId),
    ]);
    
    if (ordersData.error) throw ordersData.error;
    if (productsData.error) throw productsData.error;
    if (customersData.error) throw customersData.error;
    
    const orders = ordersData.data || [];
    const products = productsData.data || [];
    const customers = customersData.data || [];
    
    // Calculate metrics
    const totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
    const totalOrders = orders.length;
    const totalProducts = products.length;
    const totalCustomers = customers.length;
    
    // Calculate low stock count
    const lowStockCount = products.filter(product => 
      product.stock !== null && 
      product.stock <= (product.low_stock_threshold || 10)
    ).length;
    
    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalOrders,
      totalProducts,
      totalCustomers,
      revenueGrowth: "0.0", // Simplified for now
      ordersGrowth: "0.0", // Simplified for now
      lowStockCount,
      activeCustomersCount: totalCustomers
    };
  } catch (error) {
    console.error('Dashboard metrics error:', error);
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

// ==== SEARCH ====
export const searchProducts = async (query: string, storeId: string) => {
  if (!storeId) throw new Error('Store ID required');
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .or(`name.ilike.%${query}%,sku.ilike.%${query}%,category.ilike.%${query}%`);
  
  if (error) throw error;
  return data || [];
};

export const searchCustomers = async (query: string, storeId: string) => {
  if (!storeId) throw new Error('Store ID required');
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('store_id', storeId)
    .or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`);
  
  if (error) throw error;
  return data || [];
};