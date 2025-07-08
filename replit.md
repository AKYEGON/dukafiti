# DukaFiti Business Platform

## Overview

DukaFiti is a comprehensive business management platform completely rebuilt from the ground up with atomic, clean architecture. The application provides inventory management, sales tracking, customer management, and business analytics through an intuitive web interface with real-time updates and multi-tenant data isolation.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for client-side routing
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query (React Query) for server state
- **Form Handling**: React Hook Form with Zod validation
- **PWA Features**: Service worker for offline caching, Web App Manifest for installability

### Backend Architecture
- **Database**: Supabase (PostgreSQL) with built-in authentication and real-time features
- **Authentication**: Supabase Auth with email/password authentication
- **Real-time**: Supabase real-time subscriptions for live updates
- **API Design**: Direct Supabase client calls from frontend (serverless architecture)
- **Data Operations**: Supabase JavaScript SDK for all CRUD operations

### Data Storage Solutions
- **Database**: Supabase PostgreSQL with built-in security and RLS
- **Authentication**: Supabase Auth with session management
- **Real-time Features**: Supabase real-time subscriptions
- **File Storage**: Supabase Storage (available if needed)
- **Edge Functions**: Supabase Edge Functions for serverless API endpoints

## Key Components

### Database Schema
The application uses a relational data model with the following core entities:
- **Products**: Inventory items with SKU, pricing, stock levels, and categories
- **Customers**: Customer information including contact details
- **Orders**: Sales transactions linked to customers with status tracking
- **Order Items**: Line items for each order with product references
- **Users**: System users with role-based access

### API Structure
RESTful endpoints organized by resource:
- `/api/products` - Product management (CRUD operations, search)
- `/api/customers` - Customer management
- `/api/orders` - Order processing and tracking
- `/api/dashboard/metrics` - Business analytics and KPIs

### UI Components
- **Layout System**: Responsive sidebar navigation with mobile support
- **Component Library**: Comprehensive set of reusable UI components
- **Forms**: Validated forms with real-time feedback
- **Data Tables**: Sortable and searchable data presentation
- **Charts**: Business metrics visualization (ready for chart integration)

## Data Flow

1. **Client Requests**: React components make direct Supabase API calls through TanStack Query
2. **Authentication**: Supabase Auth handles user sessions and security
3. **Database Operations**: Supabase JavaScript SDK executes queries with built-in security
4. **Real-time Updates**: Supabase real-time subscriptions provide live data updates
5. **UI Updates**: React Query manages cache invalidation and optimistic updates

## External Dependencies

### Core Dependencies
- **@supabase/supabase-js**: Supabase JavaScript SDK for database and auth operations
- **@tanstack/react-query**: Server state management and caching
- **react-hook-form**: Performant form handling with validation
- **zod**: Runtime type validation and schema definition

### UI Dependencies
- **@radix-ui/***: Accessible, unstyled UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Modern icon library
- **class-variance-authority**: Type-safe component variants

### Development Dependencies
- **vite**: Fast build tool with HMR
- **typescript**: Static type checking
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Database**: Drizzle Kit manages schema migrations

### Environment Configuration
- **Development**: Local development server with HMR and hot reload
- **Production**: Optimized builds with static asset serving
- **Database**: Environment-based connection via `DATABASE_URL`

### Scripts
- `npm run dev`: Development server with TypeScript execution
- `npm run build`: Production build for both frontend and backend
- `npm run start`: Production server startup
- `npm run db:push`: Database schema synchronization

## Changelog

```
Changelog:
[Previous entries maintained...]
- July 8, 2025. COMPREHENSIVE ATOMIC AUDIT COMPLETED: Performed complete codebase analysis and Phase B fixes
- July 8, 2025. Fixed all code formatting issues with Prettier across 21 files for consistent style
- July 8, 2025. Created ESLint configuration (eslint.config.js) for ESLint v9+ compatibility with TypeScript and React rules
- July 8, 2025. Enhanced useOfflineQueue hook with real Supabase integration and proper retry logic with exponential backoff
- July 8, 2025. Fixed offline sync system to actually execute database operations instead of console logging
- July 8, 2025. Added comprehensive error handling and loading states to Dashboard component
- July 8, 2025. Enhanced Sales page with stock validation and automatic inventory updates after sales
- July 8, 2025. Verified Inventory page has fully functional CRUD operations with proper error handling and loading states
- July 8, 2025. Confirmed all hook dependencies are correct with proper cleanup in useEffect hooks
- July 8, 2025. Created comprehensive AUDIT_REPORT.md documenting all issues found and fixes applied
- July 8, 2025. Verified build process passes with no TypeScript errors (297kB production bundle)
- July 8, 2025. Established comprehensive testing and validation protocols for all real-time features
- July 8, 2025. Documented complete multi-tenant security architecture with RLS policies for data isolation
- July 8, 2025. Created detailed setup instructions (SETUP_INSTRUCTIONS.md) for manual database schema deployment
- July 8, 2025. FIXED DEPLOYMENT LOADING ISSUE: Added auth timeout protection and improved error handling for deployed environments
- July 8, 2025. PHASE 3 INVENTORY COMPLETE: Built full CRUD inventory page with Product cards, Add/Edit/Restock modals, and real-time updates
- July 8, 2025. Created comprehensive useMutation hook for secure database operations with store isolation
- July 8, 2025. Implemented complete authentication flow with proper loading states and error handling
- July 8, 2025. FIXED INFINITE SPINNER: Simplified auth initialization to prevent hanging on production deployment
- July 8, 2025. Implemented proper auth flow separation: App handles global loading, MainLayout handles auth protection
- July 8, 2025. CREATED STATIC LANDING PAGE: Moved dashboard to /dashboard route, root path now shows static landing page eliminating infinite loading
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```