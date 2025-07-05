import { createClient } from '@supabase/supabase-js'

// Define types for Supabase storage
export interface Product {
  id: number
  name: string
  sku: string
  description?: string
  price: number
  stock?: number
  category: string
  lowStockThreshold: number
  salesCount: number
  createdAt: string
}

export interface Customer {
  id: number
  name: string
  email?: string
  phone?: string
  address?: string
  balance: number
  createdAt: string
}

export interface Order {
  id: number
  customerId?: number
  customerName: string
  total: number
  paymentMethod: string
  status: string
  reference?: string
  createdAt: string
}

export interface OrderItem {
  id: number
  orderId: number
  productId: number
  productName: string
  quantity: number
  price: number
}

export interface User {
  id: number
  username: string
  email: string
  passwordHash: string
  phone?: string
  createdAt: string
}

export interface Notification {
  id: number
  userId: number
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

export interface DashboardMetrics {
  totalRevenue: string
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  revenueGrowth: string
  ordersGrowth: string
  lowStockCount: number
  activeCustomersCount: number
}

export interface SearchResult {
  id: number
  type: 'product' | 'customer' | 'order'
  name: string
  subtitle?: string
  url: string
}

// Insert types
export type InsertProduct = Omit<Product, 'id' | 'createdAt' | 'salesCount'>
export type InsertCustomer = Omit<Customer, 'id' | 'createdAt'>
export type InsertOrder = Omit<Order, 'id' | 'createdAt'>
export type InsertOrderItem = Omit<OrderItem, 'id'>
export type InsertUser = Omit<User, 'id' | 'createdAt'>
export type InsertNotification = Omit<Notification, 'id' | 'createdAt'>

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>
  getUserByUsername(username: string): Promise<User | undefined>
  getUserByPhone(phone: string): Promise<User | undefined>
  getUserByEmail(email: string): Promise<User | undefined>
  createUser(user: InsertUser): Promise<User>

  // Products
  getProducts(): Promise<Product[]>
  getProduct(id: number): Promise<Product | undefined>
  createProduct(product: InsertProduct): Promise<Product>
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>
  updateProductStock(id: number, stockChange: number): Promise<Product | undefined>
  deleteProduct(id: number): Promise<boolean>
  searchProducts(query: string): Promise<Product[]>
  getFrequentProducts(): Promise<Array<{ id: number; name: string; price: string }>>
  incrementProductSalesCount(id: number, quantity: number): Promise<Product | undefined>

  // Customers
  getCustomers(): Promise<Customer[]>
  getCustomer(id: number): Promise<Customer | undefined>
  getCustomerByNameOrPhone(name: string, phone?: string): Promise<Customer | undefined>
  createCustomer(customer: InsertCustomer): Promise<Customer>
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>
  updateCustomerBalance(id: number, amount: number): Promise<Customer | undefined>
  deleteCustomer(id: number): Promise<boolean>

  // Orders
  getOrders(): Promise<Order[]>
  getOrder(id: number): Promise<Order | undefined>
  getOrderByReference(reference: string): Promise<Order | undefined>
  createOrder(order: InsertOrder): Promise<Order>
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>
  deleteOrder(id: number): Promise<boolean>
  getRecentOrders(limit?: number): Promise<Order[]>

  // Order Items
  getOrderItems(orderId: number): Promise<OrderItem[]>
  getAllOrderItems(): Promise<OrderItem[]>
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>

  // Dashboard
  getDashboardMetrics(): Promise<DashboardMetrics>
  getDetailedDashboardMetrics(): Promise<{
    revenue: {
      today: number
      yesterday: number
      weekToDate: number
      priorWeekToDate: number
    }
    orders: {
      today: number
      yesterday: number
    }
    inventory: {
      totalItems: number
      priorSnapshot: number
    }
    customers: {
      active: number
      priorActive: number
    }
  }>

  // Notifications
  getNotifications(userId: number, limit?: number): Promise<Notification[]>
  getUnreadNotificationCount(userId: number): Promise<number>
  createNotification(notification: InsertNotification): Promise<Notification>
  markNotificationAsRead(id: number): Promise<boolean>
  markAllNotificationsAsRead(userId: number): Promise<boolean>
  deleteNotification(id: number): Promise<boolean>

