import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { supabaseDb, supabase } from "./supabase-db";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { Parser as Json2csvParser } from "json2csv";
import bcrypt from "bcryptjs";

// WebSocket clients store
const wsClients = new Set<WebSocket>();

// Broadcast function for real-time notifications
function broadcastToClients(message: any) {
  const messageStr = JSON.stringify(message);
  wsClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// Helper function to get current user from Supabase
async function getCurrentUser(req: any) {
  if (!req.user) {
    return null;
  }
  
  try {
    const user = await supabaseDb.getUserByEmail(req.user.email);
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

// Authentication middleware using session
function requireAuth(req: any, res: any, next: any) {
  // Check if user is authenticated via session
  if (req.session && req.session.user) {
    req.user = req.session.user;
    next();
  } else {
    // For API endpoints, set a default user for now
    req.user = { email: 'admin@dukafiti.com', id: 1 };
    next();
  }
}

export async function registerSupabaseRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Set up WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    wsClients.add(ws);
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      wsClients.delete(ws);
    });
  });

  // Authentication routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, username } = req.body;
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await supabaseDb.createUser({
        email,
        username,
        password_hash: passwordHash,
      });
      
      res.json({ user: { id: user.id, email: user.email, username: user.username } });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(400).json({ error: 'Failed to create user' });
    }
  });

  app.post("/api/auth/signin", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Get user from Supabase
      const user = await supabaseDb.getUserByEmail(email);
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      res.json({ user: { id: user.id, email: user.email, username: user.username } });
    } catch (error) {
      console.error('Signin error:', error);
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  // Products routes
  app.get("/api/products", requireAuth, async (req, res) => {
    try {
      const products = await supabaseDb.getProducts();
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  app.post("/api/products", requireAuth, async (req, res) => {
    try {
      const { unknownQuantity, ...productData } = req.body;
      
      // Handle unknown quantity
      if (unknownQuantity) {
        productData.stock = null;
      }
      
      const product = await supabaseDb.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  app.put("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const { unknownQuantity, ...productData } = req.body;
      
      // Handle unknown quantity
      if (unknownQuantity) {
        productData.stock = null;
      }
      
      const product = await supabaseDb.updateProduct(productId, productData);
      res.json(product);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  app.delete("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      await supabaseDb.deleteProduct(productId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  // Customers routes
  app.get("/api/customers", requireAuth, async (req, res) => {
    try {
      const customers = await supabaseDb.getCustomers();
      res.json(customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      res.status(500).json({ error: 'Failed to fetch customers' });
    }
  });

  app.post("/api/customers", requireAuth, async (req, res) => {
    try {
      const customer = await supabaseDb.createCustomer(req.body);
      res.json(customer);
    } catch (error) {
      console.error('Error creating customer:', error);
      res.status(500).json({ error: 'Failed to create customer' });
    }
  });

  app.put("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const customer = await supabaseDb.updateCustomer(customerId, req.body);
      res.json(customer);
    } catch (error) {
      console.error('Error updating customer:', error);
      res.status(500).json({ error: 'Failed to update customer' });
    }
  });

  // Orders routes
  app.get("/api/orders/recent", requireAuth, async (req, res) => {
    try {
      const orders = await supabaseDb.getOrders(10);
      res.json(orders);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      res.status(500).json({ error: 'Failed to fetch recent orders' });
    }
  });

  app.post("/api/orders", requireAuth, async (req, res) => {
    try {
      const { items, customerName, paymentMethod } = req.body;
      
      // Calculate total
      let total = 0;
      const products = await supabaseDb.getProducts();
      
      for (const item of items) {
        const product = products.find(p => p.id === item.id);
        if (product) {
          total += parseFloat(product.price) * item.quantity;
        }
      }
      
      // Create order
      const order = await supabaseDb.createOrder({
        customer_name: customerName,
        total: total.toFixed(2),
        payment_method: paymentMethod,
        status: 'completed',
      });
      
      // Create order items and update product stock
      for (const item of items) {
        const product = products.find(p => p.id === item.id);
        if (product) {
          // Create order item
          await supabaseDb.createOrderItem({
            order_id: order.id,
            product_id: item.id,
            product_name: product.name,
            quantity: item.quantity,
            price: product.price,
          });
          
          // Update product stock and sales count
          if (product.stock !== null) {
            await supabaseDb.updateProduct(item.id, {
              stock: Math.max(0, product.stock - item.quantity),
              sales_count: product.sales_count + item.quantity,
            });
          } else {
            await supabaseDb.updateProduct(item.id, {
              sales_count: product.sales_count + item.quantity,
            });
          }
        }
      }
      
      // Broadcast notification
      broadcastToClients({
        type: 'sale_completed',
        data: { orderId: order.id, total, customerName }
      });
      
      res.json(order);
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  });

  // Sales endpoint (used by frontend)
  app.post("/api/sales", requireAuth, async (req, res) => {
    try {
      const { items, paymentType, customerName, customerPhone } = req.body;
      
      // Calculate total
      let total = 0;
      const products = await supabaseDb.getProducts();
      
      for (const item of items) {
        const product = products.find(p => p.id === item.id);
        if (product) {
          total += parseFloat(product.price) * item.quantity;
        }
      }
      
      // Map payment types
      const paymentMethod = paymentType === 'mobileMoney' ? 'mobile_money' : paymentType;
      
      // Create order
      const order = await supabaseDb.createOrder({
        customer_name: customerName || customerPhone || 'Walk-in Customer',
        total: total.toFixed(2),
        payment_method: paymentMethod,
        status: 'completed',
      });
      
      // Create order items and update product stock
      for (const item of items) {
        const product = products.find(p => p.id === item.id);
        if (product) {
          // Create order item
          await supabaseDb.createOrderItem({
            order_id: order.id,
            product_id: item.id,
            product_name: product.name,
            quantity: item.quantity,
            price: product.price,
          });
          
          // Update product stock and sales count
          if (product.stock !== null) {
            await supabaseDb.updateProduct(item.id, {
              stock: Math.max(0, product.stock - item.quantity),
              sales_count: product.sales_count + item.quantity,
            });
          } else {
            await supabaseDb.updateProduct(item.id, {
              sales_count: product.sales_count + item.quantity,
            });
          }
        }
      }
      
      // Handle credit sales - update customer balance
      if (paymentMethod === 'credit' && (customerName || customerPhone)) {
        try {
          const customerData = customerName || customerPhone;
          const customer = await supabaseDb.findCustomerByNameOrPhone(customerData);
          
          if (customer) {
            // Update existing customer balance
            const newBalance = parseFloat(customer.balance) + total;
            await supabaseDb.updateCustomer(customer.id, {
              balance: newBalance.toFixed(2)
            });
          } else {
            // Create new customer with credit balance
            await supabaseDb.createCustomer({
              name: customerName || 'Unknown',
              phone: customerPhone || '',
              email: '',
              balance: total.toFixed(2)
            });
          }
        } catch (error) {
          console.error('Error updating customer balance:', error);
        }
      }
      
      // Broadcast notification
      broadcastToClients({
        type: 'sale_completed',
        data: { orderId: order.id, total, customerName: customerName || customerPhone }
      });
      
      res.json({ success: true, orderId: order.id, total: total.toFixed(2) });
    } catch (error) {
      console.error('Error creating sale:', error);
      res.status(500).json({ error: 'Failed to create sale' });
    }
  });

  // Dashboard metrics
  app.get("/api/dashboard/metrics", requireAuth, async (req, res) => {
    try {
      const metrics = await supabaseDb.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
    }
  });

  // Settings routes
  app.get("/api/settings", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      const settings = await supabaseDb.getUserSettings(user.id);
      res.json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.put("/api/settings/theme", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      const { theme } = req.body;
      await supabaseDb.updateUserSettings(user.id, { theme });
      res.json({ theme });
    } catch (error) {
      console.error('Error updating theme:', error);
      res.status(500).json({ error: 'Failed to update theme' });
    }
  });

  // Reports routes
  app.get('/api/reports/top-products', requireAuth, async (req, res) => {
    try {
      const topProducts = await supabaseDb.getTopProducts();
      res.json(topProducts);
    } catch (error) {
      console.error('Top products reports error:', error);
      res.status(500).json({ message: 'Failed to fetch top products' });
    }
  });

  app.get('/api/reports/top-customers', requireAuth, async (req, res) => {
    try {
      const topCustomers = await supabaseDb.getTopCustomers();
      res.json(topCustomers);
    } catch (error) {
      console.error('Top customers reports error:', error);
      res.status(500).json({ message: 'Failed to fetch top customers' });
    }
  });

  // Summary endpoint for reports
  app.get('/api/reports/summary', requireAuth, async (req, res) => {
    try {
      const { period = 'today' } = req.query;
      let startDate: Date;
      const now = new Date();

      switch (period) {
        case 'weekly':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'monthly':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 30);
          break;
        default: // today
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      }

      const { data: orders, error } = await supabase
        .from('orders')
        .select('total, payment_method, status')
        .gte('created_at', startDate.toISOString())
        .eq('status', 'completed');

      if (error) throw error;

      let totalSales = 0;
      let cashSales = 0;
      let mobileMoneySales = 0;
      let creditSales = 0;

      orders.forEach(order => {
        const amount = parseFloat(order.total);
        totalSales += amount;
        
        switch (order.payment_method) {
          case 'cash':
            cashSales += amount;
            break;
          case 'mobileMoney':
            mobileMoneySales += amount;
            break;
          case 'credit':
            creditSales += amount;
            break;
        }
      });

      res.json({
        totalSales: totalSales.toFixed(2),
        cashSales: cashSales.toFixed(2),
        mobileMoneySales: mobileMoneySales.toFixed(2),
        creditSales: creditSales.toFixed(2)
      });
    } catch (error) {
      console.error('Summary reports error:', error);
      res.status(500).json({ message: 'Failed to fetch summary data' });
    }
  });

  // Trend endpoint for reports
  app.get('/api/reports/trend', requireAuth, async (req, res) => {
    try {
      const { period = 'daily' } = req.query;
      let trendData: any[] = [];

      switch (period) {
        case 'daily':
          // 24 hourly points
          trendData = Array.from({ length: 24 }, (_, i) => ({
            label: `${i.toString().padStart(2, '0')}:00`,
            value: 0
          }));
          
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          
          const { data: dailyOrders, error: dailyError } = await supabase
            .from('orders')
            .select('total, created_at')
            .gte('created_at', todayStart.toISOString())
            .eq('status', 'completed');
          
          if (dailyError) throw dailyError;
          
          dailyOrders.forEach(order => {
            const hour = new Date(order.created_at).getHours();
            trendData[hour].value += parseFloat(order.total);
          });
          break;

        case 'weekly':
          // 7 daily points
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          trendData = dayNames.map(day => ({ label: day, value: 0 }));
          
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - 7);
          
          const { data: weeklyOrders, error: weeklyError } = await supabase
            .from('orders')
            .select('total, created_at')
            .gte('created_at', weekStart.toISOString())
            .eq('status', 'completed');
          
          if (weeklyError) throw weeklyError;
          
          weeklyOrders.forEach(order => {
            const dayOfWeek = new Date(order.created_at).getDay();
            trendData[dayOfWeek].value += parseFloat(order.total);
          });
          break;

        case 'monthly':
          // 30 daily points
          trendData = Array.from({ length: 30 }, (_, i) => ({
            label: (i + 1).toString(),
            value: 0
          }));
          
          const monthStart = new Date();
          monthStart.setDate(monthStart.getDate() - 30);
          
          const { data: monthlyOrders, error: monthlyError } = await supabase
            .from('orders')
            .select('total, created_at')
            .gte('created_at', monthStart.toISOString())
            .eq('status', 'completed');
          
          if (monthlyError) throw monthlyError;
          
          monthlyOrders.forEach(order => {
            const dayOfMonth = new Date(order.created_at).getDate() - 1;
            if (dayOfMonth >= 0 && dayOfMonth < 30) {
              trendData[dayOfMonth].value += parseFloat(order.total);
            }
          });
          break;
      }

      res.json(trendData);
    } catch (error) {
      console.error('Trend reports error:', error);
      res.status(500).json({ message: 'Failed to fetch trend data' });
    }
  });

  // Top items endpoint
  app.get('/api/reports/top-items', requireAuth, async (req, res) => {
    try {
      const topItems = await supabaseDb.getTopProducts();
      res.json(topItems.map(item => ({
        name: item.productName,
        unitsSold: item.unitsSold,
        revenue: item.totalRevenue
      })));
    } catch (error) {
      console.error('Top items reports error:', error);
      res.status(500).json({ message: 'Failed to fetch top items' });
    }
  });

  // Top products endpoint (for Reports page)
  app.get('/api/reports/top-products', requireAuth, async (req, res) => {
    try {
      const topProducts = await supabaseDb.getTopProducts();
      res.json(topProducts.map(product => ({
        productName: product.productName,
        unitsSold: product.unitsSold,
        totalRevenue: product.totalRevenue
      })));
    } catch (error) {
      console.error('Top products reports error:', error);
      res.status(500).json({ message: 'Failed to fetch top products' });
    }
  });

  // Credits endpoint for reports
  app.get('/api/reports/credits', requireAuth, async (req, res) => {
    try {
      const { data: customerCredits, error } = await supabase
        .from('customers')
        .select('name, phone, balance')
        .gt('balance', 0)
        .order('balance', { ascending: false });
      
      if (error) throw error;
      
      res.json(customerCredits.map(customer => ({
        name: customer.name,
        phone: customer.phone || 'N/A',
        balance: customer.balance
      })));
    } catch (error) {
      console.error('Customer credits reports error:', error);
      res.status(500).json({ message: 'Failed to fetch customer credits' });
    }
  });

  // Orders endpoint for reports
  app.get('/api/reports/orders', requireAuth, async (req, res) => {
    try {
      const { period = 'daily', page = '1', limit = '20' } = req.query;
      let startDate: Date;
      const now = new Date();

      switch (period) {
        case 'weekly':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'monthly':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 30);
          break;
        default: // daily
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, customer_name, total, payment_method, status, reference, created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .range(offset, offset + limitNum - 1);

      if (ordersError) throw ordersError;

      // Get order items for each order
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('product_name, quantity')
            .eq('order_id', order.id);

          if (itemsError) throw itemsError;

          return {
            orderId: order.id,
            date: order.created_at.split('T')[0],
            customerName: order.customer_name,
            total: order.total,
            paymentMethod: order.payment_method,
            status: order.status,
            reference: order.reference,
            products: items.map(item => ({
              name: item.product_name,
              quantity: item.quantity
            }))
          };
        })
      );

      const { count, error: countError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      if (countError) throw countError;

      res.json({
        orders: ordersWithItems,
        total: count || 0,
        page: pageNum,
        totalPages: Math.ceil((count || 0) / limitNum)
      });
    } catch (error) {
      console.error('Orders reports error:', error);
      res.status(500).json({ message: 'Failed to fetch orders' });
    }
  });

  // Notifications routes
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      const notifications = await supabaseDb.getNotifications(user.id);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      const count = await supabaseDb.getUnreadNotificationsCount(user.id);
      res.json({ count: count.toString() });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ error: 'Failed to fetch unread count' });
    }
  });

  app.delete("/api/notifications/:id", requireAuth, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await supabaseDb.deleteNotification(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  });

  // Store profile routes
  app.get("/api/store", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const profile = await supabaseDb.getStoreProfile(user.id);
      
      // Map snake_case to camelCase for frontend
      const transformedProfile = {
        storeName: profile.store_name,
        ownerName: profile.owner_name,
        address: profile.location,
        storeType: profile.store_type,
        location: profile.location,
        description: profile.description,
      };
      
      res.json(transformedProfile);
    } catch (error) {
      console.error('Store profile fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch store profile' });
    }
  });

  app.put("/api/store", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      try {
        const existingProfile = await supabaseDb.getStoreProfile(user.id);
        const profile = await supabaseDb.updateStoreProfile(user.id, req.body);
        res.json(profile);
      } catch (error) {
        // Profile doesn't exist, create new one
        const profile = await supabaseDb.createStoreProfile({
          userId: user.id,
          ...req.body,
        });
        res.json(profile);
      }
    } catch (error) {
      console.error('Store profile save error:', error);
      res.status(500).json({ error: 'Failed to save store profile' });
    }
  });

  // Product search routes
  app.get("/api/products/search", requireAuth, async (req, res) => {
    try {
      const { q = '' } = req.query;
      const searchTerm = q.toString().toLowerCase();
      
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .limit(8);
      
      if (error) throw error;
      
      res.json(products);
    } catch (error) {
      console.error('Error searching products:', error);
      res.status(500).json({ error: 'Failed to search products' });
    }
  });

  app.get("/api/products/frequent", requireAuth, async (req, res) => {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('sales_count', { ascending: false })
        .limit(6);
      
      if (error) throw error;
      
      res.json(products);
    } catch (error) {
      console.error('Error fetching frequent products:', error);
      res.status(500).json({ error: 'Failed to fetch frequent products' });
    }
  });

  // Payment routes
  app.post("/api/customers/:id/payment", requireAuth, async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const { amount } = req.body;
      
      // Get current customer
      const customer = await supabaseDb.getCustomerById(customerId);
      const currentBalance = parseFloat(customer.balance);
      const paymentAmount = parseFloat(amount);
      const newBalance = Math.max(0, currentBalance - paymentAmount);
      
      // Update customer balance
      const updatedCustomer = await supabaseDb.updateCustomer(customerId, {
        balance: newBalance.toFixed(2)
      });
      
      res.json(updatedCustomer);
    } catch (error) {
      console.error('Error processing payment:', error);
      res.status(500).json({ error: 'Failed to process payment' });
    }
  });

  // Search endpoints
  app.get("/api/search", requireAuth, async (req, res) => {
    try {
      const { q = '' } = req.query;
      const searchTerm = q.toString().toLowerCase();
      
      if (!searchTerm.trim()) {
        return res.json([]);
      }
      
      const results: Array<{
        id: number;
        type: string;
        name: string;
        subtitle: string;
        url: string;
      }> = [];
      
      // Search products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, sku, price')
        .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)
        .limit(3);
      
      if (!productsError) {
        products.forEach(product => {
          results.push({
            id: product.id,
            type: 'product',
            name: product.name,
            subtitle: `SKU: ${product.sku}`,
            url: `/inventory`
          });
        });
      }
      
      // Search customers
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id, name, phone')
        .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .limit(3);
      
      if (!customersError) {
        customers.forEach(customer => {
          results.push({
            id: customer.id,
            type: 'customer',
            name: customer.name,
            subtitle: customer.phone || 'No phone',
            url: `/customers`
          });
        });
      }
      
      // Search orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, customer_name, total')
        .or(`customer_name.ilike.%${searchTerm}%`)
        .limit(2);
      
      if (!ordersError) {
        orders.forEach(order => {
          results.push({
            id: order.id,
            type: 'order',
            name: `Order #${order.id}`,
            subtitle: `${order.customer_name} - KES ${order.total}`,
            url: `/orders`
          });
        });
      }
      
      res.json(results.slice(0, 8));
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  });

  // Dashboard metrics helper
  app.get("/api/metrics/dashboard", requireAuth, async (req, res) => {
    try {
      const metrics = await supabaseDb.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
    }
  });

  return httpServer;
}