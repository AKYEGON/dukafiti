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

  // Payment routes
  app.get("/api/payments", requireAuth, async (req, res) => {
    try {
      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.post("/api/payments", requireAuth, async (req, res) => {
    try {
      const { customerId, amount, method, reference } = req.body;
      
      if (!customerId || !amount || !method) {
        return res.status(400).json({ message: "Customer ID, amount, and payment method are required" });
      }

      // Validate customer exists
      const customer = await storage.getCustomer(customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Check for negative payment amount
      if (parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Payment amount must be greater than zero" });
      }

      const paymentData = {
        customerId: parseInt(customerId),
        amount: parseFloat(amount).toFixed(2),
        paymentMethod: method,
        reference: reference || null
      };

      const payment = await storage.createPayment(paymentData);
      
      // Get updated customer to return current balance
      const updatedCustomer = await storage.getCustomer(customerId);
      
      // Broadcast real-time payment notification
      broadcastToClients({
        type: 'paymentRecorded',
        data: {
          customerId,
          customerName: customer.name,
          amount: parseFloat(amount).toFixed(2),
          paymentMethod: method,
          timestamp: new Date().toISOString()
        }
      });
      
      res.status(201).json({ 
        payment, 
        customer: updatedCustomer,
        message: `Payment recorded for ${customer.name}` 
      });
    } catch (error) {
      console.error("Payment creation error:", error);
      res.status(500).json({ message: "Failed to record payment" });
    }
  });

  app.get("/api/customers/:id/payments", requireAuth, async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const payments = await storage.getPaymentsByCustomer(customerId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer payments" });
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

  // Sales endpoint with simplified payload
  app.post("/api/sales", requireAuth, async (req, res) => {
    try {
      const { items, paymentType, customer } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Items are required" });
      }
      
      if (!paymentType || !['cash', 'credit', 'mpesa'].includes(paymentType)) {
        return res.status(400).json({ message: "Valid payment type is required (cash, credit, or mpesa)" });
      }

      // For credit sales, require customer information
      if (paymentType === 'credit' && (!customer || !customer.trim())) {
        return res.status(400).json({ message: "Customer required for credit sales" });
      }

      // Get product details and calculate total
      let total = 0;
      const enrichedItems = [];
      
      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({ message: `Product with ID ${item.productId} not found` });
        }
        
        if (item.qty > product.stock) {
          return res.status(400).json({ message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.qty}` });
        }
        
        const lineTotal = parseFloat(product.price) * item.qty;
        total += lineTotal;
        
        enrichedItems.push({
          productId: product.id,
          productName: product.name,
          quantity: item.qty,
          price: product.price
        });
      }
      
      // Determine order status based on payment type
      let status;
      if (paymentType === 'cash') {
        status = 'paid';
      } else if (paymentType === 'mpesa') {
        status = 'pending';
      } else if (paymentType === 'credit') {
        status = 'credit';
      }
      
      // Create the order
      const orderData = {
        customerId: null,
        customerName: paymentType === 'credit' ? customer : "Walk-in Customer",
        total: total.toFixed(2),
        paymentMethod: paymentType,
        status,
        reference: null
      };
      
      const order = await storage.createOrder(orderData);
      
      // Create order items and update inventory for all payment types
      for (const item of enrichedItems) {
        // Create order item
        await storage.createOrderItem({
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price
        });
        
        // Update product stock (decrement for all payment types)
        await storage.updateProductStock(item.productId, -item.quantity);
      }
      
      // Emit real-time notification
      const notificationData = {
        type: 'saleUpdate',
        paymentType,
        saleId: order.id,
        total: total.toFixed(2),
        status
      };
      
      broadcastToClients(notificationData);
      
      res.status(201).json({
        success: true,
        saleId: order.id,
        status
      });
      
    } catch (error: any) {
      console.error("Sales processing error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sale data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to process sale" });
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
      
      // Get user by phone to get the user ID
      const user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Store business profile and M-Pesa config
      await storage.saveBusinessProfile(user.id, {
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
