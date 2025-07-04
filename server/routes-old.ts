import type { Express } from 'express';
import { createServer, type Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { supabase, requireSupabaseAuth } from './supabase';
import { insertProductSchema, insertCustomerSchema, insertOrderSchema, insertOrderItemSchema } from '@shared/schema';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Parser as Json2csvParser } from 'json2csv';

// WebSocket clients store
const wsClients = new Set<WebSocket>();

// Extend session type to include user
declare module 'express-session' {
  interface SessionData {
    user?: { id: number; phone: string; email?: string; username?: string };
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

// Helper function to get current user from Supabase
async function getCurrentUser(req: any) {
  if (!req.user) {
    return null;
  }

  // Get user profile from Supabase
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', req.user.email)
    .single();

  if (error || !user) {
    console.error('Error fetching user:', error);
    return null;
  }

  return user;
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
  app.get('/api/supabase-config', (req, res) => {
    res.json({
      url: process.env.SUPABASE_URL,
      anonKey: process.env.SUPABASE_ANON_KEY;
    });
  });

  // User registration route
  app.post('/api/register', async (req, res) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email and password are required' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      // Hash the password
      const hash = await bcrypt.hash(password, 10);

      // Create new user
      const userData = {
        username: email,
        email: email,
        phone: null,
        passwordHash: hash;
      };

      await storage.createUser(userData);

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Check authentication status
  app.get('/api/me', async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ authenticated: false });
      }

      // Get full user data from database
      const user = await getCurrentUser(req);
      if (!user) {
        // Clear invalid session
        req.session.destroy((err) => {
          if (err) console.error('Session destroy error:', err);
        });
        return res.status(401).json({ authenticated: false });
      }

      // Get store profile if exists
      const storeProfile = await storage.getStoreProfile(user.id);

