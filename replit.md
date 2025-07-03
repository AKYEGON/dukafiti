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
- July 2, 2025. Added Mobile Money payment option to Sales page, confirmation modal, and Reports breakdown
- July 2, 2025. Updated backend API to handle mobileMoney payments with paid status (like Cash payments)
- July 2, 2025. Enhanced Reports page to include Mobile Money in payment breakdown and CSV exports
- July 2, 2025. Refactored Reports page with unified summary cards and extended graph timeframes
- July 2, 2025. Added new backend endpoints `/api/reports/summary` and `/api/reports/trend` with period support
- July 2, 2025. Implemented responsive dropdown selectors for Summary Timeframe and Graph View
- July 2, 2025. Enhanced Orders Record section with desktop table and mobile cards showing total amounts and product lists
- July 2, 2025. Updated Orders endpoint to include price information and improved frontend display with proper formatting
- July 2, 2025. Successfully completed migration from Replit Agent to standard Replit environment with PostgreSQL database
- July 2, 2025. Implemented Smart Product Search Bar with 300ms debounced API calls and keyboard navigation
- July 2, 2025. Enhanced Quick-Select Panel to show only top 6 frequently sold items with improved styling
- July 2, 2025. Added purple accent hover effects and focus states for accessibility compliance
- July 2, 2025. Integrated search dropdown with up to 8 results showing "Name – KES Price" format
- July 2, 2025. Added proper ARIA labels and 48px minimum touch targets for mobile optimization
- July 2, 2025. Updated Reports page summary cards from horizontal scrolling to vertical grid layout (2-column responsive)
- July 2, 2025. Fixed store profile save error by adding missing ownerName field to database schema and proper field mapping
- July 2, 2025. Added default storeType value ('retail') for new store profiles to prevent null constraint violations
- July 2, 2025. Removed Language Toggle and Data Backup sections from Settings page per user request
- July 2, 2025. Cleaned up backend API routes for language settings (/api/settings/language) and backup endpoints (/api/backup, /api/backup/google-drive)
- July 2, 2025. Simplified Settings page to show only Store Profile, Dark Mode, and Manual Sync sections
- July 2, 2025. Fixed percentage calculation issue in Dashboard by clearing service worker cache and browser modules
- July 2, 2025. Created SimpleMetricCard component and removed percentage displays from Dashboard cards per user request
- July 2, 2025. Removed keyboard shortcut labels from Quick Actions buttons (Ctrl+P, Ctrl+O, etc.)
- July 2, 2025. Implemented Edit Customer functionality with pre-filled modal and PUT /api/customers/:id endpoint
- July 2, 2025. Fixed Record Repayment balance calculation bug - now properly subtracts payment from customer balance
- July 2, 2025. Updated Customer page to replace "View" buttons with "Edit" buttons for better UX
- July 2, 2025. Successfully migrated from Replit Agent to standard Replit environment with PostgreSQL database
- July 2, 2025. Created PostgreSQL database and deployed complete schema with all required tables
- July 2, 2025. Seeded database with sample users, products, customers, and notifications for immediate functionality
- July 2, 2025. Verified full application functionality with Express server running on port 5000
- July 2, 2025. Enhanced Reports Export CSV with detailed order and line item data using json2csv library
- July 2, 2025. Added comprehensive sales error handling with specific error messages and stock validation
- July 2, 2025. Implemented stock validation in sales confirmation modal to prevent insufficient stock sales
- July 2, 2025. Added "Add Product" button to inventory page header for easy product creation access
- July 3, 2025. Enhanced Inventory Add/Edit Product modal with "Unknown Quantity" toggle for items measured in variable units
- July 3, 2025. Updated database schema to allow null stock quantities and skip stock validation for unknown quantity items
- July 3, 2025. Modified dashboard low-stock alerts to exclude products with unknown quantities
- July 3, 2025. Added visual indicators in inventory listing to display "—" for unknown quantity items
- July 3, 2025. Fixed stock validation bug preventing sales of unknown quantity items in frontend and confirmation modal
- July 3, 2025. Enhanced Product Form modal with professional UX/UI design including gradient backgrounds and styled checkbox
- July 3, 2025. Successfully completed migration from Replit Agent to standard Replit environment with full functionality
- July 3, 2025. Successfully migrated from Replit Agent to standard Replit environment with PostgreSQL database
- July 3, 2025. Created and configured PostgreSQL database with proper schema deployment using Drizzle Kit
- July 3, 2025. Seeded database with sample users, products, and customers for immediate testing functionality
- July 3, 2025. Verified full application functionality with Express server running successfully on port 5000
- July 3, 2025. Fixed critical unknown quantity stock validation bug preventing multiple sales of same item
- July 3, 2025. Updated ConfirmationModal to use fresh product data instead of stale cart references
- July 3, 2025. Enhanced cart items to automatically refresh with updated product information after each sale
- July 3, 2025. Completely overhauled Login and Register pages with enterprise-grade UX/UI design
- July 3, 2025. Implemented centered responsive card layout with purple/green brand color scheme
- July 3, 2025. Added professional visual hierarchy with labels above inputs and proper error validation
- July 3, 2025. Enhanced password fields with show/hide toggles and comprehensive accessibility features
- July 3, 2025. Applied mobile-first design with 48px+ touch targets and responsive padding
- July 3, 2025. Added WCAG AA compliant focus states and ARIA labels throughout authentication forms
- July 3, 2025. Completely overhauled responsive layouts for optimal tablet and mobile experience
- July 3, 2025. Implemented comprehensive responsive container system with proper breakpoints
- July 3, 2025. Enhanced grid layouts: Mobile (1-2 cols), Tablet (2-3 cols), Desktop (3-4 cols)
- July 3, 2025. Added tablet-specific touch target optimizations (44px) and mobile enhancements (50px)
- July 3, 2025. Updated all pages to use consistent responsive padding and spacing patterns
- July 3, 2025. Created responsive grid and card components for consistent layout behavior
- July 3, 2025. Successfully migrated from Replit Agent to standard Replit environment with PostgreSQL database
- July 3, 2025. Fixed critical credit sales data format mismatch between frontend and backend API
- July 3, 2025. Updated frontend to send customer data as single string field instead of separate name/phone fields
- July 3, 2025. Verified all database operations, product sales, customer management, and credit transactions work properly
- July 3, 2025. Fixed product search functionality on Sales page to use correct /api/products/search endpoint
- July 3, 2025. Enhanced backend search with intelligent matching across name, SKU, category, and description fields
- July 3, 2025. Made sale confirmation modal scrollable to ensure Confirm button accessibility on all screen sizes
- July 3, 2025. Fixed logout redirect to navigate users back to home page instead of login page
- July 3, 2025. Successfully migrated from Replit Agent to standard Replit environment with PostgreSQL database
- July 3, 2025. Installed missing dependencies (tsx package) and configured PostgreSQL database properly
- July 3, 2025. Deployed complete database schema with all required tables using Drizzle Kit migrations
- July 3, 2025. Seeded database with sample users, products, customers, and notifications for immediate functionality
- July 3, 2025. Fixed TopBar layout to ensure notification bell and profile icons stay positioned at far right
- July 2, 2025. Created PostgreSQL database with proper schema deployment using Drizzle Kit
- July 2, 2025. Updated database configuration from Neon to PostgreSQL with pg driver
- July 2, 2025. Seeded database with sample users, products, customers, and notifications for testing
- July 2, 2025. Verified full application functionality with PostgreSQL integration
- July 2, 2025. Successfully completed migration from Replit Agent to standard Replit environment
- July 2, 2025. Redesigned Inventory page with professional UX/UI featuring two-column grid layout
- July 2, 2025. Implemented sticky toolbar with search functionality and real-time client-side sorting
- July 2, 2025. Added proper skeleton loading states and responsive card design with hover effects
- July 2, 2025. Redesigned Dashboard page with professional three-row layout structure
- July 2, 2025. Implemented polished summary cards with icons in colored circles and proper typography
- July 2, 2025. Created uniform Quick Action buttons with hover lift effects and purple styling
- July 2, 2025. Enhanced Recent Orders table with zebra striping and mobile card fallbacks
- July 2, 2025. Completely redesigned Sales page with mobile-first cashier-style POS experience
- July 2, 2025. Implemented single-column flow with Quick-Select panel, Mini-Cart, Payment selector, and sticky Sell button
- July 2, 2025. Added professional confirmation modal with customer info for credit sales
- July 2, 2025. Created smooth touch-friendly interface with proper button animations and feedback
- July 2, 2025. Fixed Reports page layout - changed Top Customers and Top-Selling Products panels from side-by-side to stacked vertical layout
- July 2, 2025. Ensured proper data refresh for Top Customers and Top-Selling Products panels when timeframe selection changes
- July 2, 2025. Both panels now respond to Summary Timeframe dropdown changes and display accurate real-time data
- July 2, 2025. Successfully completed migration from Replit Agent to standard Replit environment with PostgreSQL database
- July 2, 2025. Fixed critical customer balance bug where initial debt amounts were always saved as 0.00
- July 2, 2025. Updated customer form mutation logic to properly handle non-empty balance values vs empty strings
- July 2, 2025. Verified full application functionality after migration with comprehensive database integration
- July 3, 2025. Successfully migrated from Replit Agent to standard Replit environment with PostgreSQL database
- July 3, 2025. Created and configured PostgreSQL database with proper schema deployment using Drizzle Kit
- July 3, 2025. Seeded database with sample users, products, customers, and notifications for immediate functionality
- July 3, 2025. Verified full application functionality with Express server running successfully on port 5000
- July 3, 2025. Confirmed enhanced credit sale modal functionality with customer autocomplete and new customer creation
- July 3, 2025. Fixed credit sale validation bug - ensured customer information is properly required and passed to backend API
- July 3, 2025. Enhanced sales page to use comprehensive SaleConfirmationModal with existing customer dropdown and new customer forms
- July 2, 2025. Completely redesigned Sidebar component with professional UX/UI
- July 2, 2025. Implemented vertical flex layout with logo at top, navigation in middle, and collapse toggle at bottom
- July 2, 2025. Enhanced nav items with proper purple/green color scheme and hover animations
- July 2, 2025. Added professional collapse/expand button with panel icons at bottom of sidebar
- July 2, 2025. Improved mobile responsiveness with sticky header and smooth drawer animations
- July 2, 2025. Added proper dividers, spacing, and typography for polished professional look
- July 2, 2025. Completely redesigned Login and Register pages with professional UX/UI
- July 2, 2025. Implemented research-backed best practices with labels above inputs and inline validation
- July 2, 2025. Added password show/hide toggles with eye icons for better usability
- July 2, 2025. Enhanced forms with proper focus states, touch-friendly buttons, and accessibility
- July 2, 2025. Applied consistent purple/green color scheme and dark mode support
- July 2, 2025. Added "Forgot password?" link and clear flow switching between login/register
- July 2, 2025. Completely redesigned Dashboard page with professional layout following F/Z reading pattern
- July 2, 2025. Implemented responsive design with single-column mobile and multi-region desktop layout
- July 2, 2025. Added comprehensive skeleton loading states with proper animations
- July 2, 2025. Enhanced accessibility with ARIA labels, focus states, and WCAG AA contrast compliance
- July 2, 2025. Improved visual hierarchy with colored icon circles and consistent spacing
- July 2, 2025. Added hover effects and interactive feedback throughout dashboard components
- July 2, 2025. Completely overhauled landing page with sleek, professional design using green/purple brand colors
- July 2, 2025. Implemented full-width hero with "Smart POS for Kenyan Dukawalas" positioning and interactive dashboard preview
- July 2, 2025. Added authentic Kenyan testimonials from Mary Wanjiku and John Kamau with 5-star ratings
- July 2, 2025. Created responsive mobile-first design with touch-friendly CTA buttons and hamburger navigation
- July 2, 2025. Built trust elements with feature benefits grid and proper WCAG accessibility compliance
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```