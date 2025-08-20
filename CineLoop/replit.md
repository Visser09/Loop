# CineLoop - Social Platform for Movies & TV

## Overview

CineLoop is a social media platform for movie and TV enthusiasts, featuring an Instagram-style mobile interface with AI-powered content discovery. Users can post, discuss, and bookmark titles while receiving personalized recommendations through conversational AI. The platform combines social networking features with intelligent content curation to help users discover and share their entertainment preferences.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety and component-based development
- **Styling**: Tailwind CSS with custom design system implementing dark theme with gold/blue accent colors
- **UI Components**: Radix UI primitives with shadcn/ui components for consistent, accessible interface elements
- **Routing**: Wouter for lightweight client-side routing between pages (home, search, create, profile, title details)
- **State Management**: TanStack Query for server state management and caching, React hooks for local state
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Database ORM**: Drizzle ORM for type-safe database operations and schema management
- **Session Management**: Express sessions with PostgreSQL storage for user authentication state
- **Authentication**: OpenID Connect integration with Replit Auth for secure user login
- **API Design**: RESTful endpoints following resource-based URL patterns (/api/feed, /api/titles, etc.)

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **Schema Design**: Relational model with tables for users, titles, posts, interactions, follows, lists, recommendations, and reports
- **Session Storage**: Dedicated sessions table for authentication state persistence
- **Database Migrations**: Drizzle Kit for schema versioning and database updates

### Authentication and Authorization
- **Provider**: Replit OpenID Connect for seamless authentication within Replit environment
- **Session Strategy**: Server-side session storage with secure HTTP-only cookies
- **Authorization**: Middleware-based route protection requiring authentication for API endpoints
- **User Management**: Automatic user creation/updates on successful authentication

### External Dependencies
- **Database Hosting**: Neon PostgreSQL serverless platform for scalable data storage
- **Authentication Service**: Replit OIDC provider for user identity management
- **Movie/TV Data**: Integration points for external APIs (TMDB suggested) for title metadata
- **AI Services**: Placeholder endpoints for AI-powered recommendation engine
- **Image Storage**: External CDN integration for poster images and user-uploaded media

The architecture supports a mobile-first social experience with real-time interactions, personalized content feeds, and AI-enhanced discovery features while maintaining scalability and security best practices.