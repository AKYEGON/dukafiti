# DukaFiti - Deployment & Import Guide

## Overview
DukaFiti is a comprehensive business management platform for Kenyan dukawalas (shop owners). This guide explains how to import and deploy the application in any environment using Supabase as the database backend.

## Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Environment variables setup

## Database Setup

### Option 1: Supabase (Recommended)
1. Create a new Supabase project at https://supabase.com
2. Get your project credentials:
   - Project URL (SUPABASE_URL)
   - Anon key (SUPABASE_ANON_KEY)
   - Service role key (SUPABASE_SERVICE_ROLE_KEY)
3. Run the database setup script in your Supabase SQL editor:
   ```sql
   -- Copy and paste the contents of database-setup.sql
   ```

### Option 2: Local PostgreSQL
1. Install PostgreSQL locally
2. Create a new database: `createdb dukafiti`
3. Run the setup script: `psql dukafiti < database-setup.sql`
4. Set DATABASE_URL in your .env file

## Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration (choose one)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OR for local PostgreSQL
DATABASE_URL=postgresql://username:password@localhost:5432/dukafiti

# Session Configuration
SESSION_SECRET=your_random_session_secret_at_least_32_characters

# Development Settings
NODE_ENV=development
PORT=5000
```

## Installation Steps

1. **Clone/Import the project**
   ```bash
   # If importing to a new environment
   cp -r /path/to/dukafiti ./dukafiti
   cd dukafiti
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual credentials
   ```

4. **Initialize database**
   - For Supabase: Run `database-setup.sql` in the SQL editor
   - For local PostgreSQL: `psql dukafiti < database-setup.sql`

5. **Start the application**
   ```bash
   npm run dev
   ```

## Project Structure

```
dukafiti/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── lib/           # Utilities and configurations
│   │   └── hooks/         # Custom React hooks
├── server/                # Express.js backend
│   ├── routes-supabase.ts # API routes for Supabase
│   ├── supabase-db.ts     # Database helper functions
│   └── supabase.ts        # Supabase client configuration
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database schema definitions
├── database-setup.sql     # Database initialization script
├── DEPLOYMENT.md          # This deployment guide
└── package.json          # Dependencies and scripts
```

## Features

### Core Functionality
- **Inventory Management**: Add, edit, track products with stock levels
- **Sales Processing**: POS-style interface with cash, credit, and mobile money payments
- **Customer Management**: Track customers and credit balances
- **Reports & Analytics**: Sales trends, top-selling products, revenue tracking
- **Offline Support**: PWA with offline sales queuing and sync

### Key Components
- **Dashboard**: Business overview with key metrics
- **Sales Page**: Mobile-first POS interface
- **Inventory**: Product management with stock tracking
- **Customers**: Customer database with credit management
- **Reports**: Comprehensive analytics and data export

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Products
- `GET /api/products` - List all products
- `GET /api/products/search?q=query` - Search products
- `GET /api/products/frequent` - Most frequently sold products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Sales
- `POST /api/sales` - Process sale transaction

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `POST /api/customers/:id/repay` - Record repayment

### Reports
- `GET /api/reports/summary?period=daily|weekly|monthly` - Sales summary
- `GET /api/reports/trend?period=daily|weekly|monthly` - Sales trends
- `GET /api/reports/top-products` - Top-selling products
- `GET /api/reports/top-customers` - Top customers by credit
- `GET /api/reports/orders` - Order history with pagination

### Dashboard
- `GET /api/dashboard/metrics` - Dashboard metrics
- `GET /api/orders/recent` - Recent orders

## Database Schema

### Core Tables
- **users**: User authentication and profiles
- **products**: Inventory items with pricing and stock
- **customers**: Customer information and credit balances
- **orders**: Sales transactions
- **order_items**: Individual items within orders
- **notifications**: System notifications
- **settings**: User and store settings

## Security Features
- Password hashing with bcrypt
- Session-based authentication
- SQL injection protection with parameterized queries
- CORS configuration for API security
- Environment variable protection for sensitive data

## Performance Optimizations
- Database indexing on frequently queried fields
- React Query for efficient data fetching and caching
- Debounced search with 300ms delay
- Pagination for large datasets
- Optimistic updates for better UX

## Mobile Support
- Progressive Web App (PWA) capabilities
- Offline functionality with IndexedDB
- Touch-friendly interface with 48px+ touch targets
- Responsive design for mobile, tablet, and desktop
- Service worker for caching and background sync

## Troubleshooting

### Common Issues
1. **Database connection errors**: Verify Supabase credentials in .env
2. **Authentication failures**: Check password hashing and session configuration
3. **API endpoint 404s**: Ensure all routes are properly imported in server/index.ts
4. **Frontend build errors**: Run `npm install` and check for TypeScript errors

### Debug Mode
Set `NODE_ENV=development` to enable:
- Detailed error logging
- API request/response logging
- Hot reloading for development

## Production Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use strong, unique SESSION_SECRET
3. Configure CORS for your domain
4. Set up SSL/TLS certificates
5. Configure reverse proxy (nginx/Apache)

### Build Process
```bash
npm run build
npm start
```

### Monitoring
- Monitor database performance via Supabase dashboard
- Set up error tracking (e.g., Sentry)
- Configure log aggregation
- Monitor API response times and error rates

## Support
For issues or questions, refer to:
- Database schema: `shared/schema.ts`
- API documentation: This file's endpoint section
- Database setup: `database-setup.sql`
- Environment configuration: `.env.example`