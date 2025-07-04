import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { db } from "./db";
import { users, products, customers, orders, orderItems, storeProfiles, userSettings, notifications } from "@shared/schema";
import { insertProductSchema, insertCustomerSchema, insertOrderSchema, insertOrderItemSchema } from "@shared/schema";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { Parser as Json2csvParser } from "json2csv";
import { eq, desc, asc, and, like, or, sql } from "drizzle-orm";

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
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      wsClients.delete(ws);
    });
  });
  
  // Supabase configuration endpoint
  app.get("/api/supabase-config", (req, res) => {
    res.json({
      url: process.env.SUPABASE_URL || 'https://kwdzbssuovwemthmiuht.supabase.co',
      anonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA'
    });
  });
  
  // Auth routes - these will be handled by Supabase Auth on frontend
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password, name } = req.body;
    
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: { name }
      });
      
      if (authError) {
        return res.status(400).json({ error: authError.message });
      }
      
      // Create user profile in users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([{
          email,
          username: name,
          passwordHash: 'managed_by_supabase' // Supabase handles password hashing;
        }])
        .select()
        .single();
      
      if (userError) {
        console.error('Error creating user profile:', userError);
        return res.status(500).json({ error: 'Failed to create user profile' });
      }
      
      res.json({ user: authData.user, profile: userData });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.post("/api/auth/signin", async (req, res) => {
    const { email, password } = req.body;
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password;
      });
      
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      
      res.json({ user: data.user, session: data.session });
    } catch (error) {
      console.error('Signin error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.post("/api/auth/signout", async (req, res) => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      res.json({ message: 'Signed out successfully' });
    } catch (error) {
      console.error('Signout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Products routes
  app.get("/api/products", requireSupabaseAuth, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching products:', error);
        return res.status(500).json({ error: 'Failed to fetch products' });
      }
      
      res.json(data);
    } catch (error) {
      console.error('Products fetch error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.post("/api/products", requireSupabaseAuth, async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      
      const { data, error } = await supabase
        .from('products')
        .insert([validatedData])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating product:', error);
        return res.status(500).json({ error: 'Failed to create product' });
      }
      
      res.json(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Product creation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.put("/api/products/:id", requireSupabaseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProductSchema.partial().parse(req.body);
      
      const { data, error } = await supabase
        .from('products')
        .update(validatedData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating product:', error);
        return res.status(500).json({ error: 'Failed to update product' });
      }
      
      res.json(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Product update error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.delete("/api/products/:id", requireSupabaseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting product:', error);
        return res.status(500).json({ error: 'Failed to delete product' });
      }
      
      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Product deletion error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Search products
  app.get("/api/products/search", requireSupabaseAuth, async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.json([]);
      }
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${q}%,sku.ilike.%${q}%,category.ilike.%${q}%,description.ilike.%${q}%`)
        .order('name')
        .limit(10);
      
      if (error) {
        console.error('Error searching products:', error);
        return res.status(500).json({ error: 'Failed to search products' });
      }
      
      res.json(data);
    } catch (error) {
      console.error('Product search error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Customers routes
  app.get("/api/customers", requireSupabaseAuth, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching customers:', error);
        return res.status(500).json({ error: 'Failed to fetch customers' });
      }
      
      res.json(data);
    } catch (error) {
      console.error('Customers fetch error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.post("/api/customers", requireSupabaseAuth, async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      
      const { data, error } = await supabase
        .from('customers')
        .insert([validatedData])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating customer:', error);
        return res.status(500).json({ error: 'Failed to create customer' });
      }
      
      res.json(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Customer creation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.put("/api/customers/:id", requireSupabaseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCustomerSchema.partial().parse(req.body);
      
      const { data, error } = await supabase
        .from('customers')
        .update(validatedData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating customer:', error);
        return res.status(500).json({ error: 'Failed to update customer' });
      }
      
      res.json(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Customer update error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Orders routes
  app.get("/api/orders", requireSupabaseAuth, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name, price)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching orders:', error);
        return res.status(500).json({ error: 'Failed to fetch orders' });
      }
      
      res.json(data);
    } catch (error) {
      console.error('Orders fetch error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.get("/api/orders/recent", requireSupabaseAuth, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name, price)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error fetching recent orders:', error);
        return res.status(500).json({ error: 'Failed to fetch recent orders' });
      }
      
      res.json(data);
    } catch (error) {
      console.error('Recent orders fetch error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.post("/api/orders", requireSupabaseAuth, async (req, res) => {
    try {
      const { items, paymentMethod, customerName, customer } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Items are required" });
      }
      
      // Calculate total
      const total = items.reduce((sum: number, item: any) => sum + (item.quantity * parseFloat(item.price)), 0);
      
      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customerName: customerName || customer || 'Walk-in Customer',
          total: total.toString(),
          paymentMethod: paymentMethod || 'cash',
          status: 'completed'
        }])
        .select()
        .single();
      
      if (orderError) {
        console.error('Error creating order:', orderError);
        return res.status(500).json({ error: 'Failed to create order' });
      }
      
      // Create order items
      const orderItems = items.map((item: any) => ({
        orderId: orderData.id,
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        price: item.price;
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        return res.status(500).json({ error: 'Failed to create order items' });
      }
      
      // Update product stock for items with known quantities
      for (const item of items) {
        if (item.stock !== null) {
          const { error: stockError } = await supabase
            .from('products')
            .update({ 
              stock: item.stock - item.quantity;
            })
            .eq('id', item.productId);
          
          if (stockError) {
            console.error('Error updating stock:', stockError);
          }
        }
      }
      
      // Broadcast real-time update
      broadcastToClients({
        type: 'sale_completed',
        order: orderData,
        items: orderItems;
      });
      
      res.json({ order: orderData, items: orderItems });
    } catch (error) {
      console.error('Order creation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Dashboard metrics
  app.get("/api/dashboard/metrics", requireSupabaseAuth, async (req, res) => {
    try {
      // Get basic counts
      const { data: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      
      const { data: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });
      
      const { data: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      
      // Get total revenue
      const { data: revenueData, error: revenueError } = await supabase
        .from('orders')
        .select('total')
        .eq('status', 'completed');
      
      if (revenueError) {
        console.error('Error fetching revenue:', revenueError);
        return res.status(500).json({ error: 'Failed to fetch revenue data' });
      }
      
      const totalRevenue = revenueData.reduce((sum: number, order: any) => sum + parseFloat(order.total), 0);
      
      // Get low stock products (we'll filter this in JavaScript for now)
      const { data: allProducts, error: productsError } = await supabase
        .from('products')
        .select('*')
        .not('stock', 'is', null);
      
      const lowStockData = allProducts?.filter((product: any) => 
        product.stock < product.lowStockThreshold
      ) || [];
      
      if (productsError) {
        console.error('Error fetching products:', productsError);
        return res.status(500).json({ error: 'Failed to fetch products data' });
      }
      
      const metrics = {
        totalRevenue: totalRevenue.toFixed(2),
        totalOrders: ordersCount?.length || 0,
        totalProducts: productsCount?.length || 0,
        totalCustomers: customersCount?.length || 0,
        lowStockCount: lowStockData?.length || 0,
        activeCustomersCount: customersCount?.length || 0;
      };
      
      res.json(metrics);
    } catch (error) {
      console.error('Dashboard metrics error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Notifications routes
  app.get("/api/notifications", requireSupabaseAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('userId', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({ error: 'Failed to fetch notifications' });
      }
      
      res.json(data);
    } catch (error) {
      console.error('Notifications fetch error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.get("/api/notifications/unread-count", requireSupabaseAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('userId', user.id)
        .eq('isRead', false);
      
      if (error) {
        console.error('Error fetching unread count:', error);
        return res.status(500).json({ error: 'Failed to fetch unread count' });
      }
      
      res.json({ count: data?.length || 0 });
    } catch (error) {
      console.error('Unread count fetch error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Settings routes
  app.get("/api/settings", requireSupabaseAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('userId', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching settings:', error);
        return res.status(500).json({ error: 'Failed to fetch settings' });
      }
      
      res.json(data);
    } catch (error) {
      console.error('Settings fetch error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Search endpoint
  app.get("/api/search", requireSupabaseAuth, async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.json([]);
      }
      
      // Search products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, price, category')
        .or(`name.ilike.%${q}%,sku.ilike.%${q}%,category.ilike.%${q}%`)
        .limit(5);
      
      // Search customers
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id, name, email, phone')
        .or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
        .limit(5);
      
      const results = [
        ...(products || []).map((p: any) => ({
          id: p.id,
          type: 'product',
          name: p.name,
          subtitle: `${p.category} - KES ${p.price}`,
          url: `/inventory`
        })),
        ...(customers || []).map((c: any) => ({
          id: c.id,
          type: 'customer',
          name: c.name,
          subtitle: c.email || c.phone,
          url: `/customers`
        }))
      ];
      
      res.json(results);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  return httpServer;
}