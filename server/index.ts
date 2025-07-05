import express from 'express'
import path from 'path'
import cors from 'cors'
import { createServer } from 'http'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { supabaseDb } from './supabase-db.js'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const port = parseInt(process.env.PORT || '5000', 10)
// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kwdzbssuovwemthmiuht.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA'
const supabase = createClient(supabaseUrl, supabaseKey)
// Create HTTP server
const server = createServer(app)
// Basic middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-client-name']
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
// Set proper MIME types for ES modules
app.use((req, res, next) => {
  if (req.path.endsWith('.js')) {
    res.setHeader('Content-Type', 'application/javascript')
  } else if (req.path.endsWith('.ts')) {
    res.setHeader('Content-Type', 'application/javascript')
  } else if (req.path.endsWith('.tsx')) {
    res.setHeader('Content-Type', 'application/javascript')
  } else if (req.path.endsWith('.jsx')) {
    res.setHeader('Content-Type', 'application/javascript')
  }
  next()
})
// Simple authentication middleware
function requireAuth(req: any, res: any, next: any) {
  req.user = { email: 'admin@dukafiti.com', id: 1 }
  next()
}

// Health check endpoint (required for Railway)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})
// API Routes with basic responses - apply auth only to API routes
app.use('/api', requireAuth)
// API endpoints with comprehensive Supabase integration
app.get('/api/dashboard/metrics', async (req, res) => {
  try {
    const metrics = await supabaseDb.getDashboardMetrics()
    res.json(metrics)
  } catch (error) {
    console.error('Dashboard metrics error:', error)
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' })
  }
})

// Products endpoints
app.get('/api/products', async (req, res) => {
  try {
    const products = await supabaseDb.getProducts()
    res.json(products || [])
  } catch (error) {
    console.error('Products fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
})

app.get('/api/products/search', async (req, res) => {
  try {
    const { q } = req.query
    const products = await supabaseDb.searchProducts(q as string)
    res.json(products || [])
  } catch (error) {
    console.error('Product search error:', error)
    res.status(500).json({ error: 'Failed to search products' })
  }
})

app.post('/api/products', async (req, res) => {
  try {
    const product = await supabaseDb.createProduct(req.body)
    res.json(product)
  } catch (error) {
    console.error('Product creation error:', error)
    res.status(500).json({ error: 'Failed to create product' })
  }
})

app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params
    const product = await supabaseDb.updateProduct(parseInt(id), req.body)
    res.json(product)
  } catch (error) {
    console.error('Product update error:', error)
    res.status(500).json({ error: 'Failed to update product' })
  }
})

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params
    await supabaseDb.deleteProduct(parseInt(id))
    res.json({ success: true })
  } catch (error) {
    console.error('Product deletion error:', error)
    res.status(500).json({ error: 'Failed to delete product' })
  }
})

// Customers endpoints
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await supabaseDb.getCustomers()
    res.json(customers || [])
  } catch (error) {
    console.error('Customers fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch customers' })
  }
})

app.post('/api/customers', async (req, res) => {
  try {
    const customer = await supabaseDb.createCustomer(req.body)
    res.json(customer)
  } catch (error) {
    console.error('Customer creation error:', error)
    res.status(500).json({ error: 'Failed to create customer' })
  }
})

app.put('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params
    const customer = await supabaseDb.updateCustomer(parseInt(id), req.body)
    res.json(customer)
  } catch (error) {
    console.error('Customer update error:', error)
    res.status(500).json({ error: 'Failed to update customer' })
  }
})

