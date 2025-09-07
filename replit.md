# Recipe Management System (PastryPro)

## Overview

PastryPro is a professional recipe management system designed for commercial kitchens and food service operations. The application provides comprehensive tools for managing recipes, ingredients, inventory tracking, cost calculations, and professional kitchen calculators. Built as a full-stack web application, it combines a React frontend with an Express backend and PostgreSQL database to deliver a robust solution for culinary professionals.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side is built with **React 18** using modern TypeScript patterns and hooks-based state management. The UI leverages **shadcn/ui** components with **Radix UI** primitives for accessible, professional-grade interface elements. **TailwindCSS** provides utility-first styling with a custom design system featuring neutral base colors and primary green/secondary yellow accent colors.

**State Management**: Uses **TanStack Query (React Query)** for server state management, caching, and data synchronization. Local component state is managed with React hooks.

**Routing**: Implemented with **Wouter** for lightweight client-side routing, supporting pages for dashboard, recipes, ingredients, calculators, and inventory management.

**Component Structure**: Follows a modular architecture with reusable UI components, feature-specific components (calculators, cards), and page-level components organized in a logical hierarchy.

### Backend Architecture
The server is built with **Express.js** and follows RESTful API design principles. The application uses a layered architecture separating routing, business logic, and data access.

**API Design**: RESTful endpoints organized by resource (recipes, ingredients, categories, inventory) with proper HTTP methods and status codes.

**Database Layer**: Uses **Drizzle ORM** with TypeScript-first approach for type-safe database operations and schema management. The storage layer abstracts database operations behind interfaces for better testability and maintainability.

**Middleware**: Implements request logging, JSON parsing, error handling, and development-specific middleware for hot reloading.

### Database Design
**PostgreSQL** database with a normalized schema supporting:

- **Users**: Basic user management with username/password authentication
- **Categories**: Hierarchical recipe categorization
- **Ingredients**: Comprehensive ingredient data including cost tracking, stock levels, suppliers, and expiry dates
- **Recipes**: Full recipe management with instructions, timing, difficulty, and serving information
- **Recipe-Ingredients**: Many-to-many relationship with quantities and units
- **Inventory Logs**: Transaction tracking for stock movements, usage, and adjustments

**Schema Features**: Uses UUID primary keys, proper foreign key relationships, and JSON fields for flexible data like recipe instructions. Includes computed fields for stock status and cost calculations.

### Development Architecture
**Build System**: **Vite** for fast development and optimized production builds with React plugins and runtime error handling.

**TypeScript**: Strict TypeScript configuration with path aliases for clean imports and comprehensive type safety across the entire stack.

**Shared Types**: Common schema definitions and types shared between client and server through a dedicated shared module, ensuring consistency across the full stack.

## External Dependencies

### Database & ORM
- **PostgreSQL**: Primary database with **Neon Database** serverless hosting
- **Drizzle ORM**: Type-safe database operations and migrations
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### Frontend Libraries
- **React Query (@tanstack/react-query)**: Server state management and caching
- **React Hook Form**: Form handling with **@hookform/resolvers** for validation
- **shadcn/ui + Radix UI**: Comprehensive component library for professional interfaces
- **Wouter**: Lightweight routing solution
- **date-fns**: Date manipulation and formatting utilities

### UI & Styling
- **TailwindCSS**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **Lucide React**: Modern icon library
- **embla-carousel-react**: Carousel/slider components

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Language and type system
- **ESBuild**: Fast JavaScript bundler for production builds
- **Replit Integration**: Development environment plugins and runtime error handling

### Validation & Utilities
- **Zod**: Runtime type validation and schema parsing
- **drizzle-zod**: Bridge between Drizzle schemas and Zod validation
- **clsx + tailwind-merge**: Conditional CSS class management
- **nanoid**: Unique ID generation