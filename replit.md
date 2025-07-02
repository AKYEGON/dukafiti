# DukaSmart Business Platform

## Overview

DukaSmart is a comprehensive business management platform built with a modern full-stack architecture. The application provides inventory management, sales tracking, customer management, and business analytics through an intuitive web interface. It's designed as a single-page application with a REST API backend.

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
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Request Logging**: Custom middleware for API request tracking
- **Error Handling**: Centralized error handling middleware

### Data Storage Solutions
- **Database**: PostgreSQL with Neon serverless database
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema evolution
- **Session Storage**: PostgreSQL with connect-pg-simple for session management

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

1. **Client Requests**: React components make API calls through TanStack Query
2. **API Processing**: Express server handles requests with type validation
3. **Database Operations**: Drizzle ORM executes type-safe database queries
4. **Response Handling**: Structured JSON responses with error handling
5. **UI Updates**: React Query manages cache invalidation and optimistic updates

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL driver for serverless environments
- **drizzle-orm & drizzle-kit**: Type-safe ORM with migration tools
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
- June 30, 2025. Initial setup
- June 30, 2025. Updated authentication system to use email/password instead of phone/PIN
- June 30, 2025. Created modern home page with sign up/sign in buttons
- June 30, 2025. Implemented Google OAuth ready authentication pages
- June 30, 2025. Separated onboarding flow from initial authentication
- June 30, 2025. Fixed authentication session handling and query invalidation
- June 30, 2025. Integrated Replit DB for product storage with UUID-based keys
- June 30, 2025. Successfully migrated from Replit Agent to standard Replit environment
- June 30, 2025. Set up PostgreSQL database with Drizzle ORM schema deployment
- June 30, 2025. Updated inventory page with card-based layout and KES currency formatting
- June 30, 2025. Implemented complete CRUD operations for product management
- July 1, 2025. Successfully migrated from Replit Agent to standard Replit environment
- July 1, 2025. Set up real-time WebSocket notifications for sales transactions
- July 1, 2025. Refactored Sales page with single "Sell" button and confirmation modal
- July 1, 2025. Updated backend API to handle simplified sale payload structure
- July 1, 2025. Integrated real-time toast notifications with status-based messaging
- July 1, 2025. Removed legacy M-Pesa initiation endpoints for cleaner API
- July 1, 2025. Removed "Complete Sale" button from mini cart component
- July 1, 2025. Updated credit sales modal with separate Customer Name and Phone fields
- July 1, 2025. Successfully migrated from Replit Agent to standard Replit environment
- July 1, 2025. Converted application to Progressive Web App (PWA) with manifest.json
- July 1, 2025. Implemented service worker for offline caching and app shell functionality
- July 1, 2025. Added app icons (192x192 and 512x512) with custom DukaSmart branding
- July 1, 2025. Configured PWA meta tags for mobile installation and standalone display
- July 1, 2025. Implemented offline sales queuing with IndexedDB for offline operation
- July 1, 2025. Added Background Sync API for automatic sale replay when connection restored
- July 1, 2025. Created offline.html fallback page with user-friendly offline message
- July 1, 2025. Added real-time offline/online status indicators with pending sales counter
- July 1, 2025. Implemented comprehensive Reports page with summary tiles and analytics
- July 1, 2025. Added hourly sales trend chart using Recharts library
- July 1, 2025. Created top-selling items and customer credit ranking sections
- July 1, 2025. Implemented CSV export functionality for all report data
- July 1, 2025. Successfully migrated from Replit Agent to standard Replit environment
- July 1, 2025. Fixed text color schemes and visibility issues in dark mode interface
- July 1, 2025. Enhanced form component contrast and readability across all dialogs
- July 1, 2025. Successfully migrated from Replit Agent to standard Replit environment
- July 1, 2025. Set up PostgreSQL database with proper schema deployment using Drizzle Kit
- July 1, 2025. Fixed database table creation issues that were causing registration failures
- July 1, 2025. Completed full migration from Replit Agent with PostgreSQL database integration
- July 1, 2025. Configured DatabaseStorage to replace MemStorage for persistent data
- July 1, 2025. Seeded database with sample users, products, and customers for testing
- July 1, 2025. Enhanced color schemes and text visibility across all components
- July 1, 2025. Fixed dashboard hardcoded dark theme to use CSS variables
- July 1, 2025. Improved MetricCard component contrast and theme support
- July 1, 2025. Added comprehensive text visibility fixes for all UI elements
- July 1, 2025. Systematically replaced hardcoded dark colors in all page components
- July 1, 2025. Fixed Reports, Customers, Inventory, Sales, and Settings pages color schemes
- July 1, 2025. Added global text color enforcement rules to prevent invisible text
- July 1, 2025. Made Quick Actions buttons fully functional with modal integration
- July 1, 2025. Added responsive design improvements and keyboard shortcuts (Ctrl+P/O/U/R)
- July 1, 2025. Enhanced button accessibility with focus states and ARIA labels
- July 1, 2025. Implemented smooth hover animations and responsive layout ordering
- July 1, 2025. Completed migration from SQLite to PostgreSQL database configuration
- July 1, 2025. Updated database schema to use PostgreSQL-specific data types and features
- July 1, 2025. Created PostgreSQL migration script with all required tables and sample data
- July 1, 2025. Configured application to use Neon PostgreSQL with proper connection handling
- July 1, 2025. Implemented comprehensive purple accent color scheme with interactive card hover effects
- July 1, 2025. Added new purple color palette (purple-50 to purple-950) to Tailwind configuration
- July 1, 2025. Created interactive card system with purple glow on hover and scale animations
- July 1, 2025. Updated primary buttons to use purple styling while keeping green for success actions
- July 1, 2025. Enhanced mobile responsiveness with responsive grid layouts and compact padding
- July 1, 2025. Implemented proper borders and shadow effects for all cards and components
- July 1, 2025. Updated Edit buttons in Inventory to use purple styling, maintained labeled buttons
- July 2, 2025. Completed migration from Replit Agent to standard Replit environment with PostgreSQL
- July 2, 2025. Implemented comprehensive mobile-first UI refactoring across entire application
- July 2, 2025. Created sticky mobile header with page titles and hamburger menu navigation
- July 2, 2025. Added MobilePageWrapper component for consistent mobile-first layout structure
- July 2, 2025. Refactored Dashboard page with mobile-first card layouts and touch-friendly buttons
- July 2, 2025. Updated all buttons to minimum 48px height for optimal touch targets on mobile
- July 2, 2025. Enhanced typography with text-base minimum size and leading-relaxed spacing
- July 2, 2025. Implemented full-width content layout with proper mobile padding (px-2 sm:px-4)
- July 2, 2025. Added mobile-first base CSS styles for touch-friendly form inputs and buttons
- July 2, 2025. Created accordion-style collapsible components for Settings page organization
- July 2, 2025. Implemented collapsible drawer sidebar with smooth 300ms animations for both mobile and desktop
- July 2, 2025. Added desktop collapse/expand functionality with width transition from w-64 to w-16
- July 2, 2025. Created mobile drawer with slide animation and semi-transparent overlay backdrop
- July 2, 2025. Implemented Universal Search Bar with scroll-based show/hide functionality
- July 2, 2025. Added debounced search API with 300ms delay for real-time results
- July 2, 2025. Created comprehensive search endpoint supporting products, customers, and orders
- July 2, 2025. Added sticky positioning with 200ms animations for search bar visibility
- July 2, 2025. Successfully completed migration from Replit Agent to standard Replit environment
- July 2, 2025. Configured PostgreSQL database with proper schema deployment and sample data seeding
- July 2, 2025. Verified full application functionality with all features working correctly
- July 2, 2025. Fixed critical desktop layout issue by implementing proper flex container structure
- July 2, 2025. Updated main app layout to use flex h-screen for proper sidebar/content positioning
- July 2, 2025. Modified sidebar to use flex positioning instead of fixed positioning for better integration
- July 2, 2025. Ensured all page components render correctly on both mobile and desktop viewports
- July 2, 2025. Implemented enhanced TopBar with smart universal search, notification bell, and profile dropdown
- July 2, 2025. Added real-time search with 300ms debounced API calls and keyboard navigation support
- July 2, 2025. Created comprehensive notification system with unread badge and mark-as-read functionality
- July 2, 2025. Added PostgreSQL notifications table and complete backend API endpoints
- July 2, 2025. Replaced old universal search component with integrated TopBar search functionality
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```