// Orders endpoints
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await supabaseDb.getOrders()
    res.json(orders || [])
  } catch (error) {
    console.error('Orders fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

app.get('/api/orders/recent', async (req, res) => {
  try {
    const orders = await supabaseDb.getRecentOrders()
    res.json(orders || [])
  } catch (error) {
    console.error('Recent orders fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch recent orders' })
  }
})

app.post('/api/orders', async (req, res) => {
  try {
    const { items, customer, paymentMethod, total } = req.body
    
    // Create order
    const order = await supabaseDb.createOrder({
      customerName: customer || 'Walk-in Customer',
      total: total.toString(),
      paymentMethod: paymentMethod || 'cash',
      status: 'completed'
    })

    // Create order items
    if (items && items.length > 0) {
      for (const item of items) {
        await supabaseDb.createOrderItem({
          orderId: order.id,
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          price: item.price
        })
        
        // Update product stock and sales count
        const product = await supabaseDb.getProductById(item.id)
        if (product) {
          const updates: any = {
            sales_count: (product.sales_count || 0) + item.quantity
          }
          // Only update stock if it's not null (unknown quantity items)
          if (product.stock !== null) {
            updates.stock = Math.max(0, product.stock - item.quantity)
          }
          await supabaseDb.updateProduct(item.id, updates)
        }
      }
    }

    // Create notifications for sale completion
    await supabaseDb.createNotification({
      userId: 1,
      title: 'Sale Completed',
      message: `New sale of KES ${total} completed using ${paymentMethod}`,
      type: 'success'
    })

    // Check for low stock and create notifications
    for (const item of items) {
      const product = await supabaseDb.getProductById(item.id)
      if (product && product.stock !== null && product.stock <= product.low_stock_threshold) {
        await supabaseDb.createNotification({
          userId: 1,
          title: 'Low Stock Alert',
          message: `${product.name} is running low (${product.stock} items remaining)`,
          type: 'warning'
        })
      }
    }

    // Update customer balance for credit sales
    if (paymentMethod === 'credit' && customer) {
      const existingCustomer = await supabaseDb.findCustomerByNameOrPhone(customer)
      if (existingCustomer) {
        const newBalance = parseFloat(existingCustomer.balance) + parseFloat(total.toString())
        await supabaseDb.updateCustomer(existingCustomer.id, { balance: newBalance.toString() })
      }
    }

    res.json(order)
  } catch (error) {
    console.error('Order creation error:', error)
    res.status(500).json({ error: 'Failed to create order' })
  }
})

// Notifications endpoints
app.get('/api/notifications', async (req, res) => {
  try {
    const notifications = await supabaseDb.getNotifications(1) // Using userId 1 for now
    res.json(notifications || [])
  } catch (error) {
    console.error('Notifications fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

app.get('/api/notifications/unread-count', async (req, res) => {
  try {
    const count = await supabaseDb.getUnreadNotificationsCount(1) // Using userId 1 for now
    res.json({ count })
  } catch (error) {
    console.error('Unread notifications error:', error)
    res.status(500).json({ error: 'Failed to fetch unread count' })
  }
})

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params
    await supabaseDb.markNotificationAsRead(parseInt(id))
    res.json({ success: true })
  } catch (error) {
    console.error('Mark notification read error:', error)
    res.status(500).json({ error: 'Failed to mark notification as read' })
  }
})

// Universal search endpoint
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query
    if (!q || q.toString().trim().length < 2) {
      return res.json({ results: [] })
    }

    const query = q.toString().trim()
    const results: any[] = []

    // Search products
    const products = await supabaseDb.searchProducts(query)
    if (products && products.length > 0) {
      products.slice(0, 3).forEach(product => {
        results.push({
          type: 'product',
          title: product.name,
          subtitle: `KES ${product.price} - Stock: ${product.stock || 'Unknown'}`,
          data: product
        })
      })
    }

    // Search customers  
    const customers = await supabaseDb.getCustomers()
    if (customers && customers.length > 0) {
      const filteredCustomers = customers.filter(customer => 
        customer.name?.toLowerCase().includes(query.toLowerCase()) ||
        customer.phone?.includes(query) ||
        customer.email?.toLowerCase().includes(query.toLowerCase())
      )
      filteredCustomers.slice(0, 2).forEach(customer => {
        results.push({
          type: 'customer',
          title: customer.name,
          subtitle: `${customer.phone} - Balance: KES ${customer.balance}`,
          data: customer
        })
      })
    }

    // Search orders
    const orders = await supabaseDb.getOrders(20)
    if (orders && orders.length > 0) {
      const filteredOrders = orders.filter(order => 
        order.customerName?.toLowerCase().includes(query.toLowerCase()) ||
        order.reference?.includes(query)
      )
      filteredOrders.slice(0, 2).forEach(order => {
        results.push({
          type: 'order',
          title: `Order #${order.id}`,
          subtitle: `${order.customerName} - KES ${order.total}`,
          data: order
        })
      })
    }

    res.json({ results: results.slice(0, 8) })
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ error: 'Search failed' })
  }
})

