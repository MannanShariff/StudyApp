# Overview

StudyApp is a full-stack AI-powered study platform built with React and Express. The application allows users to create and manage notes, query multiple AI models simultaneously (OpenAI, Gemini, Grok, DeepSeek), and get AI explanations for selected text. It features a modern UI built with shadcn/ui components and Tailwind CSS.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: TanStack Query for server state management
- **Form Handling**: React Hook Form with Zod validation

**Component Structure**:
- Modular component architecture with reusable UI components
- Feature-based components (notes editor, AI search, API settings)
- Custom hooks for API key management and mobile detection

## Backend Architecture

**Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints for notes CRUD operations and AI interactions
- **Development Setup**: Development server with Vite integration and hot reload
- **Error Handling**: Centralized error handling middleware

**Key Services**:
- Storage abstraction layer with in-memory implementation
- AI service integration supporting multiple providers
- Request/response logging and monitoring

## Data Storage Solutions

**Database**: PostgreSQL with Drizzle ORM
- **Schema Definition**: Shared schema definitions between client and server
- **Migrations**: Drizzle Kit for database migrations
- **Connection**: Neon Database serverless connection
- **Validation**: Zod schemas for runtime type checking

**Current Implementation**: In-memory storage for development with database schema ready for production

## Authentication and Authorization

Currently no authentication system is implemented. The application uses a basic storage interface that could be extended with user authentication in the future.

## External Service Integrations

**AI Providers**:
- OpenAI API integration
- Google Gemini API integration
- Support for additional AI providers (Grok, DeepSeek)
- Multi-provider querying with error handling

**Session Management**:
- API keys stored in browser session storage
- Client-side API key management and testing

**Development Tools**:
- Replit integration with development plugins
- Runtime error overlay for development
- Cartographer and dev banner plugins for Replit environment

# External Dependencies

## Core Framework Dependencies
- **React 18**: Frontend framework with TypeScript support
- **Express**: Backend web framework
- **Vite**: Frontend build tool and development server
- **Drizzle ORM**: Database ORM with PostgreSQL support
- **TanStack Query**: Server state management library

## UI and Styling
- **shadcn/ui**: Component library built on Radix UI
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Headless UI component primitives
- **Lucide React**: Icon library

## AI Services
- **@google/genai**: Google Gemini AI integration
- **OpenAI**: OpenAI API client (implied from usage)

## Development and Build Tools
- **TypeScript**: Type safety across the stack
- **ESBuild**: Fast JavaScript bundler for production
- **PostCSS**: CSS processing with Tailwind
- **Drizzle Kit**: Database migration and schema management

## Database and Storage
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **connect-pg-simple**: PostgreSQL session store (configured but not actively used)

## Validation and Forms
- **Zod**: Runtime type validation and schema definition
- **React Hook Form**: Form state management
- **@hookform/resolvers**: Form validation resolvers

## Utility Libraries
- **date-fns**: Date manipulation and formatting
- **jsPDF**: PDF generation for note exports
- **clsx**: Conditional CSS class management
- **nanoid**: Unique ID generation