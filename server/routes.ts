import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertProductSchema, insertCustomerSchema, insertOrderSchema, insertOrderItemSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import Database from "@replit/database";
import { v4 as uuidv4 } from "uuid";

// Initialize Replit Database
const db = new Database();

// WebSocket clients store
const wsClients = new Set<WebSocket>();

// Extend session type to include user
declare module 'express-session' {
  interface SessionData {
    user?: { phone: string };
  }
}

// Broadcast function for real-time notifications
function broadcastToClients(message: any) {
  const messageStr = JSON.stringify(message);
  wsClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// Authentication middleware
function requireAuth(req: any, res: any, next: any) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
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
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      wsClients.delete(ws);
    });
  });
  
  // User registration route
  app.post("/api/register", async (req, res) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Hash the password
      const hash = await bcrypt.hash(password, 10);

      // Create new user
      const userData = {
        username: email,
        phone: null,
        password: hash,
        name,
        role: "user"
      };

      await storage.createUser(userData);

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Check authentication status
  app.get("/api/me", (req, res) => {
    if (req.session.user) {
      res.json({ authenticated: true, user: req.session.user });
    } else {
      res.status(401).json({ authenticated: false });
    }
  });

  // User login route
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Retrieve user from database
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password using bcryptjs
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set user session
      req.session.user = { phone: user.phone || email };

      res.status(200).json({ message: "Login successful", user: { email: user.username, name: user.name } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/metrics", requireAuth, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Product routes
  app.get("/api/products", requireAuth, async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/products", requireAuth, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error: any) {
      console.error("Product creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      // Handle unique constraint violations
      if (error?.code === '23505' && error?.constraint === 'products_sku_unique') {
        return res.status(400).json({ message: "A product with this SKU already exists. Please use a unique SKU." });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, productData);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProduct(id);
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Customer routes
  app.get("/api/customers", requireAuth, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.post("/api/customers", requireAuth, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  // Order routes
  app.get("/api/orders", requireAuth, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/recent", requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const orders = await storage.getRecentOrders(limit);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent orders" });
    }
  });

  app.post("/api/orders", requireAuth, async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.post("/api/orders/:orderId/items", requireAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const orderItemData = insertOrderItemSchema.parse({ ...req.body, orderId });
      const orderItem = await storage.createOrderItem(orderItemData);
      res.status(201).json(orderItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order item" });
    }
  });

  // Sales endpoint with payment method handling
  app.post("/api/sales", requireAuth, async (req, res) => {
    try {
      const { items, paymentType, reference } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Items are required" });
      }
      
      if (!paymentType || !['cash', 'credit', 'mpesa'].includes(paymentType)) {
        return res.status(400).json({ message: "Valid payment type is required (cash, credit, or mpesa)" });
      }

      // Calculate total
      const total = items.reduce((sum: number, item: any) => sum + (parseFloat(item.price) * item.quantity), 0);
      
      // Create the order
      const orderData = {
        customerId: null,
        customerName: "Walk-in Customer",
        total: total.toFixed(2),
        paymentMethod: paymentType,
        status: paymentType === 'credit' ? 'credit' : paymentType === 'mpesa' ? 'pending' : 'completed',
        reference: paymentType === 'mpesa' ? reference : null
      };
      
      const order = await storage.createOrder(orderData);
      
      // Create order items and update inventory
      for (const item of items) {
        // Create order item
        await storage.createOrderItem({
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price
        });
        
        // Update product stock
        await storage.updateProductStock(item.productId, -item.quantity);
      }
      
      res.status(201).json({
        success: true,
        order,
        message: paymentType === 'credit' 
          ? "Credit sale saved" 
          : paymentType === 'mpesa'
          ? "M-Pesa payment request sent"
          : "Cash sale recorded"
      });
      
    } catch (error: any) {
      console.error("Sales processing error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sale data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to process sale" });
    }
  });

  // M-Pesa payment initiation route
  app.post("/api/sales/mpesa/initiate", requireAuth, async (req, res) => {
    try {
      const { amount, phone, reference, orderId } = req.body;
      
      if (!amount || !phone || !reference) {
        return res.status(400).json({ message: "Amount, phone, and reference are required" });
      }
      
      // Get user's business profile for M-Pesa credentials
      const userPhone = req.session.user?.phone;
      if (!userPhone) {
        return res.status(401).json({ message: "User session not found" });
      }
      
      // For now, we'll simulate the M-Pesa API call
      // In production, you would call Safaricom's Daraja API here
      console.log("M-Pesa payment initiation:", {
        amount,
        phone,
        reference,
        orderId,
        userPhone
      });
      
      // Simulate API response
      res.json({
        success: true,
        message: "M-Pesa payment request sent to customer",
        transactionId: `MPESA${Date.now()}`,
        reference
      });
      
    } catch (error: any) {
      console.error("M-Pesa initiation error:", error);
      res.status(500).json({ message: "Failed to initiate M-Pesa payment" });
    }
  });

  // Onboarding route
  app.post("/api/onboarding", requireAuth, async (req, res) => {
    try {
      const { businessName, paybill, consumerKey, consumerSecret } = req.body;
      
      if (!businessName || !paybill || !consumerKey || !consumerSecret) {
        return res.status(400).json({ 
          message: "All fields are required: businessName, paybill, consumerKey, consumerSecret" 
        });
      }

      const phone = req.session.user!.phone;
      
      // Store business profile and M-Pesa config
      await storage.saveBusinessProfile(phone, {
        businessName,
        paybill,
        consumerKey,
        consumerSecret,
      });

      res.json({ message: "Business profile saved successfully" });
    } catch (error) {
      console.error("Onboarding error:", error);
      res.status(500).json({ message: "Failed to save business profile" });
    }
  });

  // M-Pesa C2B Callback endpoint
  app.post("/api/sales/mpesa/callback", async (req, res) => {
    try {
      const { 
        ShortCode,
        BillRefNumber, 
        Amount,
        TransID,
        ResultCode,
        ResultDesc 
      } = req.body;

      console.log("M-Pesa callback received:", {
        ShortCode,
        BillRefNumber,
        Amount,
        TransID,
        ResultCode,
        ResultDesc
      });

      // Check if payment was successful
      if (ResultCode === '0' || ResultCode === 0) {
        // Find the order with matching reference and pending status
        const order = await storage.getOrderByReference(BillRefNumber);
        
        if (!order) {
          console.error(`Order not found for reference: ${BillRefNumber}`);
          return res.status(404).json({ 
            ResultCode: "1", 
            ResultDesc: "Order not found" 
          });
        }

        if (order.status !== 'pending') {
          console.log(`Order ${order.id} already processed (status: ${order.status})`);
          return res.json({ 
            ResultCode: "0", 
            ResultDesc: "Already processed" 
          });
        }

        // Update order status to 'paid'
        await storage.updateOrder(order.id, { 
          status: 'paid' 
        });

        // Get order items to update inventory (if not already done)
        const orderItems = await storage.getOrderItems(order.id);
        
        // In M-Pesa flow, inventory was already decremented when order was created
        // So we don't need to decrement again, just confirm payment

        console.log(`M-Pesa payment confirmed for order ${order.id}, reference: ${BillRefNumber}`);

        // Broadcast real-time notification to connected clients
        broadcastToClients({
          type: 'payment_received',
          orderId: order.id,
          reference: BillRefNumber,
          amount: Amount,
          transactionId: TransID,
          message: `M-Pesa payment received for ${BillRefNumber}`
        });

        return res.json({ 
          ResultCode: "0", 
          ResultDesc: "Accepted" 
        });
      } else {
        // Payment failed
        console.error(`M-Pesa payment failed for reference ${BillRefNumber}:`, ResultDesc);
        
        // Find the order and optionally update status to 'failed'
        const order = await storage.getOrderByReference(BillRefNumber);
        if (order && order.status === 'pending') {
          await storage.updateOrder(order.id, { 
            status: 'failed' 
          });
          
          // Optionally restore inventory since payment failed
          const orderItems = await storage.getOrderItems(order.id);
          for (const item of orderItems) {
            await storage.updateProductStock(item.productId, item.quantity);
          }
        }

        // Broadcast failure notification
        broadcastToClients({
          type: 'payment_failed',
          reference: BillRefNumber,
          resultCode: ResultCode,
          resultDesc: ResultDesc,
          message: `M-Pesa payment failed for ${BillRefNumber}`
        });

        return res.json({ 
          ResultCode: "1", 
          ResultDesc: "Rejected" 
        });
      }
      
    } catch (error: any) {
      console.error("M-Pesa callback error:", error);
      return res.status(500).json({ 
        ResultCode: "1", 
        ResultDesc: "Internal server error" 
      });
    }
  });

  return httpServer;
}
