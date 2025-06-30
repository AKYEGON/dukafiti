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
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```