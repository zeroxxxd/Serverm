# Replit.md - Minecraft AFK Bot Dashboard

## Overview

This is a full-stack web application for managing a Minecraft AFK bot. It consists of a React frontend with shadcn/ui components and an Express.js backend with WebSocket support. The application allows users to monitor, control, and configure a Minecraft bot that can stay connected to servers automatically.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and bundling
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom Discord-inspired theme
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Real-time**: WebSocket integration for live updates

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket server for bidirectional communication
- **Bot Integration**: Mineflayer library for Minecraft bot functionality
- **Session Management**: Express sessions with PostgreSQL store

## Key Components

### Database Schema (Drizzle ORM)
- **users**: User authentication and management
- **servers**: Minecraft server configurations
- **botConfig**: Bot settings and preferences
- **chatLogs**: Chat message history from servers
- **botStats**: Bot performance and uptime statistics
- **activityLogs**: System activity and event logging

### Bot Management System
- **BotManager**: Core service for controlling the Minecraft bot
- **BotConfigManager**: Handles bot configuration and settings
- **Storage Layer**: Abstracts database operations with in-memory fallback

### Frontend Pages
- **Dashboard**: Main overview with status cards and activity monitoring
- **Bot Control**: Start/stop bot and view real-time status
- **Servers**: Manage Minecraft server connections
- **Chat Logs**: View and search chat history
- **Configuration**: Bot settings and preferences
- **Analytics**: Performance metrics and statistics

## Data Flow

1. **User Interactions**: Frontend components trigger API calls through TanStack Query
2. **API Layer**: Express routes handle HTTP requests and business logic
3. **Bot Operations**: BotManager coordinates with Mineflayer for Minecraft operations
4. **Database**: Drizzle ORM manages PostgreSQL data persistence
5. **Real-time Updates**: WebSocket broadcasts status changes to connected clients
6. **State Synchronization**: React Query automatically updates UI with fresh data

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **mineflayer**: Minecraft bot functionality (referenced in legacy code)
- **drizzle-orm**: TypeScript ORM for database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Headless UI components foundation
- **tailwindcss**: Utility-first CSS framework

### Development Tools
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution for development
- **esbuild**: Fast bundler for production builds

## Deployment Strategy

### Build Process
1. **Frontend**: Vite builds React app to `dist/public`
2. **Backend**: esbuild bundles server code to `dist/index.js`
3. **Database**: Drizzle Kit manages schema migrations

### Production Setup
- **Environment**: NODE_ENV=production
- **Database**: PostgreSQL with connection pooling
- **Static Files**: Express serves built frontend from `dist/public`
- **Process Management**: Single Node.js process handles both API and static serving

### Development Workflow
- **Hot Reloading**: Vite HMR for frontend, tsx watch for backend
- **Database**: Drizzle Kit for schema changes (`db:push` command)
- **Type Safety**: Shared types between frontend and backend via `@shared` imports

### Key Configuration Files
- **drizzle.config.ts**: Database connection and migration settings
- **vite.config.ts**: Frontend build configuration with path aliases
- **tsconfig.json**: TypeScript configuration with path mapping
- **tailwind.config.ts**: Styling configuration with custom theme

The application uses a monorepo structure with shared TypeScript definitions, enabling type-safe communication between frontend and backend components.