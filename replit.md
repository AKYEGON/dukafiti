# DukaFiti - Point of Sale System

## Overview

DukaFiti is a modern point-of-sale (POS) system built with React and TypeScript. The application focuses on inventory management, sales tracking, and customer management for retail businesses. It uses a modern tech stack with Vite for build tooling, Tailwind CSS for styling, and Drizzle ORM for database operations.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom component variants
- **State Management**: TanStack Query for server state management
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Supabase for user authentication and authorization
- **API Layer**: Built to work with Supabase backend services

### Database Schema
The application uses a relational database with the following key entities:
- **Products**: Inventory management with SKU, pricing, stock levels, and categories
- **Customers**: Customer information with balance tracking
- **Orders**: Sales transactions with payment methods and status tracking
- **Order Items**: Line items for each sale
- **Users**: Authentication and user management

## Key Components

### Product Management
- Inventory tracking with low stock thresholds
- SKU-based product identification
- Category-based organization
- Sales count tracking for analytics

### Customer Management
- Customer profiles with contact information
- Balance tracking for credit/debit accounts
- Order history association

### Sales Processing
- Order creation with multiple payment methods
- Real-time inventory updates
- Customer assignment (optional for walk-in sales)
- Order status management

### Analytics & Reporting
- Sales performance tracking
- Inventory analytics
- Customer behavior insights
- Percentage change calculations for period comparisons

## Data Flow

1. **Product Entry**: Products are added with SKU, pricing, and initial stock
2. **Sales Process**: Orders are created with customer information and product selections
3. **Inventory Update**: Stock levels are automatically adjusted after each sale
4. **Analytics Generation**: Sales data is processed for reporting and insights
5. **Customer Tracking**: Customer purchase history and balances are maintained

## External Dependencies

### Core Dependencies
- **Supabase**: Backend-as-a-Service for authentication and real-time features
- **Drizzle ORM**: Database operations and schema management
- **TanStack Query**: Server state management and caching
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling framework

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety and developer experience
- **Replit Plugins**: Development environment integration

## Deployment Strategy

The application supports multiple deployment targets:

### Development
- Local development with Vite dev server on port 5000
- Hot module replacement for rapid development

### Production Options
1. **Vercel**: Optimized for static site deployment with custom build configuration
2. **Railway**: Containerized deployment using Dockerfile
3. **General Build**: Standard Vite build for any static hosting

### Build Configurations
- **Standard Build**: Basic Vite build for most deployments
- **Vercel Build**: Custom configuration for Vercel platform
- **Railway Build**: Docker-based deployment with health checks

## Changelog

```
Changelog:
- July 08, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```

## Technical Decisions

### Database Choice
- **Problem**: Need for type-safe database operations with good developer experience
- **Solution**: Drizzle ORM with PostgreSQL schema
- **Benefits**: Type safety, excellent TypeScript integration, flexible query building
- **Note**: Currently configured for Drizzle ORM; PostgreSQL can be added later as needed

### UI Framework
- **Problem**: Need for accessible, customizable components
- **Solution**: Radix UI with shadcn/ui styling system
- **Benefits**: Accessibility out of the box, consistent design system, easy customization

### State Management
- **Problem**: Managing server state and caching
- **Solution**: TanStack Query for server state, React state for local UI state
- **Benefits**: Automatic caching, background updates, optimistic updates

### Authentication
- **Problem**: Need for secure user authentication
- **Solution**: Supabase authentication service
- **Benefits**: Built-in security, social logins, session management

### Styling Approach
- **Problem**: Need for maintainable, responsive styling
- **Solution**: Tailwind CSS with component variants
- **Benefits**: Utility-first approach, consistent spacing, responsive design