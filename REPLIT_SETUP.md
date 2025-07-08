# DukaFiti - Replit Deployment Guide

## Overview
This guide will help you deploy DukaFiti (business management platform) on Replit with Supabase backend integration.

## Prerequisites
- Replit account
- Supabase account with project created
- Your Supabase credentials

## Step-by-Step Setup

### 1. Environment Variables & Secrets

**Click the "Secrets" tab in your Replit sidebar and add these keys:**

| Key | Description | Example Value |
|-----|-------------|---------------|
| `SUPABASE_URL` | Your Supabase project URL | `https://your-project.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@db.your-project.supabase.co:5432/postgres` |
| `SESSION_SECRET` | Secure session secret | `your_secure_random_string_here` |
| `API_URL` | Your Replit app URL | `https://your-app.your-username.repl.co` |

**Optional M-Pesa Integration:**
| Key | Description |
|-----|-------------|
| `MPESA_CONSUMER_KEY` | M-Pesa API consumer key |
| `MPESA_CONSUMER_SECRET` | M-Pesa API consumer secret |
| `MPESA_SHORTCODE` | M-Pesa business shortcode |
| `MPESA_PASSKEY` | M-Pesa LNM passkey |

### 2. Database Migration

After setting up your Supabase credentials, run the database migration:

```bash
npm run migrate
```

This will create all required tables in your Supabase database.

### 3. Project Configuration

The project is already configured with:

- ✅ **Port Binding**: Uses `process.env.PORT` for Replit compatibility
- ✅ **Static Serving**: Serves built frontend in production mode
- ✅ **Environment Variables**: Reads all config from `process.env`
- ✅ **Supabase Integration**: Full Supabase client and server setup
- ✅ **WebSocket Support**: Real-time notifications
- ✅ **PWA Features**: Offline functionality with service worker

### 4. Development vs Production

**Development Mode (Default):**
- Runs on `npm run dev`
- Uses Vite dev server for frontend
- Hot module replacement enabled
- Debug logging active

**Production Mode:**
- Automatically builds and serves static files
- Optimized bundles
- Secure cookie settings
- Error handling

### 5. Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run migrate` | Run database migrations |
| `npm run db:push` | Push schema to database |

### 6. Testing the Deployment

1. **Check Console**: Ensure no errors in the Replit console
2. **Test API**: Visit `/api/supabase-config` to verify configuration
3. **Test Frontend**: Open the preview to see the DukaFiti dashboard
4. **Test Authentication**: Try logging in with your credentials
5. **Test Database**: Create a product, customer, or sale

### 7. Common Issues & Solutions

**"Failed to fetch Supabase config":**
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set in Secrets
- Check that keys don't have extra spaces

**"Database connection failed":**
- Ensure `DATABASE_URL` is correctly formatted
- Verify Supabase project is active and accessible

**"Port binding error":**
- Project automatically uses Replit's assigned port
- No manual configuration needed

**"Static files not loading":**
- Run `npm run build` to generate production assets
- Verify `NODE_ENV=production` for deployment

### 8. Features Available

✅ **Inventory Management**: Add, edit, and track products
✅ **Sales Processing**: POS-style sales interface with offline support
✅ **Customer Management**: Customer profiles with credit tracking
✅ **Reports & Analytics**: Sales reports with CSV export
✅ **Real-time Notifications**: WebSocket-powered updates
✅ **PWA Support**: Install as mobile app, offline functionality
✅ **Dark/Light Theme**: User preference switching
✅ **Responsive Design**: Mobile-first, tablet and desktop optimized

### 9. Deployment to Production

When ready to deploy:

1. Set `NODE_ENV=production` in Secrets
2. Click "Deploy" in Replit
3. Your app will be available at `https://your-app.your-username.repl.co`

### 10. Support

If you encounter issues:
1. Check the Replit console for error messages
2. Verify all environment variables are correctly set
3. Ensure your Supabase project is properly configured
4. Check that your database has been migrated with required tables

## Architecture Notes

- **Frontend**: React + TypeScript with Vite build system
- **Backend**: Express.js server with TypeScript
- **Database**: Supabase PostgreSQL with Drizzle ORM
- **Authentication**: Supabase Auth with session management
- **Real-time**: WebSocket connections for live updates
- **Styling**: Tailwind CSS with shadcn/ui components
- **PWA**: Service Worker with IndexedDB for offline functionality