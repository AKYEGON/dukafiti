import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { db } from "./db";
import { users, products, customers, orders, orderItems, storeProfiles, userSettings, notifications } from "@shared/schema";
import { insertProductSchema, insertCustomerSchema, insertOrderSchema, insertOrderItemSchema } from "@shared/schema";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { Parser as Json2csvParser } from "json2csv";
import { eq, desc, asc, and, like, or, sql, gte, lte } from "drizzle-orm";
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

// Helper function to get current user from local database
async function getCurrentUser(req: any) {
  if (!req.user) {
    return null;
  }
  
  try {
    // Get user profile from local database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, req.user.email))
      .limit(1);
    
    if (user.length === 0) {
      console.error('User not found in database');
      return null;
    }
    
    return user[0];
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

// Simple authentication middleware for development
function requireAuth(req: any, res: any, next: any) {
  // For development, let's use a simple approach
  // In production, you would implement proper session management
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // For development purposes, let's create a mock user
    req.user = { email: 'test@example.com' };
    return next();
  }
  
  // If there's a token, verify it (for future implementation)
  const token = authHeader.substring(7);
  req.user = { email: 'test@example.com' };
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Set up WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    wsClients.add(ws);
    
    ws.on('close', () => {
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
      const [user] = await db
        .insert(users)
        .values({
          email,
          username,
          passwordHash
        })
        .returning();
      
      res.json({ user: { id: user.id, email: user.email, username: user.username } });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  app.post("/api/auth/signin", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Find user
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      if (user.length === 0) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
      
      // Check password
      const isValid = await bcrypt.compare(password, user[0].passwordHash);
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
      
      res.json({ 
        user: { id: user[0].id, email: user[0].email, username: user[0].username },
        session: { access_token: 'mock-token' }
      });
    } catch (error) {
      console.error('Signin error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.post("/api/auth/signout", async (req, res) => {
    try {
      res.json({ message: 'Signed out successfully' });
    } catch (error) {
      console.error('Signout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Products routes
  app.get("/api/products", requireAuth, async (req, res) => {
    try {
      const productList = await db
        .select()
        .from(products)
        .orderBy(products.name);
      
      res.json(productList);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  app.post("/api/products", requireAuth, async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      
      // Handle unknown quantity
      if (validatedData.unknownQuantity) {
        validatedData.stock = null;
      }
      
      const [product] = await db
        .insert(products)
        .values(validatedData)
        .returning();
      
      res.json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  app.put("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const validatedData = insertProductSchema.parse(req.body);
      
      // Handle unknown quantity
      if (validatedData.unknownQuantity) {
        validatedData.stock = null;
      }
      
      const [product] = await db
        .update(products)
        .set(validatedData)
        .where(eq(products.id, productId))
        .returning();
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      res.json(product);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  app.delete("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      
      await db
        .delete(products)
        .where(eq(products.id, productId));
      
      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  // Customers routes
  app.get("/api/customers", requireAuth, async (req, res) => {
    try {
      const customerList = await db
        .select()
        .from(customers)
        .orderBy(customers.name);
      
      res.json(customerList);
    } catch (error) {
      console.error('Error fetching customers:', error);
      res.status(500).json({ error: 'Failed to fetch customers' });
    }
  });

  app.post("/api/customers", requireAuth, async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      
      const [customer] = await db
        .insert(customers)
        .values(validatedData)
        .returning();
      
      res.json(customer);
    } catch (error) {
      console.error('Error creating customer:', error);
      res.status(500).json({ error: 'Failed to create customer' });
    }
  });

  app.put("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const validatedData = insertCustomerSchema.parse(req.body);
      
      const [customer] = await db
        .update(customers)
        .set(validatedData)
        .where(eq(customers.id, customerId))
        .returning();
      
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      
      res.json(customer);
    } catch (error) {
      console.error('Error updating customer:', error);
      res.status(500).json({ error: 'Failed to update customer' });
    }
  });

  // Sales endpoint (used by frontend)
  app.post("/api/sales", requireAuth, async (req, res) => {
    try {
      const { items, paymentType, customer, customerName, customerPhone } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Items are required" });
      }
      
      if (!paymentType || !['cash', 'credit', 'mpesa', 'mobileMoney'].includes(paymentType)) {
        return res.status(400).json({ message: "Valid payment type is required" });
      }

      // For credit sales, require customer information
      if (paymentType === 'credit' && (!customer && !customerName)) {
        return res.status(400).json({ message: "Customer required for credit sales" });
      }

      // Calculate total
      let total = 0;
      const processedItems = [];

      for (const item of items) {
        // Get product details to calculate price
        const product = await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId || item.id))
          .limit(1);
        
        if (product.length === 0) {
          return res.status(400).json({ message: `Product not found: ${item.productId || item.id}` });
        }

        const productData = product[0];
        const quantity = item.quantity || item.qty;
        const itemTotal = parseFloat(productData.price) * quantity;
        total += itemTotal;

        // Check stock for products with known quantities
        if (productData.stock !== null && productData.stock < quantity) {
          return res.status(400).json({ 
            message: `Insufficient stock for ${productData.name}. Available: ${productData.stock}, Requested: ${quantity}` 
          });
        }

        processedItems.push({
          productId: productData.id,
          productName: productData.name,
          quantity,
          price: productData.price
        });
      }

      // Create order
      const finalCustomerName = customer || customerName || 'Walk-in Customer';
      const [order] = await db
        .insert(orders)
        .values({
          customerName: finalCustomerName,
          paymentMethod: paymentType,
          total: total.toString(),
          status: 'completed'
        })
        .returning();
      
      // Create order items and update stock
      for (const item of processedItems) {
        await db
          .insert(orderItems)
          .values({
            orderId: order.id,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price
          });
        
        // Update product stock and sales count
        const product = await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);
        
        if (product[0]) {
          if (product[0].stock !== null) {
            // Update stock for products with known quantities
            await db
              .update(products)
              .set({
                stock: product[0].stock - item.quantity,
                salesCount: product[0].salesCount + item.quantity
              })
              .where(eq(products.id, item.productId));
          } else {
            // For unknown quantity products, just update sales count
            await db
              .update(products)
              .set({
                salesCount: product[0].salesCount + item.quantity
              })
              .where(eq(products.id, item.productId));
          }
        }
      }

      // Handle credit sales - update customer balance if customer exists
      if (paymentType === 'credit' && (customer || customerName)) {
        const customerQuery = await db
          .select()
          .from(customers)
          .where(eq(customers.name, finalCustomerName))
          .limit(1);
        
        if (customerQuery.length > 0) {
          const currentBalance = parseFloat(customerQuery[0].balance);
          const newBalance = currentBalance + total;
          
          await db
            .update(customers)
            .set({ balance: newBalance.toString() })
            .where(eq(customers.id, customerQuery[0].id));
        }
      }
      
      // Broadcast notification
      broadcastToClients({
        type: 'sale_completed',
        data: { 
          orderId: order.id, 
          total, 
          customerName: finalCustomerName,
          paymentMethod: paymentType;
        }
      });
      
      res.json({ 
        success: true,
        order,
        message: 'Sale completed successfully'
      });
    } catch (error) {
      console.error('Error processing sale:', error);
      res.status(500).json({ error: 'Failed to process sale', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Orders routes
  app.get("/api/orders", requireAuth, async (req, res) => {
    try {
      const orderList = await db
        .select({
          id: orders.id,
          customerName: orders.customerName,
          total: orders.total,
          paymentMethod: orders.paymentMethod,
          status: orders.status,
          createdAt: orders.createdAt
        })
        .from(orders)
        .orderBy(desc(orders.createdAt));
      
      res.json(orderList);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  app.get("/api/orders/recent", requireAuth, async (req, res) => {
    try {
      const recentOrders = await db
        .select({
          id: orders.id,
          customerName: orders.customerName,
          total: orders.total,
          paymentMethod: orders.paymentMethod,
          status: orders.status,
          createdAt: orders.createdAt
        })
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(10);
      
      res.json(recentOrders);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      res.status(500).json({ error: 'Failed to fetch recent orders' });
    }
  });

  app.post("/api/orders", requireAuth, async (req, res) => {
    try {
      const { items, customerName, paymentMethod, total } = req.body;
      
      // Create order
      const [order] = await db
        .insert(orders)
        .values({
          customerName,
          paymentMethod,
          total: total.toString(),
          status: 'completed'
        })
        .returning();
      
      // Create order items and update stock
      for (const item of items) {
        await db
          .insert(orderItems)
          .values({
            orderId: order.id,
            productId: item.id,
            productName: item.name,
            quantity: item.quantity,
            price: item.price
          });
        
        // Update product stock and sales count if stock is not null
        const product = await db
          .select()
          .from(products)
          .where(eq(products.id, item.id))
          .limit(1);
        
        if (product[0] && product[0].stock !== null) {
          await db
            .update(products)
            .set({
              stock: product[0].stock - item.quantity,
              salesCount: product[0].salesCount + item.quantity
            })
            .where(eq(products.id, item.id));
        } else {
          // For unknown quantity products, just update sales count
          await db
            .update(products)
            .set({
              salesCount: product[0].salesCount + item.quantity
            })
            .where(eq(products.id, item.id));
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
      // Get total revenue
      const revenueResult = await db
        .select({ total: sql<number>`SUM(CAST(total AS DECIMAL))` })
        .from(orders)
        .where(eq(orders.status, 'completed'));
      
      const totalRevenue = revenueResult[0]?.total || 0;
      
      // Get total orders
      const orderCountResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(orders)
        .where(eq(orders.status, 'completed'));
      
      const totalOrders = orderCountResult[0]?.count || 0;
      
      // Get total products
      const productCountResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(products);
      
      const totalProducts = productCountResult[0]?.count || 0;
      
      // Get total customers
      const customerCountResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(customers);
      
      const totalCustomers = customerCountResult[0]?.count || 0;
      
      // Get low stock count (exclude null stock items)
      const lowStockResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(products)
        .where(
          and(
            sql`stock IS NOT NULL`,
            sql`stock <= low_stock_threshold`
          )
        );
      
      const lowStockCount = lowStockResult[0]?.count || 0;
      
      res.json({
        totalRevenue: totalRevenue.toString(),
        totalOrders,
        totalProducts,
        totalCustomers,
        revenueGrowth: "0",
        ordersGrowth: "0",
        lowStockCount,
        activeCustomersCount: totalCustomers
      });
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
    }
  });

  // Notifications routes
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      const notificationList = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, user.id))
        .orderBy(desc(notifications.createdAt));
      
      res.json(notificationList);
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
      
      const result = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, user.id),
            eq(notifications.isRead, false)
          )
        );
      
      res.json({ count: result[0]?.count || 0 });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ error: 'Failed to fetch unread count' });
    }
  });

  // Store profile routes
  app.get("/api/store", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const profile = await db
        .select()
        .from(storeProfiles)
        .where(eq(storeProfiles.userId, user.id))
        .limit(1);
      
      if (profile.length === 0) {
        return res.json({});
      }
      
      // Transform database fields to frontend field names
      const transformedProfile = {
        storeName: profile[0].storeName,
        ownerName: profile[0].ownerName || '',
        address: profile[0].location || '',
        storeType: profile[0].storeType,
        location: profile[0].location,
        description: profile[0].description
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
      
      const existingProfile = await db
        .select()
        .from(storeProfiles)
        .where(eq(storeProfiles.userId, user.id))
        .limit(1);
      
      // Map frontend fields to database fields
      const profileData = {
        storeName: req.body.storeName,
        ownerName: req.body.ownerName,
        storeType: req.body.storeType || 'retail',
        location: req.body.address,
        description: req.body.description || ''
      };

      let profile;
      if (existingProfile.length > 0) {
        [profile] = await db
          .update(storeProfiles)
          .set(profileData)
          .where(eq(storeProfiles.userId, user.id))
          .returning();
      } else {
        [profile] = await db
          .insert(storeProfiles)
          .values({
            userId: user.id,
            ...profileData
          })
          .returning();
      }
      
      res.json(profile);
    } catch (error) {
      console.error('Store profile save error:', error);
      res.status(500).json({ error: 'Failed to save store profile' });
    }
  });

  // Settings routes
  app.get("/api/settings", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      const settings = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, user.id))
        .limit(1);
      
      res.json(settings[0] || {});
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  // Theme settings endpoint
  app.put("/api/settings/theme", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const { theme } = req.body;
      
      if (!['light', 'dark'].includes(theme)) {
        return res.status(400).json({ error: 'Theme must be either "light" or "dark"' });
      }
      
      const existingSettings = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, user.id))
        .limit(1);
      
      if (existingSettings.length > 0) {
        await db
          .update(userSettings)
          .set({ theme })
          .where(eq(userSettings.userId, user.id));
      } else {
        await db
          .insert(userSettings)
          .values({
            userId: user.id,
            theme,
            currency: 'KES',
            language: 'en',
            notifications: true,
            mpesaEnabled: false
          });
      }
      
      res.json({ theme });
    } catch (error) {
      console.error('Theme setting save error:', error);
      res.status(500).json({ error: 'Failed to save theme setting' });
    }
  });

  // Search endpoint
  app.get("/api/search", requireAuth, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.json([]);
      }
      
      const searchTerm = `%${q.toLowerCase()}%`;
      
      // Search products
      const productResults = await db
        .select({
          id: products.id,
          name: products.name,
          price: products.price,
          type: sql<string>`'product'`
        })
        .from(products)
        .where(
          or(
            like(sql`LOWER(${products.name})`, searchTerm),
            like(sql`LOWER(${products.sku})`, searchTerm),
            like(sql`LOWER(${products.category})`, searchTerm)
          )
        )
        .limit(8);
      
      res.json(productResults);
    } catch (error) {
      console.error('Error searching:', error);
      res.status(500).json({ error: 'Failed to search' });
    }
  });

  // Frequent products endpoint
  app.get("/api/products/frequent", requireAuth, async (req, res) => {
    try {
      const frequentProducts = await db
        .select({
          id: products.id,
          name: products.name,
          price: products.price,
          salesCount: products.salesCount
        })
        .from(products)
        .orderBy(desc(products.salesCount))
        .limit(6);
      
      res.json(frequentProducts);
    } catch (error) {
      console.error('Error fetching frequent products:', error);
      res.status(500).json({ error: 'Failed to fetch frequent products' });
    }
  });

  // Product search endpoint
  app.get("/api/products/search", requireAuth, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.json([]);
      }
      
      const searchTerm = `%${q.toLowerCase()}%`;
      
      const productResults = await db
        .select()
        .from(products)
        .where(
          or(
            like(sql`LOWER(${products.name})`, searchTerm),
            like(sql`LOWER(${products.sku})`, searchTerm),
            like(sql`LOWER(${products.category})`, searchTerm),
            like(sql`LOWER(${products.description})`, searchTerm)
          )
        )
        .limit(8);
      
      res.json(productResults);
    } catch (error) {
      console.error('Error searching products:', error);
      res.status(500).json({ error: 'Failed to search products' });
    }
  });

  // Reports API endpoints
  app.get('/api/reports/summary', requireAuth, async (req, res) => {
    try {
      const period = req.query.period || 'today';
      
      let startDate: Date;
      let endDate = new Date();
      
      switch (period) {
        case 'weekly':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'monthly':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
          break;
        default: // today
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
      }
      
      const filteredOrders = await db
        .select()
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, startDate),
            lte(orders.createdAt, endDate)
          )
        );
      
      let totalSales = 0;
      let cashSales = 0;
      let mobileMoneySales = 0;
      let creditSales = 0;
      
      filteredOrders.forEach(order => {
        const amount = parseFloat(order.total);
        totalSales += amount;
        
        if (order.status === 'paid' || order.status === 'completed') {
          if (order.paymentMethod === 'cash') {
            cashSales += amount;
          } else if (order.paymentMethod === 'mobileMoney') {
            mobileMoneySales += amount;
          }
        }
        
        if (order.paymentMethod === 'credit') {
          creditSales += amount;
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

  app.get('/api/reports/trend', requireAuth, async (req, res) => {
    try {
      const period = req.query.period || 'daily';
      
      let trendData: Array<{ label: string; value: number }> = [];
      
      switch (period) {
        case 'daily':
          // 24 hours
          trendData = Array.from({ length: 24 }, (_, i) => ({
            label: `${i.toString().padStart(2, '0')}:00`,
            value: 0;
          }));
          
          const today = new Date();
          const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          
          const todayOrders = await db
            .select()
            .from(orders)
            .where(gte(orders.createdAt, startOfDay));
          
          todayOrders.forEach(order => {
            const hour = new Date(order.createdAt).getHours();
            trendData[hour].value += parseFloat(order.total);
          });
          break;
          
        case 'weekly':
          // 7 days
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          trendData = dayNames.map(day => ({ label: day, value: 0 }));
          
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - 7);
          
          const weekOrders = await db
            .select()
            .from(orders)
            .where(gte(orders.createdAt, weekStart));
          
          weekOrders.forEach(order => {
            const dayOfWeek = new Date(order.createdAt).getDay();
            trendData[dayOfWeek].value += parseFloat(order.total);
          });
          break;
          
        case 'monthly':
          // 30 days
          trendData = Array.from({ length: 30 }, (_, i) => ({
            label: (i + 1).toString(),
            value: 0;
          }));
          
          const monthStart = new Date();
          monthStart.setDate(monthStart.getDate() - 30);
          
          const monthOrders = await db
            .select()
            .from(orders)
            .where(gte(orders.createdAt, monthStart));
          
          monthOrders.forEach(order => {
            const dayOfMonth = new Date(order.createdAt).getDate() - 1;
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

  app.get('/api/reports/top-items', requireAuth, async (req, res) => {
    try {
      const topItems = await db
        .select({
          name: products.name,
          unitsSold: products.salesCount,
          revenue: sql<string>`CAST(${products.salesCount} * CAST(${products.price} AS DECIMAL) AS TEXT)`
        })
        .from(products)
        .orderBy(desc(products.salesCount))
        .limit(10);
      
      res.json(topItems.map(item => ({
        name: item.name,
        unitsSold: item.unitsSold,
        revenue: parseFloat(item.revenue || '0').toFixed(2)
      })));
    } catch (error) {
      console.error('Top items reports error:', error);
      res.status(500).json({ message: 'Failed to fetch top items' });
    }
  });

  app.get('/api/reports/top-customers', requireAuth, async (req, res) => {
    try {
      const topCustomers = await db
        .select({
          customerName: customers.name,
          totalOwed: customers.balance
        })
        .from(customers)
        .where(sql`CAST(${customers.balance} AS DECIMAL) > 0`)
        .orderBy(desc(sql`CAST(${customers.balance} AS DECIMAL)`))
        .limit(5);
      
      res.json(topCustomers.map(customer => ({
        customerName: customer.customerName,
        totalOwed: parseFloat(customer.totalOwed).toFixed(2),
        outstandingOrders: 1;
      })));
    } catch (error) {
      console.error('Top customers reports error:', error);
      res.status(500).json({ message: 'Failed to fetch top customers' });
    }
  });

  app.get('/api/reports/top-products', requireAuth, async (req, res) => {
    try {
      const topProducts = await db
        .select({
          name: products.name,
          unitsSold: products.salesCount,
          revenue: sql<string>`CAST(${products.salesCount} * CAST(${products.price} AS DECIMAL) AS TEXT)`
        })
        .from(products)
        .orderBy(desc(products.salesCount))
        .limit(10);
      
      res.json(topProducts.map(product => ({
        productName: product.name,
        unitsSold: product.unitsSold,
        totalRevenue: parseFloat(product.revenue || '0').toFixed(2)
      })));
    } catch (error) {
      console.error('Top products reports error:', error);
      res.status(500).json({ message: 'Failed to fetch top products' });
    }
  });

  app.get('/api/reports/credits', requireAuth, async (req, res) => {
    try {
      const customerCredits = await db
        .select({
          name: customers.name,
          phone: customers.phone,
          balance: customers.balance
        })
        .from(customers)
        .where(sql`CAST(${customers.balance} AS DECIMAL) > 0`)
        .orderBy(desc(sql`CAST(${customers.balance} AS DECIMAL)`));
      
      res.json(customerCredits.map(customer => ({
        name: customer.name,
        phone: customer.phone || 'N/A',
        balance: customer.balance;
      })));
    } catch (error) {
      console.error('Customer credits reports error:', error);
      res.status(500).json({ message: 'Failed to fetch customer credits' });
    }
  });

  app.get('/api/reports/orders', requireAuth, async (req, res) => {
    try {
      const { period = 'daily', page = '1', limit = '20' } = req.query;
      const today = new Date();
      let startDate: Date;

      switch (period) {
        case 'weekly':
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 7);
          break;
        case 'monthly':
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 30);
          break;
        default: // daily
          startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      const filteredOrders = await db
        .select({
          id: orders.id,
          customerName: orders.customerName,
          total: orders.total,
          paymentMethod: orders.paymentMethod,
          status: orders.status,
          reference: orders.reference,
          createdAt: orders.createdAt
        })
        .from(orders)
        .where(gte(orders.createdAt, startDate))
        .orderBy(desc(orders.createdAt))
        .limit(limitNum)
        .offset(offset);

      // Get order items for each order
      const ordersWithItems = await Promise.all(
        filteredOrders.map(async (order) => {
          const items = await db
            .select({
              productName: orderItems.productName,
              quantity: orderItems.quantity
            })
            .from(orderItems)
            .where(eq(orderItems.orderId, order.id));

          return {
            orderId: order.id,
            date: order.createdAt.toISOString().split('T')[0],
            customerName: order.customerName,
            total: order.total,
            paymentMethod: order.paymentMethod,
            status: order.status,
            reference: order.reference,
            products: items.map(item => ({
              name: item.productName,
              quantity: item.quantity;
            }))
          };
        })
      );

      const totalCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(orders)
        .where(gte(orders.createdAt, startDate));

      res.json({
        orders: ordersWithItems,
        total: totalCount[0]?.count || 0,
        page: pageNum,
        totalPages: Math.ceil((totalCount[0]?.count || 0) / limitNum)
      });
    } catch (error) {
      console.error('Orders reports error:', error);
      res.status(500).json({ message: 'Failed to fetch orders' });
    }
  });

  // Supabase configuration endpoint for client
  app.get('/api/supabase-config', (req, res) => {
    res.json({
      url: process.env.SUPABASE_URL!,
      anonKey: process.env.SUPABASE_ANON_KEY!
    });
  });

  return httpServer;
}