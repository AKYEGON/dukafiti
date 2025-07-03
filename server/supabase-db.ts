import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://kwdzbssuovwemthmiuht.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU0MTIwNiwiZXhwIjoyMDY3MTE3MjA2fQ.zSvksJ4fZLhaXKs8Ir_pq-yse-8x1NTKFTCWdiSLweQ';

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Database helper functions using Supabase
export const supabaseDb = {
  // Products
  async getProducts() {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getProductById(id: number) {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async createProduct(product: any) {
    const { data, error } = await supabase.from('products').insert(product).select().single();
    if (error) throw error;
    return data;
  },

  async updateProduct(id: number, updates: any) {
    const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteProduct(id: number) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },

  // Customers
  async getCustomers() {
    const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getCustomerById(id: number) {
    const { data, error } = await supabase.from('customers').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async createCustomer(customer: any) {
    const { data, error } = await supabase.from('customers').insert(customer).select().single();
    if (error) throw error;
    return data;
  },

  async updateCustomer(id: number, updates: any) {
    const { data, error } = await supabase.from('customers').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  // Orders
  async getOrders(limit?: number) {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (limit) query = query.limit(limit);
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async createOrder(order: any) {
    const { data, error } = await supabase.from('orders').insert(order).select().single();
    if (error) throw error;
    return data;
  },

  // Order Items
  async getOrderItems(orderId: number) {
    const { data, error } = await supabase.from('order_items').select('*').eq('order_id', orderId);
    if (error) throw error;
    return data;
  },

  async createOrderItem(orderItem: any) {
    const { data, error } = await supabase.from('order_items').insert(orderItem).select().single();
    if (error) throw error;
    return data;
  },

  // Users
  async getUserByEmail(email: string) {
    const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
    if (error) throw error;
    return data;
  },

  async createUser(user: any) {
    const { data, error } = await supabase.from('users').insert(user).select().single();
    if (error) throw error;
    return data;
  },

  // User Settings
  async getUserSettings(userId: number) {
    const { data, error } = await supabase.from('user_settings').select('*').eq('user_id', userId).single();
    if (error) throw error;
    return data;
  },

  async updateUserSettings(userId: number, updates: any) {
    const { data, error } = await supabase.from('user_settings').update(updates).eq('user_id', userId).select().single();
    if (error) throw error;
    return data;
  },

  // Store Profiles
  async getStoreProfile(userId: number) {
    const { data, error } = await supabase.from('store_profiles').select('*').eq('user_id', userId).single();
    if (error) throw error;
    return data;
  },

  async updateStoreProfile(userId: number, updates: any) {
    const { data, error } = await supabase.from('store_profiles').update(updates).eq('user_id', userId).select().single();
    if (error) throw error;
    return data;
  },

  async createStoreProfile(profile: any) {
    const { data, error } = await supabase.from('store_profiles').insert(profile).select().single();
    if (error) throw error;
    return data;
  },

  // Notifications
  async getNotifications(userId: number) {
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getUnreadNotificationsCount(userId: number) {
    const { count, error } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false);
    if (error) throw error;
    return count || 0;
  },

  async markNotificationAsRead(id: number) {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (error) throw error;
  },

  async deleteNotification(id: number) {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) throw error;
  },

  // Custom queries for reports
  async getDashboardMetrics() {
    // Get total revenue from completed orders
    const { data: revenueData, error: revenueError } = await supabase
      .from('orders')
      .select('total')
      .eq('status', 'completed');
    
    if (revenueError) throw revenueError;
    
    const totalRevenue = revenueData.reduce((sum, order) => sum + parseFloat(order.total), 0);
    
    // Get total orders count
    const { count: totalOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');
    
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
    const { count: lowStockCount, error: lowStockError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .not('stock', 'is', null)
      .lte('stock', 10);
    
    if (lowStockError) throw lowStockError;
    
    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalOrders: totalOrders || 0,
      totalProducts: totalProducts || 0,
      totalCustomers: totalCustomers || 0,
      lowStockCount: lowStockCount || 0,
      activeCustomersCount: totalCustomers || 0,
    };
  },

  async getTopProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('name, sales_count, price')
      .order('sales_count', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    return data.map(product => ({
      productName: product.name,
      unitsSold: product.sales_count,
      totalRevenue: (product.sales_count * parseFloat(product.price)).toFixed(2)
    }));
  },

  async getTopCustomers() {
    const { data, error } = await supabase
      .from('customers')
      .select('name, balance')
      .gt('balance', 0)
      .order('balance', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    
    return data.map(customer => ({
      customerName: customer.name,
      totalOwed: parseFloat(customer.balance).toFixed(2),
      outstandingOrders: 1
    }));
  },

  // Raw SQL query support for complex operations
  async rawQuery(query: string, params: any[] = []) {
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: query, 
      params: params 
    });
    if (error) throw error;
    return data;
  }
};