// Settings endpoints
app.get('/api/settings/store', async (req, res) => {
  try {
    const profile = await supabaseDb.getStoreProfile(1) // Using userId 1 for now
    res.json(profile || {})
  } catch (error) {
    console.error('Store profile fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch store profile' })
  }
})

app.put('/api/settings/store', async (req, res) => {
  try {
    try {
      const profile = await supabaseDb.updateStoreProfile(1, req.body)
      res.json(profile)
    } catch (updateError) {
      // If update fails, try to create new profile
      const profile = await supabaseDb.createStoreProfile({ ...req.body, userId: 1 })
      res.json(profile)
    }
  } catch (error) {
    console.error('Store profile update error:', error)
    res.status(500).json({ error: 'Failed to update store profile' })
  }
})

app.get('/api/settings/user', async (req, res) => {
  try {
    const settings = await supabaseDb.getUserSettings(1) // Using userId 1 for now
    res.json(settings || {})
  } catch (error) {
    console.error('User settings fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch user settings' })
  }
})

app.put('/api/settings/user', async (req, res) => {
  try {
    try {
      const settings = await supabaseDb.updateUserSettings(1, req.body)
      res.json(settings)
    } catch (updateError) {
      // If update fails, try to create new settings
      const settings = await supabaseDb.createUserSettings({ ...req.body, userId: 1 })
      res.json(settings)
    }
  } catch (error) {
    console.error('User settings update error:', error)
    res.status(500).json({ error: 'Failed to update user settings' })
  }
})

// Reports endpoints
app.get('/api/reports/summary', async (req, res) => {
  try {
    const { period } = req.query
    const summary = await supabaseDb.getReportsSummary(period as string)
    res.json(summary)
  } catch (error) {
    console.error('Reports summary error:', error)
    res.status(500).json({ error: 'Failed to fetch reports summary' })
  }
})

app.get('/api/reports/trend', async (req, res) => {
  try {
    const { period } = req.query
    const trend = await supabaseDb.getReportsTrend(period as string)
    res.json(trend)
  } catch (error) {
    console.error('Reports trend error:', error)
    res.status(500).json({ error: 'Failed to fetch reports trend' })
  }
})

app.get('/api/reports/top-products', async (req, res) => {
  try {
    const topProducts = await supabaseDb.getTopProducts()
    res.json(topProducts)
  } catch (error) {
    console.error('Top products error:', error)
    res.status(500).json({ error: 'Failed to fetch top products' })
  }
})

app.get('/api/reports/top-customers', async (req, res) => {
  try {
    const topCustomers = await supabaseDb.getTopCustomers()
    res.json(topCustomers)
  } catch (error) {
    console.error('Top customers error:', error)
    res.status(500).json({ error: 'Failed to fetch top customers' })
  }
})

// Reports orders endpoint
app.get('/api/reports/orders', async (req, res) => {
  try {
    const { period = 'daily', page = '1', limit = '10' } = req.query
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const offset = (pageNum - 1) * limitNum

    // Get orders from database
    const allOrders = await supabaseDb.getOrders()
    
    // Filter orders by period
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'weekly':
        startDate.setDate(now.getDate() - 7)
        break
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1)
        break
    }
    
    const filteredOrders = allOrders
      .filter(order => new Date(order.createdAt) >= startDate)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    // Paginate results
    const totalOrders = filteredOrders.length
    const paginatedOrders = filteredOrders.slice(offset, offset + limitNum)
    
    // Transform orders with product details
    const ordersWithDetails = await Promise.all(
      paginatedOrders.map(async (order) => {
        // Get order items for this order
        const orderItems = await supabaseDb.getOrderItems(order.id)
        
        return {
          orderId: order.id,
          customerName: order.customerName || 'Walk-in Customer',
          total: order.total.toString(),
          paymentMethod: order.paymentMethod,
          status: order.status,
          date: new Date(order.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          products: orderItems.map(item => `${item.productName} x${item.quantity}`).join(', ') || 'No items'
        }
      })
    )
    
    res.json({
      orders: ordersWithDetails,
      total: totalOrders,
      page: pageNum,
      totalPages: Math.ceil(totalOrders / limitNum)
    })
  } catch (error) {
    console.error('Reports orders error:', error)
    res.status(500).json({ error: 'Failed to fetch orders data' })
  }
})