  // Search
  globalSearch(query: string): Promise<SearchResult[]>
}

export class SupabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const { data } = await supabase.from('users').select('*').eq('id', id).single()
    return data || undefined
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data } = await supabase.from('users').select('*').eq('username', username).single()
    return data || undefined
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const { data } = await supabase.from('users').select('*').eq('phone', phone).single()
    return data || undefined
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data } = await supabase.from('users').select('*').eq('email', email).single()
    return data || undefined
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { data } = await supabase.from('users').insert(insertUser).select().single()
    return data!
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    return data || []
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const { data } = await supabase.from('products').select('*').eq('id', id).single()
    return data || undefined
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const { data } = await supabase.from('products').insert({
      ...insertProduct,
      sales_count: 0
    }).select().single()
    return data!
  }

  async updateProduct(id: number, productUpdate: Partial<InsertProduct>): Promise<Product | undefined> {
    const { data } = await supabase.from('products').update(productUpdate).eq('id', id).select().single()
    return data || undefined
  }

  async updateProductStock(id: number, stockChange: number): Promise<Product | undefined> {
    const product = await this.getProduct(id)
    if (!product || product.stock === null || product.stock === undefined) return product
    
    const newStock = (product.stock || 0) + stockChange
    const { data } = await supabase.from('products').update({ stock: newStock }).eq('id', id).select().single()
    return data || undefined
  }

  async deleteProduct(id: number): Promise<boolean> {
    const { error } = await supabase.from('products').delete().eq('id', id)
    return !error
  }

  async searchProducts(query: string): Promise<Product[]> {
    const { data } = await supabase.from('products')
      .select('*')
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%`)
      .order('sales_count', { ascending: false })
    return data || []
  }

  async getFrequentProducts(): Promise<Array<{ id: number; name: string; price: string }>> {
    const { data } = await supabase.from('products')
      .select('id, name, price')
      .gt('sales_count', 0)
      .order('sales_count', { ascending: false })
      .limit(10)
    
    return (data || []).map(p => ({
      id: p.id,
      name: p.name,
      price: p.price.toString()
    }))
  }

  async incrementProductSalesCount(id: number, quantity: number): Promise<Product | undefined> {
    const product = await this.getProduct(id)
    if (!product) return undefined
    
    const newSalesCount = product.salesCount + quantity
    const { data } = await supabase.from('products')
      .update({ sales_count: newSalesCount })
      .eq('id', id)
      .select()
      .single()
    return data || undefined
  }

  // Customer methods
  async getCustomers(): Promise<Customer[]> {
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
    return data || []
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const { data } = await supabase.from('customers').select('*').eq('id', id).single()
    return data || undefined
  }

  async getCustomerByNameOrPhone(name: string, phone?: string): Promise<Customer | undefined> {
    let query = supabase.from('customers').select('*').eq('name', name)
    if (phone) {
      query = supabase.from('customers').select('*').or(`name.eq.${name},phone.eq.${phone}`)
    }
    const { data } = await query.single()
    return data || undefined
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const { data } = await supabase.from('customers').insert(insertCustomer).select().single()
    return data!
  }

  async updateCustomer(id: number, customerUpdate: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const { data } = await supabase.from('customers').update(customerUpdate).eq('id', id).select().single()
    return data || undefined
  }

  async updateCustomerBalance(id: number, amount: number): Promise<Customer | undefined> {
    const customer = await this.getCustomer(id)
    if (!customer) return undefined
    
    const newBalance = customer.balance + amount
    const { data } = await supabase.from('customers')
      .update({ balance: newBalance })
      .eq('id', id)
      .select()
      .single()
    return data || undefined
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const { error } = await supabase.from('customers').delete().eq('id', id)
    return !error
  }

  // Order methods
  async getOrders(): Promise<Order[]> {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    return data || []
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const { data } = await supabase.from('orders').select('*').eq('id', id).single()
    return data || undefined
  }

  async getOrderByReference(reference: string): Promise<Order | undefined> {
    const { data } = await supabase.from('orders').select('*').eq('reference', reference).single()
    return data || undefined
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const { data } = await supabase.from('orders').insert(insertOrder).select().single()
    return data!
  }

  async updateOrder(id: number, orderUpdate: Partial<InsertOrder>): Promise<Order | undefined> {
    const { data } = await supabase.from('orders').update(orderUpdate).eq('id', id).select().single()
    return data || undefined
  }

  async deleteOrder(id: number): Promise<boolean> {
    const { error } = await supabase.from('orders').delete().eq('id', id)
    return !error
  }

  async getRecentOrders(limit = 10): Promise<Order[]> {
    const { data } = await supabase.from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    return data || []
  }

  // Order Item methods
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    const { data } = await supabase.from('order_items').select('*').eq('order_id', orderId)
    return data || []
  }

  async getAllOrderItems(): Promise<OrderItem[]> {
    const { data } = await supabase.from('order_items').select('*')
    return data || []
  }

  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const { data } = await supabase.from('order_items').insert(insertOrderItem).select().single()
    return data!
  }

  // Dashboard methods
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    // Get total revenue from all revenue-generating orders
    const { data: revenueData } = await supabase
      .from('orders')
      .select('total')
      .in('status', ['paid', 'credit', 'completed'])

    const totalRevenue = (revenueData || []).reduce((sum, order) => sum + order.total, 0)

    // Get today's orders
    const today = new Date().toISOString().split('T')[0]
    const { data: todayOrders } = await supabase
      .from('orders')
      .select('id')
      .gte('created_at', today)

    // Get total products
    const { data: products } = await supabase.from('products').select('id, stock, low_stock_threshold')

    // Get total customers
    const { data: customers } = await supabase.from('customers').select('id')

    // Calculate low stock count
    const lowStockCount = (products || []).filter(p => 
      p.stock !== null && p.stock <= (p.low_stock_threshold || 10)
    ).length

    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalOrders: (todayOrders || []).length,
      totalProducts: (products || []).length,
      totalCustomers: (customers || []).length,
      revenueGrowth: '0.0%',
      ordersGrowth: '0.0%',
      lowStockCount,
      activeCustomersCount: (customers || []).length
    }
  }

  async getDetailedDashboardMetrics(): Promise<{
    revenue: { today: number; yesterday: number; weekToDate: number; priorWeekToDate: number }
    orders: { today: number; yesterday: number }
    inventory: { totalItems: number; priorSnapshot: number }
    customers: { active: number; priorActive: number }
  }> {
    const { data: products } = await supabase.from('products').select('id')
    const { data: customers } = await supabase.from('customers').select('id')

    return {
      revenue: { today: 0, yesterday: 0, weekToDate: 0, priorWeekToDate: 0 },
      orders: { today: 0, yesterday: 0 },
      inventory: { totalItems: (products || []).length, priorSnapshot: (products || []).length },
      customers: { active: (customers || []).length, priorActive: (customers || []).length }
    }
  }

  // Notification methods
  async getNotifications(userId: number, limit = 50): Promise<Notification[]> {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    return data || []
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const { data } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('is_read', false)
    return (data || []).length
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const { data } = await supabase.from('notifications').insert(notification).select().single()
    return data!
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    return !error
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId)
    return !error
  }

  async deleteNotification(id: number): Promise<boolean> {
    const { error } = await supabase.from('notifications').delete().eq('id', id)
    return !error
  }

  // Search methods
  async globalSearch(query: string): Promise<SearchResult[]> {
    const searchTerm = query.toLowerCase().trim()
    const results: SearchResult[] = []

    // Search products
    const { data: products } = await supabase
      .from('products')
      .select('id, name, price, category')
      .ilike('name', `%${searchTerm}%`)
      .limit(4)

    products?.forEach(product => {
      results.push({
        id: product.id,
        type: 'product',
        name: product.name,
        subtitle: `KES ${product.price} - ${product.category}`,
        url: '/inventory'
      })
    })

    // Search customers
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name, phone, email')
      .ilike('name', `%${searchTerm}%`)
      .limit(4)

    customers?.forEach(customer => {
      results.push({
        id: customer.id,
        type: 'customer',
        name: customer.name,
        subtitle: customer.phone || customer.email || '',
        url: '/customers'
      })
    })

    return results.slice(0, 8)
  }
}

export const storage = new SupabaseStorage()