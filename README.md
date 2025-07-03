# DukaFiti - Business Management Platform

A comprehensive business management platform built with React, Express.js, and Supabase. Features inventory management, sales tracking, customer management, and business analytics.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Supabase account and project
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd dukafiti
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your Supabase credentials:
   - `SUPABASE_URL`: Your Supabase project URL (https://your-project.supabase.co)
   - `SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `DATABASE_URL`: Your Supabase database connection string

4. **Initialize database**
   ```bash
   npm run db:push
   npm run seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🌐 Deployment

### Environment Variables

All deployment platforms require these environment variables:

```env
# Required for all deployments
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
NODE_ENV=production
SESSION_SECRET=your-secure-session-secret

# Optional but recommended
ALLOWED_ORIGINS=https://your-domain.com
PORT=5000
```

### Supabase Auth Configuration

1. **Go to your Supabase Dashboard**
2. **Navigate to Authentication > Settings**
3. **Add your deployment URL to Site URL**
4. **Add redirect URLs:**
   - `https://your-domain.com/auth/callback`
   - `https://your-domain.com/dashboard`

### Platform-Specific Deployment

#### 🔷 Vercel

1. **Connect your repository to Vercel**
2. **Set environment variables in Vercel dashboard**
3. **Deploy:**
   ```bash
   npm run build
   vercel --prod
   ```

#### 🚄 Railway

1. **Connect your repository to Railway**
2. **Set environment variables in Railway dashboard**
3. **Deploy automatically via Git push**

#### 🎯 Render

1. **Connect your repository to Render**
2. **Set build command:** `npm run build`
3. **Set start command:** `npm start`
4. **Add environment variables in Render dashboard**

#### 🐳 Docker

1. **Build the image:**
   ```bash
   docker build -t dukafiti .
   ```

2. **Run the container:**
   ```bash
   docker run -p 5000:5000 --env-file .env dukafiti
   ```

3. **Or use Docker Compose:**
   ```bash
   docker-compose up -d
   ```

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** + **shadcn/ui** for styling
- **TanStack Query** for state management
- **Wouter** for routing

### Backend
- **Express.js** with TypeScript
- **Supabase** for authentication and database
- **Drizzle ORM** for database operations
- **WebSocket** for real-time features

### Database
- **PostgreSQL** via Supabase
- **Drizzle Kit** for migrations
- **Automatic seeding** with sample data

## 🔧 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:push` - Push database schema
- `npm run seed` - Seed database with sample data
- `npm run check` - Type checking

## 📊 Features

- **📦 Inventory Management** - Track products, stock levels, and categories
- **💰 Sales Tracking** - Process sales, manage payment methods
- **👥 Customer Management** - Store customer info, track credit balances
- **📈 Analytics Dashboard** - Business metrics and reporting
- **🔔 Real-time Notifications** - WebSocket-powered updates
- **📱 PWA Support** - Install as mobile app, offline capability
- **🌙 Dark Mode** - Toggle between light and dark themes

## 🔐 Security

- **Authentication** via Supabase Auth
- **Session Management** with secure cookies
- **CORS** properly configured
- **Environment Variables** for sensitive data
- **SQL Injection Protection** via Drizzle ORM

## 🚨 Troubleshooting

### Common Issues

1. **Authentication not working**
   - Check `SUPABASE_URL` format (should be `https://project.supabase.co`)
   - Verify `SUPABASE_ANON_KEY` is correct
   - Ensure site URL is configured in Supabase

2. **Database connection issues**
   - Verify `DATABASE_URL` format
   - Check database credentials
   - Run `npm run db:push` to sync schema

3. **CORS errors**
   - Add your domain to `ALLOWED_ORIGINS`
   - Check Supabase Auth settings

4. **Build failures**
   - Ensure Node.js 18+ is installed
   - Clear `node_modules` and reinstall
   - Check TypeScript errors with `npm run check`

### Health Check

Visit `/healthz` endpoint to verify deployment status:
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
- Check the troubleshooting section above
- Review environment variable configuration
- Verify Supabase project settings
- Check application logs for error details