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
    // Map camelCase to snake_case for database
    const dbProduct = {
      name: product.name,
      sku: product.sku,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      low_stock_threshold: product.lowStockThreshold || product.low_stock_threshold || 10,
      sales_count: product.salesCount || product.sales_count || 0,
    };
    
    const { data, error } = await supabase.from('products').insert(dbProduct).select().single();
    if (error) throw error;
    return data;
  },

  async updateProduct(id: number, updates: any) {
    // Map camelCase to snake_case for database
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.sku !== undefined) dbUpdates.sku = updates.sku;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.stock !== undefined) dbUpdates.stock = updates.stock;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.lowStockThreshold !== undefined) dbUpdates.low_stock_threshold = updates.lowStockThreshold;
    if (updates.low_stock_threshold !== undefined) dbUpdates.low_stock_threshold = updates.low_stock_threshold;
    if (updates.salesCount !== undefined) dbUpdates.sales_count = updates.salesCount;
    if (updates.sales_count !== undefined) dbUpdates.sales_count = updates.sales_count;
    
    const { data, error } = await supabase.from('products').update(dbUpdates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteProduct(id: number) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },

  async searchProducts(query: string) {
    if (!query) {
      return this.getProducts();
    }
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%`)
      .order('name', { ascending: true })
      .limit(10);
    
    if (error) throw error;
    return data || [];
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
    // Map camelCase to snake_case for database
    const dbCustomer = {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      balance: customer.balance || "0.00",
    };
    
    const { data, error } = await supabase.from('customers').insert(dbCustomer).select().single();
    if (error) throw error;
    return data;
  },

  async updateCustomer(id: number, updates: any) {
    // Map camelCase to snake_case for database
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
    
    const { data, error } = await supabase.from('customers').update(dbUpdates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async findCustomerByNameOrPhone(nameOrPhone: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${nameOrPhone}%,phone.ilike.%${nameOrPhone}%`)
      .limit(1);
    
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  // Orders
  async getOrders(limit?: number) {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (limit) query = query.limit(limit);
    
    const { data, error } = await query;
    if (error) throw error;
    
    // Map snake_case to camelCase for frontend compatibility
    return data?.map(order => ({
      id: order.id,
      customerId: order.customer_id,
      customerName: order.customer_name,
      total: order.total,
      paymentMethod: order.payment_method,
      status: order.status,
      reference: order.reference,
      createdAt: order.created_at,
      updatedAt: order.updated_at
    })) || [];
  },

  async createOrder(order: any) {
    // Map camelCase to snake_case for database
    const dbOrder = {
      customer_id: order.customerId || order.customer_id,
      customer_name: order.customerName || order.customer_name,
      total: order.total,
      payment_method: order.paymentMethod || order.payment_method || 'cash',
      status: order.status || 'pending',
      reference: order.reference,
    };
    
    const { data, error } = await supabase.from('orders').insert(dbOrder).select().single();
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
    // Map camelCase to snake_case for database
    const dbOrderItem = {
      order_id: orderItem.orderId || orderItem.order_id,
      product_id: orderItem.productId || orderItem.product_id,
      product_name: orderItem.productName || orderItem.product_name,
      quantity: orderItem.quantity,
      price: orderItem.price,
    };
    
    const { data, error } = await supabase.from('order_items').insert(dbOrderItem).select().single();
    if (error) throw error;
    return data;
  },

  // Users
  async getUserByEmail(email: string) {
    const { data, error } = await supabase.from('users').select('*').eq('email', email);
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  async createUser(user: any) {
    // Map camelCase to snake_case for database
    const dbUser = {
      username: user.username,
      email: user.email,
      password_hash: user.passwordHash || user.password_hash,
      phone: user.phone,
    };
    
    const { data, error } = await supabase.from('users').insert(dbUser).select();
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  // User Settings
  async getUserSettings(userId: number) {
    const { data, error } = await supabase.from('user_settings').select('*').eq('user_id', userId).single();
    if (error) throw error;
    return data;
  },

  async updateUserSettings(userId: number, updates: any) {
    // Map camelCase to snake_case for database
    const dbUpdates: any = {};
    if (updates.theme !== undefined) dbUpdates.theme = updates.theme;
    if (updates.currency !== undefined) dbUpdates.currency = updates.currency;
    if (updates.language !== undefined) dbUpdates.language = updates.language;
    if (updates.notifications !== undefined) dbUpdates.notifications = updates.notifications;
    if (updates.mpesaEnabled !== undefined) dbUpdates.mpesa_enabled = updates.mpesaEnabled;
    
    const { data, error } = await supabase.from('user_settings').update(dbUpdates).eq('user_id', userId).select().single();
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
    // Map camelCase to snake_case for database
    const dbUpdates: any = {};
    if (updates.storeName !== undefined) dbUpdates.store_name = updates.storeName;
    if (updates.store_name !== undefined) dbUpdates.store_name = updates.store_name;
    if (updates.ownerName !== undefined) dbUpdates.owner_name = updates.ownerName;
    if (updates.owner_name !== undefined) dbUpdates.owner_name = updates.owner_name;
    if (updates.storeType !== undefined) dbUpdates.store_type = updates.storeType;
    if (updates.store_type !== undefined) dbUpdates.store_type = updates.store_type;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.paybillTillNumber !== undefined) dbUpdates.paybill_till_number = updates.paybillTillNumber;
    if (updates.paybill_till_number !== undefined) dbUpdates.paybill_till_number = updates.paybill_till_number;
    if (updates.consumerKey !== undefined) dbUpdates.consumer_key = updates.consumerKey;
    if (updates.consumer_key !== undefined) dbUpdates.consumer_key = updates.consumer_key;
    if (updates.consumerSecret !== undefined) dbUpdates.consumer_secret = updates.consumerSecret;
    if (updates.consumer_secret !== undefined) dbUpdates.consumer_secret = updates.consumer_secret;
    
    const { data, error } = await supabase.from('store_profiles').update(dbUpdates).eq('user_id', userId).select().single();
    if (error) throw error;
    return data;
  },

  async createStoreProfile(profile: any) {
    // Map camelCase to snake_case for database
    const dbProfile = {
      user_id: profile.userId || profile.user_id,
      store_name: profile.storeName || profile.store_name,
      owner_name: profile.ownerName || profile.owner_name,
      store_type: profile.storeType || profile.store_type || 'retail',
      location: profile.location,
      description: profile.description,
      paybill_till_number: profile.paybillTillNumber || profile.paybill_till_number,
      consumer_key: profile.consumerKey || profile.consumer_key,
      consumer_secret: profile.consumerSecret || profile.consumer_secret,
    };
    
    const { data, error } = await supabase.from('store_profiles').insert(dbProfile).select().single();
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

  async createNotification(notification: any) {
    const dbNotification = {
      user_id: notification.userId || notification.user_id,
      title: notification.title,
      message: notification.message,
      type: notification.type || 'info',
      is_read: notification.isRead || notification.is_read || false,
    };
    
    const { data, error } = await supabase.from('notifications').insert(dbNotification).select().single();
    if (error) throw error;
    return data;
  },

  async createUserSettings(settings: any) {
    const dbSettings = {
      user_id: settings.userId || settings.user_id,
      theme: settings.theme || 'light',
      currency: settings.currency || 'KES',
      language: settings.language || 'en',
      notifications: settings.notifications || true,
      mpesa_enabled: settings.mpesaEnabled || settings.mpesa_enabled || false,
    };
    
    const { data, error } = await supabase.from('user_settings').insert(dbSettings).select().single();
    if (error) throw error;
    return data;
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

  // Reports functions
  async getReportsSummary(period: string = 'week') {
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get revenue for period
    const { data: revenueData, error: revenueError } = await supabase
      .from('orders')
      .select('total, payment_method')
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString());
    
    if (revenueError) throw revenueError;

    // Calculate totals by payment method
    const totalRevenue = revenueData.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const cashRevenue = revenueData.filter(o => o.payment_method === 'cash').reduce((sum, order) => sum + parseFloat(order.total), 0);
    const creditRevenue = revenueData.filter(o => o.payment_method === 'credit').reduce((sum, order) => sum + parseFloat(order.total), 0);
    const mobileMoneyRevenue = revenueData.filter(o => o.payment_method === 'mobileMoney').reduce((sum, order) => sum + parseFloat(order.total), 0);

    // Get orders count
    const { count: ordersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString());

    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalOrders: ordersCount || 0,
      paymentBreakdown: {
        cash: cashRevenue.toFixed(2),
        credit: creditRevenue.toFixed(2),
        mobileMoney: mobileMoneyRevenue.toFixed(2)
      }
    };
  },

  async getReportsTrend(period: string = 'day', view: string = 'sales') {
    const now = new Date();
    let groupBy: string;
    let startDate: Date;
    
    switch (period) {
      case 'hour':
        groupBy = 'hour';
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
        break;
      case 'day':
        groupBy = 'day';
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
        break;
      case 'week':
        groupBy = 'week';
        startDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000); // Last 12 weeks
        break;
      case 'month':
        groupBy = 'month';
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1); // Last 12 months
        break;
      default:
        groupBy = 'day';
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // For simplicity, return sample trend data
    // In a real implementation, this would use PostgreSQL date functions
    const { data: ordersData, error } = await supabase
      .from('orders')
      .select('total, created_at')
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });
    
    if (error) throw error;

    // Group data by period
    const groupedData: { [key: string]: number } = {};
    
    ordersData.forEach(order => {
      const date = new Date(order.created_at);
      let key: string;
      
      if (groupBy === 'hour') {
        key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:00`;
      } else if (groupBy === 'day') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `Week of ${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      groupedData[key] = (groupedData[key] || 0) + parseFloat(order.total);
    });

    return Object.entries(groupedData).map(([date, value]) => ({
      date,
      value: parseFloat(value.toFixed(2))
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