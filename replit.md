# Recipe Management System (PastryPro)

## Overview

PastryPro is a professional recipe management system designed for commercial kitchens and food service operations. The application provides comprehensive tools for managing recipes, ingredients, inventory tracking, cost calculations, and professional kitchen calculators. Built as a full-stack web application, it combines a React frontend with an Express backend and PostgreSQL database to deliver a robust solution for culinary professionals.

## User Preferences

Preferred communication style: Simple, everyday language.

## Authentication

The app uses **session-based authentication** (express-session + connect-pg-simple).

- **Default admin**: username=`admin`, password=`admin123` — **change this after first login!**
- All users have their own private data (recipes, ingredients, categories, production plans)
- Roles: `user` (employee) and `admin`
- Admin can: create/edit/delete users, see all accounts
- Sessions last 7 days; stored in the `session` PostgreSQL table

### Auth Endpoints
- `POST /api/auth/login` — login
- `POST /api/auth/register` — self-register
- `POST /api/auth/logout` — logout
- `GET /api/auth/me` — current user info
- `GET /api/admin/users` — list all users (admin only)
- `POST /api/admin/users` — create user (admin only)
- `PUT /api/admin/users/:id` — update user (admin only)
- `DELETE /api/admin/users/:id` — delete user (admin only)

## System Architecture

### Frontend Architecture
The client-side is built with **React 18** using modern TypeScript patterns and hooks-based state management. The UI leverages **shadcn/ui** components with **Radix UI** primitives for accessible, professional-grade interface elements. **TailwindCSS** provides utility-first styling with a custom design system featuring neutral base colors and primary green/secondary yellow accent colors.

**State Management**: Uses **TanStack Query (React Query)** for server state management, caching, and data synchronization. Auth state lives in `AuthContext` via `client/src/hooks/use-auth.tsx`. Local component state is managed with React hooks.

**Routing**: Implemented with **Wouter** for lightweight client-side routing. The `ProtectedRouter` in `App.tsx` shows the login page automatically when not authenticated. Pages: dashboard, recipes, ingredients, calculators, inventory management, admin.

**Performance**: The recipes page uses **virtual scrolling** (custom hook) to render only visible rows, supporting 1000+ recipes smoothly.

**Component Structure**: Follows a modular architecture with reusable UI components, feature-specific components (calculators, cards), and page-level components organized in a logical hierarchy.

### Backend Architecture
The server is built with **Express.js** and follows RESTful API design principles. The application uses a layered architecture separating routing, business logic, and data access.

**Authentication Middleware**: `server/auth.ts` provides `requireAuth` and `requireAdmin` middleware applied to all API routes.

**API Design**: RESTful endpoints organized by resource (recipes, ingredients, categories, inventory) with proper HTTP methods and status codes. All routes (except `/api/auth/*`) require authentication.

**Database Layer**: Uses **Drizzle ORM** with TypeScript-first approach for type-safe database operations and schema management. The storage layer abstracts database operations behind interfaces for better testability and maintainability.

**Middleware**: Implements session handling, request logging, JSON parsing, error handling, and development-specific middleware for hot reloading.

### Database Design
**PostgreSQL** database with a normalized schema supporting:

- **Users**: User management with username/password (bcrypt hashed), role, displayName
- **Categories**: Recipe categorization, scoped per user (userId FK)
- **IngredientCategories**: Ingredient categorization, scoped per user
- **Ingredients**: Comprehensive ingredient data including cost tracking, stock levels, nutritional values, suppliers, expiry dates — scoped per user
- **Recipes**: Full recipe management — scoped per user
- **Recipe-Ingredients**: Many-to-many relationship with quantities and units
- **Inventory Logs**: Transaction tracking for stock movements — scoped per user
- **Production Plans**: Production planning — scoped per user
- **Sessions**: Express session store

**Schema Features**: Uses UUID primary keys, cascade deletes on user removal, proper foreign key relationships, and JSON fields for flexible data like recipe instructions.

### Migration
Run `npx tsx server/migrate.ts` to apply schema changes. The migration:
- Adds userId columns to all data tables
- Creates default admin account (admin/admin123)
- Assigns existing data to admin user

### Development Architecture
**Build System**: **Vite** for fast development and optimized production builds with React plugins and runtime error handling.

**TypeScript**: Strict TypeScript configuration with path aliases for clean imports and comprehensive type safety across the entire stack.

**Shared Types**: Common schema definitions and types shared between client and server through a dedicated shared module, ensuring consistency across the full stack.

## External Dependencies

### Authentication & Security
- **bcryptjs**: Password hashing (12 rounds)
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

### Database & ORM
- **PostgreSQL**: Primary database with **Neon Database** serverless hosting (Replit) or **Render** PostgreSQL
- **Drizzle ORM**: Type-safe database operations and migrations
- Dual driver support: Neon serverless (Replit) vs standard `pg` (Render) — auto-detected in `server/db.ts`

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

### AI Features
- **OpenAI**: AI-powered ingredient auto-fill, recipe chatbot, nutrition calculator
- Uses `process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY` (Replit + Render compatible)
- Chatbot uses `gpt-4o-mini` with compact recipe summaries for efficiency

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
- **jsPDF + html2canvas**: PDF export for production plans

## Render Deployment Notes
- Web Service connected to GitHub repo `tyralaleon4-art/PastryChef`
- Database: `pastrypro-db` (existing, preserved)
- Set `SESSION_SECRET` env var in Render for production security
- Run migration script after deploying schema changes
