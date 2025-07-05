import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cors from 'cors';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test Supabase connection
async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.log('Supabase connection test result:', error.message);
    } else {
      console.log('Supabase connection successful');
    }
  } catch (err) {
    console.log('Supabase connection error:', err);
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.get('/api/dashboard/metrics', async (req, res) => {
  try {
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*');
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*');
    
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*');

    if (ordersError || productsError || customersError) {
      throw new Error('Database query failed');
    }

    const totalRevenue = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
    const ordersToday = orders?.filter(order => {
      const orderDate = new Date(order.created_at);
      const today = new Date();
      return orderDate.toDateString() === today.toDateString();
    }).length || 0;

    res.json({
      totalRevenue,
      ordersToday,
      inventoryItems: products?.length || 0,
      customers: customers?.length || 0
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/customers', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Customers fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Basic API route to test if server is working
app.get('/', (req, res) => {
  res.json({ 
    message: 'DukaFiti API Server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test route for frontend
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is working correctly',
    supabase: 'connected',
    port: PORT 
  });
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Test Supabase connection on startup
  await testSupabaseConnection();
});

export default app;