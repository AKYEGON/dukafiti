import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { supabaseDb } from "./supabase-db";
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

// Simple authentication middleware for development
function requireAuth(req: any, res: any, next: any) {
  // For development, let's use a simple approach
  req.user = { email: 'admin@dukafiti.com' };
  next();
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

  // Add other report endpoints as needed...

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

  return httpServer;
}