// Search endpoint
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query
    const query = q as string
    if (!query) {
      return res.json({ results: [] })
    }
    
    const products = await supabaseDb.searchProducts(query)
    const customers = await supabaseDb.getCustomers()
    const orders = await supabaseDb.getOrders()
    
    const filteredCustomers = customers.filter(customer => 
      customer.name.toLowerCase().includes(query.toLowerCase()) ||
      customer.email?.toLowerCase().includes(query.toLowerCase())
    )
    
    const filteredOrders = orders.filter(order => 
      order.reference?.toLowerCase().includes(query.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(query.toLowerCase())
    )
    
    const results: any[] = []
    
    // Add products
    products.slice(0, 5).forEach(product => {
      results.push({
        type: 'product',
        title: product.name,
        subtitle: `KES ${product.price} - Stock: ${product.stock || 'Unknown'}`,
        data: product
      })
    })
    
    // Add customers
    filteredCustomers.slice(0, 3).forEach(customer => {
      results.push({
        type: 'customer',
        title: customer.name,
        subtitle: `Balance: KES ${customer.balance || '0.00'}`,
        data: customer
      })
    })
    
    // Add orders
    filteredOrders.slice(0, 3).forEach(order => {
      results.push({
        type: 'order',
        title: `Order #${order.id}`,
        subtitle: `${order.customerName} - KES ${order.total}`,
        data: order
      })
    })
    
    res.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ error: 'Failed to perform search' })
  }
})

// Notifications management endpoints
app.post('/api/notifications/mark-all-read', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', 1) // Assuming user ID 1 for now
      .eq('is_read', false)
    if (error) throw error
    res.json({ success: true, message: 'All notifications marked as read' })
  } catch (error) {
    console.error('Mark all read error:', error)
    res.status(500).json({ error: 'Failed to mark all as read' })
  }
})

app.post('/api/notifications/:id/read', async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id)
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', 1) // Assuming user ID 1 for now
    if (error) throw error
    res.json({ success: true, message: 'Notification marked as read' })
  } catch (error) {
    console.error('Mark notification read error:', error)
    res.status(500).json({ error: 'Failed to mark notification as read' })
  }
})

app.delete('/api/notifications/:id', async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id)
    const { data, error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', 1) // Assuming user ID 1 for now
    if (error) throw error
    res.json({ success: true, message: 'Notification deleted' })
  } catch (error) {
    console.error('Delete notification error:', error)
    res.status(500).json({ error: 'Failed to delete notification' })
  }
})

// Customer repayment endpoint
app.post('/api/customers/:id/repayment', async (req, res) => {
  try {
    const customerId = parseInt(req.params.id)
    const { amount, method, note } = req.body

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required' })
    }

    // Get current customer
    const customer = await supabaseDb.getCustomerById(customerId)
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' })
    }

    // Calculate new balance (reduce debt)
    const currentBalance = parseFloat(customer.balance || '0')
    const paymentAmount = parseFloat(amount)
    const newBalance = Math.max(0, currentBalance - paymentAmount)

    // Update customer balance
    await supabaseDb.updateCustomerBalance(customerId, newBalance.toString())

    // Create notification for repayment
    await supabaseDb.createNotification({
      userId: 1,
      title: 'Payment Received',
      message: `${customer.name} made a payment of KES ${amount} via ${method}`,
      type: 'success'
    })

    res.json({
      success: true,
      newBalance: newBalance.toString(),
      paidAmount: amount
    })
  } catch (error) {
    console.error('Record repayment error:', error)
    res.status(500).json({ error: 'Failed to record payment' })
  }
})

// Catch-all for other API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not implemented yet' })
})
// Handle non-API routes - this is handled by Vite middleware in development
// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Server error:', err)
  res.status(500).json({ error: 'Internal server error' })
})
// Serve static files based on environment
if (process.env.NODE_ENV === 'production') {
  // In production, serve static files from dist
  app.use(express.static(path.join(__dirname, '../dist/public')))
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../dist/public/index.html'))
  })
} else {
  // In development, setup Vite integration
  const { setupVite } = await import('./vite.ts')
  await setupVite(app, server)
}

// Start server
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})
export default app;