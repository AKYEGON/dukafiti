import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertCustomerSchema, insertOrderSchema, insertOrderItemSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import Database from "@replit/database";
import { v4 as uuidv4 } from "uuid";

// Initialize Replit Database
const db = new Database();

// Extend session type to include user
declare module 'express-session' {
  interface SessionData {
    user?: { phone: string };
  }
}

// Authentication middleware
function requireAuth(req: any, res: any, next: any) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  
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
      const { items, paymentType } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Items are required" });
      }
      
      if (!paymentType || !['cash', 'credit'].includes(paymentType)) {
        return res.status(400).json({ message: "Valid payment type is required (cash or credit)" });
      }

      // Calculate total
      const total = items.reduce((sum: number, item: any) => sum + (parseFloat(item.price) * item.quantity), 0);
      
      // Create the order
      const orderData = {
        customerId: null,
        customerName: "Walk-in Customer",
        total: total.toFixed(2),
        paymentMethod: paymentType,
        status: paymentType === 'credit' ? 'credit' : 'completed'
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

  const httpServer = createServer(app);
  return httpServer;
}
