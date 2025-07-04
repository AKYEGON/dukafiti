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

// Simple authentication middleware
function requireAuth(req: any, res: any, next: any) {
  req.user = { email: 'admin@dukafiti.com', id: 1 };
  next();
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes - apply auth only to API routes
app.use('/api', requireAuth);

// API endpoints with Supabase integration
app.get('/api/dashboard/metrics', async (req, res) => {
  try {
    const { data: products } = await supabase.from('products').select('*');
    const { data: orders } = await supabase.from('orders').select('*');
    const { data: customers } = await supabase.from('customers').select('*');
    
    const totalRevenue = orders?.filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + parseFloat(order.total), 0) || 0;
    
    const todayOrders = orders?.filter(order => {
      const orderDate = new Date(order.createdAt);
      const today = new Date();
      return orderDate.toDateString() === today.toDateString();
    }).length || 0;
    
    const lowStockProducts = products?.filter(product => 
      product.stock !== null && product.stock <= product.lowStockThreshold
    ).length || 0;
    
    res.json({
      totalRevenue,
      todayOrders,
      inventoryItems: products?.length || 0,
      lowStockProducts,
      recentOrders: orders?.slice(0, 5) || []
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

// Products API
app.get('/api/products', async (req, res) => {
  try {
    const { data: products } = await supabase.from('products').select('*');
    res.json(products || []);
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .insert([req.body])
      .select()
      .single();
    
    if (error) throw error;
    
    res.json(product);
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json(product);
  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    
    res.json({ success: true });
  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Orders API
app.post('/api/orders', async (req, res) => {
  try {
    const { items, ...orderData } = req.body;
    
    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();
    
    if (orderError) throw orderError;
    
    // Create order items
    const orderItems = items.map((item: any) => ({
      orderId: order.id,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      price: item.price
    }));
    
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);
    
    if (itemsError) throw itemsError;
    
    // Update product stock and sales count
    for (const item of items) {
      if (item.updateStock) {
        await supabase
          .from('products')
          .update({
            stock: item.newStock,
            salesCount: item.salesCount + item.quantity
          })
          .eq('id', item.productId);
      }
    }
    
    // Broadcast sale notification
    wsClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'sale_completed',
          data: { order, items }
        }));
      }
    });
    
    res.json(order);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// WebSocket handling
wss.on('connection', (ws) => {
  wsClients.add(ws);
  
  ws.on('close', () => {
    wsClients.delete(ws);
  });
});

// Serve static files (development uses Vite, production uses dist)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist/public')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../dist/public/index.html'));
  });
} else {
  // Development - serve from client directory
  app.use(express.static(path.join(__dirname, '../client/public')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/index.html'));
  });
}

// Start server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;