      res.json({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          phone: user.phone,
          storeProfile: storeProfile;
        }
      });
    } catch (error) {
      console.error('Authentication check error:', error);
      res.status(500).json({ authenticated: false });
    }
  });

  // User login route
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Retrieve user from database
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password using bcryptjs
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Set user session with proper data
      req.session.user = {
        id: user.id,
        phone: user.phone || email,
        email: user.email,
        username: user.username;
      };

      res.status(200).json({ message: 'Login successful', user: { email: user.email, username: user.username } });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/metrics', requireAuth, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch dashboard metrics' });
    }
  });

  // Product routes
  app.get('/api/products', requireAuth, async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  });

  app.post('/api/products', requireAuth, async (req, res) => {
    try {
      const requestData = insertProductSchema.parse(req.body);

      // Handle unknown quantity logic
      const productData = {
        ...requestData,
        stock: requestData.unknownQuantity ? null : requestData.stock;
      };

      // Remove unknownQuantity from the data before sending to storage
      const { unknownQuantity, ...cleanProductData } = productData;

      const product = await storage.createProduct(cleanProductData);
      res.status(201).json(product);
    } catch (error: any) {
      console.error('Product creation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid product data', errors: error.errors });
      }
      // Handle unique constraint violations
      if (error?.code === '23505' && error?.constraint === 'products_sku_unique') {
        return res.status(400).json({ message: 'A product with this SKU already exists. Please use a unique SKU.' });
      }
      res.status(500).json({ message: 'Failed to create product' });
    }
  });

  app.put('/api/products/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const requestData = insertProductSchema.partial().parse(req.body);

      // Handle unknown quantity logic
      const productData = {
        ...requestData,
        stock: requestData.unknownQuantity ? null : requestData.stock;
      };

      // Remove unknownQuantity from the data before sending to storage
      const { unknownQuantity, ...cleanProductData } = productData;

      const product = await storage.updateProduct(id, cleanProductData);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid product data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update product' });
    }
  });

  app.delete('/api/products/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProduct(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete product' });
    }
  });

  // Frequent products endpoint
  app.get('/api/products/frequent', requireAuth, async (req, res) => {
    try {
      const frequentProducts = await storage.getFrequentProducts();
      res.json(frequentProducts);
    } catch (error) {
      console.error('Error fetching frequent products:', error);
      res.status(500).json({ message: 'Failed to fetch frequent products' });
    }
  });

  // Product search endpoint
  app.get('/api/products/search', requireAuth, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.trim().length < 1) {
        return res.json([]);
      }

      const searchResults = await storage.searchProducts(query.trim());
      );

      // Limit to 8 results as requested
      const limitedResults = searchResults.slice(0, 8);
      res.json(limitedResults);
    } catch (error) {
      console.error('Error searching products:', error);
      res.status(500).json({ message: 'Failed to search products' });
    }
  });

  // Customer routes
  app.get('/api/customers', requireAuth, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch customers' });
    }
  });

  app.post('/api/customers', requireAuth, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      console.error('Customer creation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid customer data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create customer' });
    }
  });

  app.put('/api/customers/:id', requireAuth, async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.updateCustomer(customerId, customerData);

      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid customer data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update customer' });
    }
  });

  app.delete('/api/customers/:id', requireAuth, async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      await storage.deleteCustomer(customerId);
      res.status(204).send();
    } catch (error) {
      console.error('Customer deletion error:', error);
      res.status(500).json({ message: 'Failed to delete customer' });
    }
  });

  // Customer repayment endpoint
  app.post('/api/customers/:id/payments', requireAuth, async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const { amount, method, note } = req.body;

      if (!amount || !method) {
        return res.status(400).json({ message: 'Amount and payment method are required' });
      }

      // Validate customer exists
      const customer = await storage.getCustomer(customerId);
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      // Validate payment amount
      const paymentAmount = parseFloat(amount);
      const currentBalance = parseFloat(customer.balance || '0');

      if (paymentAmount <= 0) {
        return res.status(400).json({ message: 'Payment amount must be greater than zero' });
      }

      if (paymentAmount > currentBalance) {
        return res.status(400).json({ message: 'Payment amount cannot exceed outstanding debt' });
      }

      // Create payment record
      const paymentData = {
        customerId: customerId,
        amount: paymentAmount.toFixed(2),
        method: method,
        reference: note || null;
      };

      const payment = await storage.createPayment(paymentData);

      // Update customer balance (subtract payment amount)
      await storage.updateCustomerBalance(customerId, -paymentAmount);

      // Get updated customer
      const updatedCustomer = await storage.getCustomer(customerId);

      // Broadcast real-time payment notification
      broadcastToClients({
        type: 'customerPaymentRecorded',
        data: {
          customerId,
          customerName: customer.name,
          amount: paymentAmount.toFixed(2),
          paymentMethod: method,
          note: note || null,
          timestamp: new Date().toISOString()
        }
      });

      res.status(201).json({
        payment,
        customer: updatedCustomer,
        message: `Repayment of KES ${paymentAmount.toFixed(2)} recorded for ${customer.name}`
      });
    } catch (error) {
      console.error('Customer payment error:', error);
      res.status(500).json({ message: 'Failed to record payment' });
    }
  });

  // Payment routes
  app.get('/api/payments', requireAuth, async (req, res) => {
    try {
      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch payments' });
    }
  });

  app.post('/api/payments', requireAuth, async (req, res) => {
    try {
      const { customerId, amount, method, reference } = req.body;

      if (!customerId || !amount || !method) {
        return res.status(400).json({ message: 'Customer ID, amount, and payment method are required' });
      }

      // Validate customer exists
      const customer = await storage.getCustomer(customerId);
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      // Check for negative payment amount
      if (parseFloat(amount) <= 0) {
        return res.status(400).json({ message: 'Payment amount must be greater than zero' });
      }

      const paymentData = {
        customerId: parseInt(customerId),
        amount: parseFloat(amount).toFixed(2),
        method: method,
        reference: reference || null;
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
      console.error('Payment creation error:', error);
      res.status(500).json({ message: 'Failed to record payment' });
    }
  });

  app.get('/api/customers/:id/payments', requireAuth, async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const payments = await storage.getPaymentsByCustomer(customerId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch customer payments' });
    }
  });

  // Order routes
  app.get('/api/orders', requireAuth, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch orders' });
    }
  });

  app.get('/api/orders/recent', requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const orders = await storage.getRecentOrders(limit);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch recent orders' });
    }
  });

  app.post('/api/orders', requireAuth, async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid order data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create order' });
    }
  });

  app.post('/api/orders/:orderId/items', requireAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const orderItemData = insertOrderItemSchema.parse({ ...req.body, orderId });
      const orderItem = await storage.createOrderItem(orderItemData);
      res.status(201).json(orderItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid order item data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create order item' });
    }
  });

  // Sales endpoint with simplified payload
  app.post('/api/sales', requireAuth, async (req, res) => {
    try {
      const { items, paymentType, customer } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Items are required' });
      }

      if (!paymentType || !['cash', 'credit', 'mpesa', 'mobileMoney'].includes(paymentType)) {
        return res.status(400).json({ message: 'Valid payment type is required (cash, credit, mpesa, or mobileMoney)' });
      }

      // For credit sales, require customer information
      if (paymentType === 'credit' && (!customer || !customer.trim())) {
        return res.status(400).json({ message: 'Customer required for credit sales' });
      }

      // For M-Pesa payments, check if M-Pesa is enabled
      if (paymentType === 'mpesa') {
        const user = await getCurrentUser(req);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        const settings = await storage.getUserSettings(user.id);
        if (!settings?.mpesaEnabled) {
          return res.status(403).json({ message: 'M-Pesa payments are disabled. Please enable M-Pesa in settings.' });
        }
      }

      // Get product details and calculate total
      let total = 0;
      const enrichedItems = [];

      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({ message: `Product with ID ${item.productId} not found` });
        }

        // Skip stock validation for products with unknown quantities
        if (product.stock !== null && item.qty > product.stock) {
          return res.status(400).json({ message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.qty}` });
        }

        const lineTotal = parseFloat(product.price) * item.qty;
        total += lineTotal;

        enrichedItems.push({
          productId: product.id,
          productName: product.name,
          quantity: item.qty,
          price: product.price;
        });
      }

      // Determine order status based on payment type
      let status;
      if (paymentType === 'cash' || paymentType === 'mobileMoney') {
        status = 'paid';
      } else if (paymentType === 'mpesa') {
        status = 'pending';
      } else if (paymentType === 'credit') {
        status = 'credit';
      }

      // Handle customer lookup/creation for credit sales
      let customerId = null;
      if (paymentType === 'credit') {
        // Split customer input to extract name and phone if provided
        const customerParts = customer.split(/[,|\-|:|\s]+/).map((part: string) => part.trim()).filter(Boolean);
        const customerName = customerParts[0];
        const customerPhone = customerParts.length > 1 ? customerParts[1] : null;

        // Try to find existing customer by name or phone
        let existingCustomer = await storage.getCustomerByNameOrPhone(customerName, customerPhone);

        if (!existingCustomer) {
          // Create new customer
          existingCustomer = await storage.createCustomer({
            name: customerName,
            phone: customerPhone,
            email: null,
            address: null,
            balance: '0.00'
          });
        }

        // Update customer balance (add sale amount to their credit)
        await storage.updateCustomerBalance(existingCustomer.id, total);
        customerId = existingCustomer.id;
      }

      // Create the order
      const orderData = {
        customerId,
        customerName: paymentType === 'credit' ? customer.split(/[,|\-|:|\s]+/)[0].trim() : 'Walk-in Customer',
        total: total.toFixed(2),
        paymentMethod: paymentType,
        status,
        reference: null;
      };

      const order = await storage.createOrder(orderData);

      // Create order items and update inventory for all payment types
      const updatedProducts = [];
      for (const item of enrichedItems) {
        // Create order item
        await storage.createOrderItem({
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price;
        });

        // Get the product to check if it has unknown quantity
        const productInfo = await storage.getProduct(item.productId);

        // Update product stock ONLY if it's not an unknown quantity item
        if (productInfo && productInfo.stock !== null) {
          await storage.updateProductStock(item.productId, -item.quantity);

          // Get updated product info for inventory event
          const updatedProduct = await storage.getProduct(item.productId);
          if (updatedProduct) {
            updatedProducts.push({
              productId: item.productId,
              newQuantity: updatedProduct.stock;
            });
          }
        } else {
          // For unknown quantity items, don't update stock but still broadcast the event
          updatedProducts.push({
            productId: item.productId,
            newQuantity: null // Keep as unknown quantity;
          });
        }

        // Increment sales count for analytics
        await storage.incrementProductSalesCount(item.productId, item.quantity);
      }

      // Emit real-time data update events
      broadcastToClients({
        type: 'dataUpdate',
        updateType: 'sale',
        sale: {
          id: order.id,
          total: total.toFixed(2),
          paymentType,
          status,
          items: enrichedItems;
        }
      });

      // Emit inventory update events for each affected product
      updatedProducts.forEach(product => {
        broadcastToClients({
          type: 'inventoryUpdate',
          productId: product.productId,
          newQuantity: product.newQuantity;
        });
      });

      // Emit legacy sale notification for existing UI
      broadcastToClients({
        type: 'saleUpdate',
        paymentType,
        saleId: order.id,
        total: total.toFixed(2),
        status;
      });

      res.status(201).json({
        success: true,
        saleId: order.id,
        status;
      });

    } catch (error: any) {
      console.error('Sales processing error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid sale data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to process sale' });
    }
  });

  // Onboarding route
  app.post('/api/onboarding', requireAuth, async (req, res) => {
    try {
      const { businessName, paybill, consumerKey, consumerSecret } = req.body;

      if (!businessName || !paybill || !consumerKey || !consumerSecret) {
        return res.status(400).json({
          message: 'All fields are required: businessName, paybill, consumerKey, consumerSecret'
        });
      }

      const phone = req.session.user!.phone;

      // Get user by phone to get the user ID
      const user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Store business profile
      await storage.saveBusinessProfile(user.id, {
        businessName,
        businessType: 'General Business',
        location: '',
        description: ''
      });

      res.json({ message: 'Business profile saved successfully' });
    } catch (error) {
      console.error('Onboarding error:', error);
      res.status(500).json({ message: 'Failed to save business profile' });
    }
  });

  // M-Pesa C2B Callback endpoint
  app.post('/api/sales/mpesa/callback', async (req, res) => {
    try {
      const {
        ShortCode,
        BillRefNumber,
        Amount,
        TransID,
        ResultCode,
        ResultDesc
      } = req.body;

      // Check if payment was successful
      if (ResultCode === '0' || ResultCode === 0) {
        // Find the order with matching reference and pending status
        const order = await storage.getOrderByReference(BillRefNumber);

        if (!order) {
          console.error(`Order not found for reference: ${BillRefNumber}`);
          return res.status(404).json({
            ResultCode: '1',
            ResultDesc: 'Order not found'
          });
        }

        if (order.status !== 'pending') {
          `);
          return res.json({
            ResultCode: '0',
            ResultDesc: 'Already processed'
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
          ResultCode: '0',
          ResultDesc: 'Accepted'
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
          ResultCode: '1',
          ResultDesc: 'Rejected'
        });
      }

    } catch (error: any) {
      console.error('M-Pesa callback error:', error);
      return res.status(500).json({
        ResultCode: '1',
        ResultDesc: 'Internal server error'
      });
    }
  });

  // Reports API endpoints

  app.get('/api/reports/hourly', requireAuth, async (req: any, res: any) => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      const allOrders = await storage.getOrders();
      const todayOrders = allOrders.filter(order =>
        new Date(order.createdAt) >= startOfDay
      );

      // Initialize 24 hours with zero sales
      const hourlyData = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        sales: 0;
      }));

      // Aggregate sales by hour
      todayOrders.forEach(order => {
        const hour = new Date(order.createdAt).getHours();
        hourlyData[hour].sales += parseFloat(order.total);
      });

      res.json(hourlyData);
    } catch (error) {
      console.error('Hourly reports error:', error);
      res.status(500).json({ message: 'Failed to fetch hourly data' });
    }
  });

  app.get('/api/reports/top-items', requireAuth, async (req: any, res: any) => {
    try {
      const period = req.query.period || 'today';
      const today = new Date();
      let startDate: Date

      switch (period) {
        case 'week':
          startDate = new Date(today);
          startDate.setDate(today.getDate() - today.getDay());
          break;
        case 'month':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          break;
        default: // today
          startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      }

      const allOrders = await storage.getOrders();
      const periodOrders = allOrders.filter(order =>
        new Date(order.createdAt) >= startDate
      );

      // Get all order items for the period
      const itemSales: { [key: number]: { name: string; unitsSold: number revenue: number } } = {};

      for (const order of periodOrders) {
        const orderItems = await storage.getOrderItems(order.id);
        for (const item of orderItems) {
          if (!itemSales[item.productId]) {
            const product = await storage.getProduct(item.productId);
            itemSales[item.productId] = {
              name: product?.name || 'Unknown Product',
              unitsSold: 0,
              revenue: 0;
            };
          }
          itemSales[item.productId].unitsSold += item.quantity;
          itemSales[item.productId].revenue += parseFloat(item.price) * item.quantity;
        }
      }

      // Convert to array and sort by units sold
      const topItems = Object.values(itemSales)
        .sort((a, b) => b.unitsSold - a.unitsSold)
        .slice(0, 10)
        .map(item => ({
          name: item.name,
          unitsSold: item.unitsSold,
          revenue: item.revenue.toFixed(2)
        }));

      res.json(topItems);
    } catch (error) {
      console.error('Top items reports error:', error);
      res.status(500).json({ message: 'Failed to fetch top items' });
    }
  });

  // Orders Record endpoint for Reports page
  app.get('/api/reports/orders', requireAuth, async (req: any, res: any) => {
    try {
      const { period = 'daily', q = '', page = '1', limit = '20' } = req.query;
      const today = new Date();
      let startDate: Date

      // Calculate date range based on period
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

      // Get all orders
      const allOrders = await storage.getOrders();

      // Filter by date range
      let filteredOrders = allOrders.filter(order =>
        new Date(order.createdAt) >= startDate
      );

      // Filter by search query if provided
      if (q) {
        const searchLower = q.toLowerCase();
        filteredOrders = filteredOrders.filter(order => {
          // Search by order ID, customer name, or reference
          return order.id.toString().includes(searchLower) ||
                 order.customerName.toLowerCase().includes(searchLower) ||
                 (order.reference && order.reference.toLowerCase().includes(searchLower));
        });
      }

      // Sort by creation date (newest first)
      filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Pagination
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

      // Format response with order items
      const formattedOrders = await Promise.all(paginatedOrders.map(async (order) => {
        // Get order items for this order
        const orderItems = await storage.getOrderItems(order.id);

        // Format items as {productName, qty, price}
        const items = orderItems.map(item => ({
          productName: item.productName,
          qty: item.quantity,
          price: parseFloat(item.price).toFixed(2)
        }));

        // Convert items to products format for frontend
        const products = items.map(item => ({
          name: item.productName,
          quantity: item.qty;
        }));

        return {
          orderId: order.id,
          date: order.createdAt.toISOString().split('T')[0], // YYYY-MM-DD format
          customerName: order.customerName,
          total: order.total, // Keep original string format
          paymentMethod: order.paymentMethod,
          status: order.status,
          reference: order.reference,
          products: products;
        };
      }));

      res.json({
        orders: formattedOrders,
        total: filteredOrders.length,
        page: pageNum,
        totalPages: Math.ceil(filteredOrders.length / limitNum)
      });
    } catch (error) {
      console.error('Orders reports error:', error);
      res.status(500).json({ message: 'Failed to fetch orders' });
    }
  });

  app.get('/api/reports/credits', requireAuth, async (req: any, res: any) => {
    try {
      const customers = await storage.getCustomers();

      // Filter customers with credit balance and sort by balance descending
      const customerCredits = customers
        .filter(customer => parseFloat(customer.balance) > 0)
        .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance))
        .map(customer => ({
          name: customer.name,
          phone: customer.phone || 'N/A',
          balance: customer.balance;
        }));

      res.json(customerCredits);
    } catch (error) {
      console.error('Customer credits reports error:', error);
      res.status(500).json({ message: 'Failed to fetch customer credits' });
    }
  });

  // New unified summary endpoint with period support
  app.get('/api/reports/summary', requireAuth, async (req: any, res: any) => {
    try {
      const period = req.query.period || 'today';
      const orders = await storage.getOrders();

      let startDate: Date
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

      const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= startDate && orderDate <= endDate;
      });

      let totalSales = 0;
      let cashSales = 0;
      let mobileMoneySales = 0;
      let creditSales = 0;

      filteredOrders.forEach(order => {
        const amount = parseFloat(order.total);
        totalSales += amount;

        // Handle paid orders (cash and mobile money)
        if (order.status === 'paid' || order.status === 'completed') {
          if (order.paymentMethod === 'cash') {
            cashSales += amount;
          } else if (order.paymentMethod === 'mobileMoney') {
            mobileMoneySales += amount;
          }
        }
        // Handle credit orders
        else if (order.status === 'credit') {
          creditSales += amount;
        }
        // Handle pending M-Pesa orders (not yet completed)
        else if (order.status === 'pending') {
          // These are typically M-Pesa orders awaiting confirmation, don't count in breakdown yet;
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
      res.status(500).json({ message: 'Failed to fetch summary' });
    }
  });

  // New trend endpoint with period support
  app.get('/api/reports/trend', requireAuth, async (req: any, res: any) => {
    try {
      const period = req.query.period || 'daily';
      const orders = await storage.getOrders();

      let data: { label: string; value: number }[] = [];

      if (period === 'daily') {
        // 24 hourly points for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= today && orderDate < tomorrow;
        });

        for (let hour = 0; hour < 24; hour++) {
          const hourStart = new Date(today);
          hourStart.setHours(hour);
          const hourEnd = new Date(today);
          hourEnd.setHours(hour + 1);

          const hourOrders = todayOrders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= hourStart && orderDate < hourEnd;
          });

          const hourSales = hourOrders.reduce((sum, order) =>
            sum + (order.status === 'paid' || order.status === 'completed' || order.status === 'credit' ? parseFloat(order.total) : 0), 0
          );

          data.push({
            label: hour.toString().padStart(2, '0') + ':00',
            value: hourSales;
          });
        }
      } else if (period === 'weekly') {
        // 7 daily points for the last week
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (let i = 6; i >= 0; i--) {
          const day = new Date();
          day.setDate(day.getDate() - i);
          day.setHours(0, 0, 0, 0);
          const nextDay = new Date(day);
          nextDay.setDate(nextDay.getDate() + 1);

          const dayOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= day && orderDate < nextDay;
          });

          const daySales = dayOrders.reduce((sum, order) =>
            sum + (order.status === 'paid' || order.status === 'completed' || order.status === 'credit' ? parseFloat(order.total) : 0), 0
          );

          data.push({
            label: dayNames[day.getDay()],
            value: daySales;
          });
        }
      } else if (period === 'monthly') {
        // 30 daily points for the last month
        for (let i = 29; i >= 0; i--) {
          const day = new Date();
          day.setDate(day.getDate() - i);
          day.setHours(0, 0, 0, 0);
          const nextDay = new Date(day);
          nextDay.setDate(nextDay.getDate() + 1);

          const dayOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= day && orderDate < nextDay;
          });

          const daySales = dayOrders.reduce((sum, order) =>
            sum + (order.status === 'paid' || order.status === 'completed' || order.status === 'credit' ? parseFloat(order.total) : 0), 0
          );

          data.push({
            label: day.getDate().toString(),
            value: daySales;
          });
        }
      }

      res.json(data);
    } catch (error) {
      console.error('Trend reports error:', error);
      res.status(500).json({ message: 'Failed to fetch trend data' });
    }
  });

  // Top customers by credit endpoint
  app.get('/api/reports/top-customers', requireAuth, async (req: any, res: any) => {
    try {
      const customers = await storage.getCustomers();

      // Calculate customer credit data based on current balance
      const customerCredits = customers
        .filter(customer => parseFloat(customer.balance || '0') > 0)
        .map(customer => ({
          customerName: customer.name,
          totalOwed: parseFloat(customer.balance).toFixed(2),
          outstandingOrders: 1 // We don't track individual credit orders, just the balance;
        }))
        .sort((a, b) => parseFloat(b.totalOwed) - parseFloat(a.totalOwed))
        .slice(0, 5);

      res.json(customerCredits);
    } catch (error) {
      console.error('Top customers fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch top customers' });
    }
  });

  // Top products by sales endpoint
  app.get('/api/reports/top-products', requireAuth, async (req: any, res: any) => {
    try {
      const period = req.query.period || 'daily';
      const products = await storage.getProducts();
      const orders = await storage.getOrders();
      const orderItems = await storage.getAllOrderItems();

      // Filter orders by period
      let startDate: Date
      const now = new Date();

      switch (period) {
        case 'daily':
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'weekly':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'monthly':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
        default: startDate = new Date(now)
          startDate.setHours(0, 0, 0, 0);
      }

      const relevantOrders = orders.filter(order =>
        (order.status === 'paid' || order.status === 'completed' || order.status === 'credit') &&
        new Date(order.createdAt) >= startDate
      );

      // Calculate product sales data
      const productSales = products.reduce((acc, product) => {
        const productOrderItems = orderItems.filter(item =>
          item.productId === product.id &&
          relevantOrders.some(order => order.id === item.orderId)
        );

        const unitsSold = productOrderItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalRevenue = productOrderItems.reduce((sum, item) => sum + (item.quantity * parseFloat(item.price)), 0);

        if (unitsSold > 0) {
          acc.push({
            productName: product.name,
            unitsSold,
            totalRevenue: totalRevenue.toFixed(2)
          });
        }

        return acc;
      }, [] as Array<{ productName: string unitsSold: number totalRevenue: string }>)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);

      res.json(productSales);
    } catch (error) {
      console.error('Top products fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch top products' });
    }
  });

  // CSV export hosting endpoints
  const csvStorage = new Map<string, { content: string; timestamp: number }>();

  // Store CSV file temporarily (auto-cleanup after 1 hour)
  app.post('/api/exports', requireAuth, (req: any, res: any) => {
    try {
      const { filename, content } = req.body;
      if (!filename || !content) {
        return res.status(400).json({ error: 'Filename and content required' });
      }

      const id = uuidv4();
      csvStorage.set(id, { content, timestamp: Date.now() });

      // Auto cleanup after 1 hour
      setTimeout(() => {
        csvStorage.delete(id);
      }, 60 * 60 * 1000);

      res.json({ id, url: `/exports/${id}/${filename}` });
    } catch (error) {
      console.error('CSV export error:', error);
      res.status(500).json({ error: 'Failed to store CSV' });
    }
  });

  // Serve CSV files
  app.get('/exports/:id/:filename', (req, res) => {
    const { id, filename } = req.params;
    const csvData = csvStorage.get(id);

    if (!csvData) {
      return res.status(404).json({ error: 'CSV file not found or expired' });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename='${filename}'`);
    res.send(csvData.content);
  });

  // Detailed CSV export endpoint with full order and line item data
  app.get('/api/reports/export-orders', requireAuth, async (req: any, res: any) => {
    try {
      const period = req.query.period || 'today';
      const orders = await storage.getOrders();

      // Filter orders by period
      let startDate: Date
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

      const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= startDate && orderDate <= endDate;
      });

      // Get all order items for filtered orders
      const flattenedRows: any[] = []

      for (const order of filteredOrders) {
        const orderItems = await storage.getOrderItems(order.id);

        if (orderItems.length === 0) {
          // If no items found, add one row with order info
          flattenedRows.push({
            orderId: order.id,
            date: order.createdAt.toISOString().slice(0, 19).replace('T', ' '),
            customerName: order.customerName,
            customerPhone: '', // Not available in current schema
            paymentMethod: order.paymentMethod,
            status: order.status,
            reference: order.reference || '',
            productName: 'N/A',
            quantity: 0,
            unitPrice: 0,
            lineTotal: 0,
            orderTotal: parseFloat(order.total)
          });
        } else {
          // Add one row per line item
          orderItems.forEach(item => {
            flattenedRows.push({
              orderId: order.id,
              date: order.createdAt.toISOString().slice(0, 19).replace('T', ' '),
              customerName: order.customerName,
              customerPhone: '', // Not available in current schema
              paymentMethod: order.paymentMethod,
              status: order.status,
              reference: order.reference || '',
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: parseFloat(item.price),
              lineTotal: item.quantity * parseFloat(item.price),
              orderTotal: parseFloat(order.total)
            });
          });
        }
      }

      // Define CSV fields with proper formatting
      const fields = [
        { label: 'Order ID', value: 'orderId' },
        { label: 'Date', value: 'date' },
        { label: 'Customer Name', value: 'customerName' },
        { label: 'Customer Phone', value: 'customerPhone' },
        { label: 'Payment Method', value: 'paymentMethod' },
        { label: 'Status', value: 'status' },
        { label: 'Reference', value: 'reference' },
        { label: 'Product Name', value: 'productName' },
        { label: 'Quantity', value: 'quantity' },
        { label: 'Unit Price (KES)', value: (row: any) => row.unitPrice.toFixed(2) },
        { label: 'Line Total (KES)', value: (row: any) => row.lineTotal.toFixed(2) },
        { label: 'Order Total (KES)', value: (row: any) => row.orderTotal.toFixed(2) }
      ];

      // Generate CSV
      const parser = new Json2csvParser({ fields });
      const csv = parser.parse(flattenedRows);

      // Set response headers for file download
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `orders_detailed_${period}_${timestamp}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename='${filename}'`);
      res.send(csv);

    } catch (error) {
      console.error('Detailed CSV export error:', error);
      res.status(500).json({ error: 'Failed to generate detailed CSV export' });
    }
  });

  // Business profile endpoints
  app.get('/api/business-profile', requireAuth, async (req: any, res: any) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const profile = await storage.getBusinessProfile(user.id);
      if (!profile) {
        return res.status(404).json({ error: 'Business profile not found' });
      }

      res.json(profile);
    } catch (error) {
      console.error('Business profile fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch business profile' });
    }
  });

  app.post('/api/business-profile', requireAuth, async (req: any, res: any) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await storage.saveBusinessProfile(user.id, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Business profile save error:', error);
      res.status(500).json({ error: 'Failed to save business profile' });
    }
  });

  // Store profile endpoints
  app.get('/api/store', requireAuth, async (req: any, res: any) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const profile = await storage.getStoreProfile(user.id);

      // Transform database fields to frontend field names
      const transformedProfile = profile ? {
        storeName: profile.storeName,
        ownerName: profile.ownerName || '',
        address: profile.location || '',
        storeType: profile.storeType,
        location: profile.location,
        description: profile.description;
      } : {};

      res.json(transformedProfile);
    } catch (error) {
      console.error('Store profile fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch store profile' });
    }
  });

  app.put('/api/store', requireAuth, async (req: any, res: any) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const existingProfile = await storage.getStoreProfile(user.id);
      let profile;

      // Map frontend fields to database fields
      const profileData = {
        storeName: req.body.storeName,
        ownerName: req.body.ownerName,
        storeType: req.body.storeType || 'retail', // Default to 'retail' if not provided
        location: req.body.address, // Map address to location field
        description: req.body.description || ''
      };

      if (existingProfile) {
        profile = await storage.updateStoreProfile(user.id, profileData);
      } else {
        profile = await storage.saveStoreProfile(user.id, profileData);
      }

      res.json(profile);
    } catch (error) {
      console.error('Store profile save error:', error);
      res.status(500).json({ error: 'Failed to save store profile' });
    }
  });

  app.put('/api/store/mpesa', requireAuth, async (req: any, res: any) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { paybillTillNumber, consumerKey, consumerSecret } = req.body;

      const existingProfile = await storage.getStoreProfile(user.id);
      let profile;

      if (existingProfile) {
        profile = await storage.updateStoreProfile(user.id, {
          paybillTillNumber,
          consumerKey,
          consumerSecret;
        });
      } else {
        profile = await storage.saveStoreProfile(user.id, {
          storeName: 'My Store',
          storeType: 'General',
          paybillTillNumber,
          consumerKey,
          consumerSecret;
        });
      }

      res.json(profile);
    } catch (error) {
      console.error('M-Pesa settings save error:', error);
      res.status(500).json({ error: 'Failed to save M-Pesa settings' });
    }
  });

  // User settings endpoints
  app.get('/api/settings', requireAuth, async (req: any, res: any) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const settings = await storage.getUserSettings(user.id);
      res.json(settings || { language: 'en' });
    } catch (error) {
      console.error('User settings fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch user settings' });
    }
  });

  // Language endpoint removed

  // M-Pesa enabled setting routes
  app.get('/api/settings/mpesa-enabled', requireAuth, async (req: any, res: any) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const settings = await storage.getUserSettings(user.id);
      res.json({ enabled: settings?.mpesaEnabled || false });
    } catch (error) {
      console.error('M-Pesa enabled setting fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch M-Pesa setting' });
    }
  });

  app.put('/api/settings/mpesa-enabled', requireAuth, async (req: any, res: any) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { enabled } = req.body;

      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ error: 'Enabled must be a boolean value' });
      }

      const existingSettings = await storage.getUserSettings(user.id);
      let settings;

      if (existingSettings) {
        settings = await storage.updateUserSettings(user.id, { mpesaEnabled: enabled });
      } else {
        settings = await storage.saveUserSettings(user.id, { mpesaEnabled: enabled });
      }

      res.json({ enabled: settings?.mpesaEnabled || false });
    } catch (error) {
      console.error('M-Pesa enabled setting save error:', error);
      res.status(500).json({ error: 'Failed to save M-Pesa setting' });
    }
  });

  // Theme setting routes
  app.get('/api/settings/theme', requireAuth, async (req: any, res: any) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const settings = await storage.getUserSettings(user.id);
      res.json({ theme: settings?.theme || 'dark' });
    } catch (error) {
      console.error('Theme setting fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch theme setting' });
    }
  });

  app.put('/api/settings/theme', requireAuth, async (req: any, res: any) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { theme } = req.body;

      if (!['light', 'dark'].includes(theme)) {
        return res.status(400).json({ error: 'Theme must be either 'light' or 'dark'' });
      }

      const existingSettings = await storage.getUserSettings(user.id);
      let settings;

      if (existingSettings) {
        settings = await storage.updateUserSettings(user.id, { theme });
      } else {
        settings = await storage.saveUserSettings(user.id, { theme });
      }

      res.json({ theme: settings?.theme || 'dark' });
    } catch (error) {
      console.error('Theme setting save error:', error);
      res.status(500).json({ error: 'Failed to save theme setting' });
    }
  });

  // Manual sync endpoint
  app.get('/api/sync', requireAuth, async (req: any, res: any) => {
    try {
      // For now, this is a placeholder that simulates a sync process
      // In a real implementation, this would sync with external services or databases

      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      res.json({ success: true, message: 'Data synchronized successfully' });
    } catch (error) {
      console.error('Manual sync error:', error);
      res.status(500).json({ error: 'Failed to sync data' });
    }
  });

  // Backup endpoint removed

  // Google Drive backup endpoint removed

  // Enhanced dashboard metrics endpoint
  app.get('/api/metrics/dashboard', requireAuth, async (req: any, res: any) => {
    try {
      const detailedMetrics = await storage.getDetailedDashboardMetrics();
      res.json(detailedMetrics);
    } catch (error) {
      console.error('Detailed dashboard metrics error:', error);
      res.status(500).json({ error: 'Failed to fetch detailed dashboard metrics' });
    }
  });

  // Universal search endpoint
  app.get('/api/search', requireAuth, async (req: any, res: any) => {
    try {
      const { q } = req.query;

      if (!q || q.length < 3) {
        return res.json([]);
      }

      const query = q.toLowerCase();
      const results: any[] = []

      // Search products
      const products = await storage.searchProducts(query);
      for (const product of products) {
        results.push({
          id: `product-${product.id}`,
          type: 'product',
          title: product.name,
          subtitle: `SKU: ${product.sku} | Stock: ${product.stock} | KES ${product.price}`,
          href: `/inventory?search=${encodeURIComponent(product.name)}`
        });
      }

      // Search customers
      const customers = await storage.getCustomers();
      const matchingCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(query) ||
        (customer.phone && customer.phone.includes(query)) ||
        (customer.email && customer.email.toLowerCase().includes(query))
      );

      for (const customer of matchingCustomers) {
        results.push({
          id: `customer-${customer.id}`,
          type: 'customer',
          title: customer.name,
          subtitle: `${customer.phone || 'No phone'} | Balance: KES ${customer.balance}`,
          href: `/customers?search=${encodeURIComponent(customer.name)}`
        });
      }

      // Search orders by reference or customer name
      const orders = await storage.getOrders();
      const matchingOrders = orders.filter(order =>
        (order.reference && order.reference.toLowerCase().includes(query)) ||
        order.customerName.toLowerCase().includes(query)
      );

      for (const order of matchingOrders) {
        results.push({
          id: `order-${order.id}`,
          type: 'order',
          title: `Order #${order.reference || order.id}`,
          subtitle: `${order.customerName} | KES ${order.total} | ${order.status}`,
          href: `/reports?order=${order.id}`
        });
      }

      // Sort by relevance and limit to 5 results
      const sortedResults = results
        .sort((a, b) => {
          // Prioritize exact matches in title
          const aExact = a.title.toLowerCase() === query;
          const bExact = b.title.toLowerCase() === query;
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;

          // Then prioritize title matches over subtitle matches
          const aTitleMatch = a.title.toLowerCase().includes(query);
          const bTitleMatch = b.title.toLowerCase().includes(query);
          if (aTitleMatch && !bTitleMatch) return -1;
          if (!aTitleMatch && bTitleMatch) return 1;

          return 0;
        })
        .slice(0, 5);

      res.json(sortedResults);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  });

  // Notifications endpoints
  app.get('/api/notifications', requireAuth, async (req: any, res: any) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const limit = parseInt(req.query.limit) || 5;
      const notifications = await storage.getNotifications(user.id, limit);
      res.json(notifications);
    } catch (error) {
      console.error('Notifications fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  app.get('/api/notifications/unread-count', requireAuth, async (req: any, res: any) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const count = await storage.getUnreadNotificationCount(user.id);
      res.json({ count });
    } catch (error) {
      console.error('Unread notifications count error:', error);
      res.status(500).json({ error: 'Failed to fetch unread notifications count' });
    }
  });

  app.post('/api/notifications/:id/read', requireAuth, async (req: any, res: any) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid notification ID' });
      }

      const success = await storage.markNotificationAsRead(id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Notification not found' });
      }
    } catch (error) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  });

  app.post('/api/notifications/mark-all-read', requireAuth, async (req: any, res: any) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const success = await storage.markAllNotificationsAsRead(user.id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
      }
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
  });

  app.delete('/api/notifications/:id', requireAuth, async (req: any, res: any) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid notification ID' });
      }

      const success = await storage.deleteNotification(id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: 'Notification not found' });
      }
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  });

  // Logout endpoint
  app.post('/api/logout', (req: any, res: any) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Failed to logout' });
      }
      // Clear the session cookie
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });

  return httpServer;
}
