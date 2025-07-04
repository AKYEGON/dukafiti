import express from 'express'
import path from 'path'
import cors from 'cors'
import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'http'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { createServer as createViteServer } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const port = process.env.PORT || 5000

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://kwdzbssuovwemthmiuht.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA'

const supabase = createClient(supabaseUrl, supabaseKey)

// Create HTTP server for both Express and WebSocket
const server = createServer(app)
const wss = new WebSocketServer({ server })

// WebSocket clients store
const wsClients = new Set<WebSocket>()

// Basic middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Simple authentication middleware
function requireAuth(req: any, res: any, next: any) {
  req.user = { email: 'admin@dukafiti.com', id: 1 }
  next()
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes - apply auth only to API routes
app.use('/api', requireAuth)

// Simple API endpoints for testing
app.get('/api/dashboard/metrics', async (req, res) => {
  try {
    res.json({
      totalRevenue: 125000,
      todayOrders: 12,
      inventoryItems: 45,
      lowStockAlerts: 3
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch metrics' })
  }
})

app.get('/api/products', async (req, res) => {
  try {
    res.json([
      { id: 1, name: 'Sample Product 1', price: 100, stock: 50 },
      { id: 2, name: 'Sample Product 2', price: 200, stock: 30 }
    ])
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' })
  }
})

app.get('/api/customers', async (req, res) => {
  try {
    res.json([
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ])
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' })
  }
})

app.get('/api/orders', async (req, res) => {
  try {
    res.json([
      { id: 1, customerName: 'John Doe', total: 150, status: 'completed' },
      { id: 2, customerName: 'Jane Smith', total: 250, status: 'pending' }
    ])
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

// WebSocket handling
wss.on('connection', (ws) => {
  wsClients.add(ws)
  
  ws.on('close', () => {
    wsClients.delete(ws)
  })
})

// Setup development server with Vite
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { 
      middlewareMode: true,
      hmr: {
        server: server
      }
    },
    appType: 'custom',
    root: path.resolve(__dirname, '../client'),
    build: {
      outDir: path.resolve(__dirname, '../dist/public'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '../client/src'),
        '@shared': path.resolve(__dirname, '../shared'),
        '@assets': path.resolve(__dirname, '../attached_assets'),
      },
    },
  })
  
  app.use(vite.middlewares)
  
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl
    
    // Skip for API routes
    if (url.startsWith('/api/')) {
      return next()
    }
    
    try {
      const fs = await import('fs')
      const clientTemplate = path.resolve(__dirname, '../client/index.html')
      let template = await fs.promises.readFile(clientTemplate, 'utf-8')
      
      const transformedHtml = await vite.transformIndexHtml(url, template)
      res.status(200).set({ 'Content-Type': 'text/html' }).end(transformedHtml)
    } catch (e) {
      next(e)
    }
  })
} else {
  // Production static file serving
  app.use(express.static(path.join(__dirname, '../dist/public')))
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../dist/public/index.html'))
  })
}

// Start server
server.listen(port, () => {
  console.log(`Server running on port ${port}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})

export default app