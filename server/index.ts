import express from 'express';
import path from 'path';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = process.env.PORT || 5000;

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://kwdzbssuovwemthmiuht.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA';

const supabase = createClient(supabaseUrl, supabaseKey);

// Create HTTP server for both Express and WebSocket
const server = createServer(app);
const wss = new WebSocketServer({ server });

// WebSocket clients store
const wsClients = new Set<WebSocket>();

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
});

// Simple authentication middleware
function requireAuth(req: any, res: any, next: any) {
  req.user = { email: 'admin@dukafiti.com', id: 1 };
  next()
}

// Health check endpoint (required for Railway)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
});

// API Routes with basic responses - apply auth only to API routes
app.use('/api', requireAuth);

// API endpoints with Supabase integration
app.get('/api/dashboard/metrics', async (req, res) => {
  try {
    const { data: products } = await supabase.from('products').select('*');
    const { data: orders } = await supabase.from('orders').select('*');
    const { data: customers } = await supabase.from('customers').select('*');
    
    const totalRevenue = orders?.filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + parseFloat(order.total || '0'), 0) || 0;
    
    const today = new Date().toISOString().split('T')[0];
    const ordersToday = orders?.filter(order => 
      order.created_at?.split('T')[0] === today
    ).length || 0;

    res.json({
      totalRevenue,
      ordersToday,
      inventoryItems: products?.length || 0,
      customers: customers?.length || 0
    })
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' })
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const { data: products, error } = await supabase.from('products').select('*');
    if (error) throw error;
    res.json(products || [])
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch products' })
  }
});

app.get('/api/customers', async (req, res) => {
  try {
    const { data: customers, error } = await supabase.from('customers').select('*');
    if (error) throw error;
    res.json(customers || [])
  } catch (error) {
    console.error('Customers fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' })
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const { data: orders, error } = await supabase.from('orders').select('*');
    if (error) throw error;
    res.json(orders || [])
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
});

app.get('/api/notifications', async (req, res) => {
  try {
    const { data: notifications, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(notifications || [])
  } catch (error) {
    console.error('Notifications fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
});

app.get('/api/notifications/unread-count', async (req, res) => {
  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('is_read', false);
    if (error) throw error;
    res.json({ count: notifications?.length || 0 })
  } catch (error) {
    console.error('Unread notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' })
  }
});

// Catch-all for other API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not implemented yet' })
});

// SPA catch-all handler - serve index.html for all non-API routes
app.get('*', (req, res) => {
  const indexPath = process.env.NODE_ENV === 'production' 
    ? path.resolve(import.meta.dirname, '..', 'dist', 'public', 'index.html')
    : path.resolve(import.meta.dirname, '..', 'client', 'index.html');
  
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Error loading application')
    }
  })
});

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' })
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  wsClients.add(ws);
  
  ws.on('close', () => {
    wsClients.delete(ws)
  })
});

// Serve static files based on environment
if (process.env.NODE_ENV === 'production') {
  // In production, serve static files from dist
  app.use(express.static(path.join(__dirname, '../dist/public')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../dist/public/index.html'))
  })
} else {
  // In development, handle static file serving manually
  app.use('/src', express.static(path.join(__dirname, '../client/src'), {
    setHeaders: (res, path) => {
      if (path.endsWith('.ts') || path.endsWith('.tsx')) {
        res.setHeader('Content-Type', 'application/javascript')
      }
    }
  }));
  
  app.use('/node_modules', express.static(path.join(__dirname, '../node_modules')));
  app.use(express.static(path.join(__dirname, '../client/public')));
  
  // Serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' })
    }
    res.sendFile(path.resolve(__dirname, '../client/index.html'))
  })
}

// Start server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
});

export default app;