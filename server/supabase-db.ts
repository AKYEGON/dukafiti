import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://kwdzbssuovwemthmiuht.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU0MTIwNiwiZXhwIjoyMDY3MTE3MjA2fQ.zSvksJ4fZLhaXKs8Ir_pq-yse-8x1NTKFTCWdiSLweQ'

export const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Database helper functions using Supabase
export const supabaseDb = {
  // Products
  async getProducts() {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getProductById(id: number) {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
    if (error) throw error
    return data
  },

  async createProduct(product: any) {
    const dbProduct = {
      name: product.name,
      sku: product.sku,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      low_stock_threshold: product.lowStockThreshold || product.low_stock_threshold || 10,
      sales_count: product.salesCount || product.sales_count || 0
    }
    const { data, error } = await supabase.from('products').insert(dbProduct).select().single()
    if (error) throw error
    return data
  },

  async updateProduct(id: number, updates: any) {
    const dbUpdates: any = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.sku !== undefined) dbUpdates.sku = updates.sku
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.price !== undefined) dbUpdates.price = updates.price
    if (updates.stock !== undefined) dbUpdates.stock = updates.stock
    if (updates.category !== undefined) dbUpdates.category = updates.category
    if (updates.lowStockThreshold !== undefined) dbUpdates.low_stock_threshold = updates.lowStockThreshold
    if (updates.low_stock_threshold !== undefined) dbUpdates.low_stock_threshold = updates.low_stock_threshold
    if (updates.salesCount !== undefined) dbUpdates.sales_count = updates.salesCount
    if (updates.sales_count !== undefined) dbUpdates.sales_count = updates.sales_count
    const { data, error } = await supabase.from('products').update(dbUpdates).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async deleteProduct(id: number) {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error
  },

  async searchProducts(query: string) {
    if (!query) {
      return this.getProducts()
    }
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%`)
      .order('name', { ascending: true })
      .limit(10)
    if (error) throw error
    return data || []
  },

  // Customers
  async getCustomers() {
    const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getCustomerById(id: number) {
    const { data, error } = await supabase.from('customers').select('*').eq('id', id).single()
    if (error) throw error
    return data
  },

  async createCustomer(customer: any) {
    const dbCustomer = {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      balance: customer.balance || '0.00'
    }
    const { data, error } = await supabase.from('customers').insert(dbCustomer).select().single()
    if (error) throw error
    return data
  },

  async updateCustomer(id: number, updates: any) {
    const dbUpdates: any = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.email !== undefined) dbUpdates.email = updates.email
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone
    if (updates.address !== undefined) dbUpdates.address = updates.address
    if (updates.balance !== undefined) dbUpdates.balance = updates.balance
    const { data, error } = await supabase.from('customers').update(dbUpdates).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async findCustomerByNameOrPhone(nameOrPhone: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${nameOrPhone}%,phone.ilike.%${nameOrPhone}%`)
      .limit(1)
    if (error) throw error
    return data && data.length > 0 ? data[0] : null
  },

  // Orders
  async getOrders(limit?: number) {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (limit) query = query.limit(limit)
    const { data, error } = await query
    if (error) throw error
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
    })) || []
  },

  async createOrder(order: any) {
    const dbOrder = {
      customer_id: order.customerId || order.customer_id,
      customer_name: order.customerName || order.customer_name,
      total: order.total,
      payment_method: order.paymentMethod || order.payment_method || 'cash',
      status: order.status || 'pending',
      reference: order.reference
    }
    const { data, error } = await supabase.from('orders').insert(dbOrder).select().single()
    if (error) throw error
    return data
  },

  // Order Items
  async getOrderItems(orderId: number) {
    const { data, error } = await supabase.from('order_items').select('*').eq('order_id', orderId)
    if (error) throw error
    return data
  },

  async createOrderItem(orderItem: any) {
    const dbOrderItem = {
      order_id: orderItem.orderId || orderItem.order_id,
      product_id: orderItem.productId || orderItem.product_id,
      product_name: orderItem.productName || orderItem.product_name,
      quantity: orderItem.quantity,
      price: orderItem.price
    }
    const { data, error } = await supabase.from('order_items').insert(dbOrderItem).select().single()
    if (error) throw error
    return data
  },

  // Dashboard metrics
  async getDashboardMetrics() {
    // Get total revenue from completed orders
    const { data: revenueData, error: revenueError } = await supabase
      .from('orders')
      .select('total')
      .eq('status', 'completed')
    if (revenueError) throw revenueError
    const totalRevenue = revenueData.reduce((sum, order) => sum + parseFloat(order.total), 0)

    // Get total orders count
    const { count: totalOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
    if (ordersError) throw ordersError

    // Get total products count
    const { count: totalProducts, error: productsError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
    if (productsError) throw productsError

    // Get total customers count
    const { count: totalCustomers, error: customersError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
    if (customersError) throw customersError

    return {
      totalRevenue,
      totalOrders: totalOrders || 0,
      totalProducts: totalProducts || 0,
      totalCustomers: totalCustomers || 0
    }
  },

  // Store settings and notifications stub methods
  async getStoreProfile(userId: number) {
    const { data, error } = await supabase.from('store_profiles').select('*').eq('user_id', userId).single()
    if (error) return { store_name: '', owner_name: '', store_type: 'retail' }
    return data
  },

  async updateStoreProfile(userId: number, updates: any) {
    const dbUpdates: any = {}
    if (updates.storeName !== undefined) dbUpdates.store_name = updates.storeName
    if (updates.store_name !== undefined) dbUpdates.store_name = updates.store_name
    if (updates.ownerName !== undefined) dbUpdates.owner_name = updates.ownerName
    if (updates.owner_name !== undefined) dbUpdates.owner_name = updates.owner_name
    if (updates.storeType !== undefined) dbUpdates.store_type = updates.storeType
    if (updates.store_type !== undefined) dbUpdates.store_type = updates.store_type

    const { data, error } = await supabase.from('store_profiles').update(dbUpdates).eq('user_id', userId).select().single()
    if (error) throw error
    return data
  },

  async createStoreProfile(profile: any) {
    const dbProfile = {
      user_id: profile.userId || profile.user_id,
      store_name: profile.storeName || profile.store_name,
      owner_name: profile.ownerName || profile.owner_name,
      store_type: profile.storeType || profile.store_type || 'retail'
    }
    const { data, error } = await supabase.from('store_profiles').insert(dbProfile).select().single()
    if (error) throw error
    return data
  },

  async getUserSettings(userId: number) {
    const { data, error } = await supabase.from('user_settings').select('*').eq('user_id', userId).single()
    if (error) return { theme: 'light', currency: 'KES' }
    return data
  },

  async updateUserSettings(userId: number, updates: any) {
    const { data, error } = await supabase.from('user_settings').update(updates).eq('user_id', userId).select().single()
    if (error) throw error
    return data
  },

  async createUserSettings(settings: any) {
    const { data, error } = await supabase.from('user_settings').insert(settings).select().single()
    if (error) throw error
    return data
  },

  async getNotifications(userId: number) {
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    if (error) return []
    return data
  },

  async getUnreadNotificationsCount(userId: number) {
    const { count, error } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false)
    if (error) return 0
    return count || 0
  },

  async markNotificationAsRead(id: number) {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    if (error) throw error
  },

  async createNotification(notification: any) {
    const { data, error } = await supabase.from('notifications').insert(notification).select().single()
    if (error) throw error
    return data
  },

  // Reports helpers
  async getReportsSummary(period: string) {
    return {
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0
    }
  },

  async getReportsTrend(period: string) {
    return []
  },

  async getTopProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('sales_count', { ascending: false })
      .limit(5)
    if (error) return []
    return data
  },

  async getTopCustomers() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('balance', { ascending: false })
      .limit(5)
    if (error) return []
    return data
  }
}