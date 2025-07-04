import express, { type Request, Response, NextFunction } from 'express';
import session from 'express-session';
import path from 'path';
import { supabaseDb } from './supabase-db.js';
import { setupVite, serveStatic, log } from './vite.js';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Parser as Json2csvParser } from 'json2csv';

// Extend session type to include user
declare module 'express-session' {
  interface SessionData {
    user?: { id: number; phone: string; email?: string; username?: string };
  }
}

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

// Authentication middleware
function requireAuth(req: any, res: any, next: any) {
  // For API endpoints, set a default user for now
  req.user = { email: 'admin@dukafiti.com', id: 1 };
  next();
}

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

// Configure express-session with persistent login
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Secure only in production
    sameSite: 'lax'
  }
}));

// Serve PWA static files in development
if (app.get('env') === 'development') {
  app.use(express.static(path.resolve(import.meta.dirname, '..', 'client', 'public')));
}

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (path.startsWith('/api')) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + '…';
      }

      log(logLine);
    }
  });

  next();
});

// Create HTTP server
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

// API Routes
// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await supabaseDb.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    req.session.user = user;
    res.json({ message: 'Login successful', user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, phone, username } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await supabaseDb.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await supabaseDb.createUser({
      email,
      password: hashedPassword,
      phone,
      username;
    });

    req.session.user = user;
    res.json({ message: 'Registration successful', user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/api/auth/user', (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Products routes
app.get('/api/products', requireAuth, async (req, res) => {
  try {
    const products = await supabaseDb.getProducts();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/products/search', requireAuth, async (req, res) => {
  try {
    const { q } = req.query;
    const products = await supabaseDb.searchProducts(q as string);
    res.json(products);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
});

app.post('/api/products', requireAuth, async (req, res) => {
  try {
    const product = await supabaseDb.createProduct(req.body);
    res.json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/products/:id', requireAuth, async (req, res) => {
  try {
    const product = await supabaseDb.updateProduct(parseInt(req.params.id), req.body);
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', requireAuth, async (req, res) => {
  try {
    await supabaseDb.deleteProduct(parseInt(req.params.id));
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Customers routes
app.get('/api/customers', requireAuth, async (req, res) => {
  try {
    const customers = await supabaseDb.getCustomers();
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

app.post('/api/customers', requireAuth, async (req, res) => {
  try {
    const customer = await supabaseDb.createCustomer(req.body);
    res.json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

app.put('/api/customers/:id', requireAuth, async (req, res) => {
  try {
    const customer = await supabaseDb.updateCustomer(parseInt(req.params.id), req.body);
    res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Orders routes
app.get('/api/orders', requireAuth, async (req, res) => {
  try {
    const orders = await supabaseDb.getOrders();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.get('/api/orders/recent', requireAuth, async (req, res) => {
  try {
    const orders = await supabaseDb.getOrders(10);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    res.status(500).json({ error: 'Failed to fetch recent orders' });
  }
});

app.post('/api/orders', requireAuth, async (req, res) => {
  try {
    const { items, paymentMethod, customerId, customerName, total } = req.body;

    const order = await supabaseDb.createOrder({
      customerId,
      customerName,
      total,
      paymentMethod,
      status: 'completed'
    });

    // Create order items
    for (const item of items) {
      await supabaseDb.createOrderItem({
        orderId: order.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price;
      });
    }

    // Update product stock and sales count
    for (const item of items) {
      const product = await supabaseDb.getProductById(item.productId);
      if (product && product.stock !== null) {
        await supabaseDb.updateProduct(item.productId, {
          stock: product.stock - item.quantity,
          salesCount: (product.sales_count || 0) + item.quantity;
        });
      }
    }

    // Broadcast sale notification
    broadcastToClients({
      type: 'sale',
      message: `New sale of KES ${total} completed`,
      order: order;
    });

    res.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Dashboard routes
app.get('/api/dashboard/metrics', requireAuth, async (req, res) => {
  try {
    const metrics = await supabaseDb.getDashboardMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

// Reports routes
app.get('/api/reports/summary', requireAuth, async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    const summary = await supabaseDb.getReportsSummary(period as string);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching reports summary:', error);
    res.status(500).json({ error: 'Failed to fetch reports summary' });
  }
});

app.get('/api/reports/trend', requireAuth, async (req, res) => {
  try {
    const { period = 'day', view = 'sales' } = req.query;
    const trend = await supabaseDb.getReportsTrend(period as string, view as string);
    res.json(trend);
  } catch (error) {
    console.error('Error fetching reports trend:', error);
    res.status(500).json({ error: 'Failed to fetch reports trend' });
  }
});

app.get('/api/reports/top-products', requireAuth, async (req, res) => {
  try {
    const topProducts = await supabaseDb.getTopProducts();
    res.json(topProducts);
  } catch (error) {
    console.error('Error fetching top products:', error);
    res.status(500).json({ error: 'Failed to fetch top products' });
  }
});

app.get('/api/reports/export', requireAuth, async (req, res) => {
  try {
    const orders = await supabaseDb.getOrders();
    const fields = ['id', 'customerName', 'total', 'paymentMethod', 'status', 'createdAt'];
    const parser = new Json2csvParser({ fields });
    const csv = parser.parse(orders);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename = orders.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting reports:', error);
    res.status(500).json({ error: 'Failed to export reports' });
  }
});

// Notifications routes
app.get('/api/notifications', requireAuth, async (req, res) => {
  try {
    const notifications = await supabaseDb.getNotifications(1);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.get('/api/notifications/unread-count', requireAuth, async (req, res) => {
  try {
    const count = await supabaseDb.getUnreadNotificationsCount(1);
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread notifications count:', error);
    res.status(500).json({ error: 'Failed to fetch unread notifications count' });
  }
});

// Settings routes
app.get('/api/settings', requireAuth, async (req, res) => {
  try {
    const settings = await supabaseDb.getUserSettings(1);
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/settings', requireAuth, async (req, res) => {
  try {
    const settings = await supabaseDb.updateUserSettings(1, req.body);
    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error('Server error:', err);
  res.status(status).json({ message });
});

// Setup development or production serving
(async () => {
  if (app.get('env') === 'development') {
    await setupVite(app, httpServer);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || '5000', 10);
  httpServer.listen(port, '0.0.0.0', () => {
    log(`serving on port ${port}`);
  });
})();

export default app;