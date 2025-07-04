import express from 'express'
import session from 'express-session'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const app = express()
const PORT = parseInt(process.env.PORT || '5000', 10)
// Middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: false }))
// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'dukafiti-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}))
// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
    return
  }
  
  next()
})
// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})
// Serve static files
const staticPath = path.join(__dirname, 'public')
app.use(express.static(staticPath))
// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'))
})
// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 DukaFiti running on port ${PORT}`)
})
export default app;