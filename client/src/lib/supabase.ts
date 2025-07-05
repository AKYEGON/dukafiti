import { createClient, type Database } from '@supabase/supabase-js'

// Get environment variables with fallbacks for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rbiwfyupntvdszvlzmub.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiaXdmeXVwbnR2ZHN6dmx6bXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzY3NDcsImV4cCI6MjA2NjQ1Mjc0N30.mSoGqMqZdJTwWn_3vBgBYnWYh3ACfTt5pQjKN9WGTIo'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'dukafiti'
    }
  }
})

// Helper functions for common database operations
export const db = {
  // Products
  async getProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async createProduct(product: any) {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateProduct(id: string, updates: any) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteProduct(id: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  // Customers
  async getCustomers() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async createCustomer(customer: any) {
    const { data, error } = await supabase
      .from('customers')
      .insert([customer])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateCustomer(id: string, updates: any) {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Orders
  async getOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (name, price)
        ),
        customers (name, phone)
      `)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async createOrder(order: any) {
    const { data, error } = await supabase
      .from('orders')
      .insert([order])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async createOrderItems(orderItems: any[]) {
    const { data, error } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select()
    if (error) throw error
    return data
  },

  // Dashboard metrics
  async getDashboardMetrics() {
    const today = new Date().toISOString().split('T')[0]
    
    // Get today's revenue
    const { data: todayOrders } = await supabase
      .from('orders')
      .select('total')
      .gte('created_at', today)
      .eq('status', 'completed')

    // Get total customers
    const { count: totalCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })

    // Get total products
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    // Get low stock products
    const { data: lowStockProducts } = await supabase
      .from('products')
      .select('*')
      .lt('stock', 10)
      .is('stock', null)

    const todayRevenue = todayOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0

    return {
      todayRevenue,
      totalCustomers: totalCustomers || 0,
      totalProducts: totalProducts || 0,
      lowStockCount: lowStockProducts?.length || 0
    }
  },

  // Search functionality
  async searchProducts(query: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%,category.ilike.%${query}%`)
      .limit(10)
    if (error) throw error
    return data
  },

  async searchCustomers(query: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10)
    if (error) throw error
    return data
  }
}

// Export the functions URL for edge functions
export const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || `${supabaseUrl}/functions/v1`

export default supabase