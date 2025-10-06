# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common Development Commands

### Core Development
- `npm run dev` - Start development server (runs both frontend and backend on port 5000)
- `npm run build` - Build for production (frontend + backend bundle)
- `npm start` - Run production server
- `npm run check` - TypeScript type checking

### Database Operations
- `npm run db:push` - Push database schema changes using Drizzle

### Testing Individual Components
- Run single test files using `tsx` directly: `npx tsx server/routes.ts`
- Test API endpoints using curl or similar tools against `http://localhost:5000/api/`

## Architecture Overview

### Monorepo Structure
This is a full-stack TypeScript application using a monorepo structure with three main directories:

**`/client`** - React frontend using Vite
- SPA with React 18, TypeScript, TailwindCSS, Radix UI
- Uses Wouter for client-side routing (not React Router)
- State management via TanStack React Query
- Component-based architecture with custom hooks

**`/server`** - Express.js backend
- Express server with TypeScript
- Handles both API routes and serves static frontend in production
- Session-based authentication with JWT tokens
- File upload handling with Multer

**`/shared`** - Common schemas and types
- Drizzle ORM schema definitions for PostgreSQL
- Zod validation schemas shared between client and server
- TypeScript type exports

### Key Architectural Patterns

**Hybrid Storage System**: Currently uses in-memory storage (`MemStorage`) for development, with PostgreSQL schema defined for production. The `IStorage` interface abstracts storage operations.

**Multi-AI Integration**: Parallel API calls to multiple AI providers (OpenAI, Gemini, Grok, DeepSeek) via OpenRouter and direct APIs. All AI calls use Promise.race with timeouts for reliability.

**Session + JWT Authentication**: Hybrid auth system using both Express sessions and JWT tokens. API keys are stored both in user sessions and database.

**PDF Processing Pipeline**: Upload → Parse with pdf-parse → Extract text → Create note. Includes fallback handling for parsing failures.

## Development Setup Notes

### Path Aliases
- `@/*` maps to `./client/src/*`
- `@shared/*` maps to `./shared/*`
- `@assets/*` maps to `./attached_assets/*`

### Environment Variables
All AI API keys are optional and can be configured in the application UI:
- `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROK_API_KEY`, `DEEPSEEK_API_KEY`
- `DATABASE_URL` - PostgreSQL connection string (required for production)
- `JWT_SECRET` - Secret for JWT token signing

### AI Provider Configuration
- **OpenAI**: Uses OpenRouter with model `openai/gpt-oss-20b:free`
- **Gemini**: Direct Google API with `gemini-1.5-flash`
- **Grok**: OpenRouter with model `x-ai/grok-4-fast:free`
- **DeepSeek**: OpenRouter with model `deepseek/deepseek-chat-v3.1:free`

All AI calls implement 10-15 second timeouts and parallel execution for performance.

### Key Files to Understand

**`server/routes.ts`** - Main API route definitions including:
- CRUD operations for notes
- Multi-provider AI query endpoint (`/api/ai/query`)
- Text explanation endpoint (`/api/ai/explain`)
- PDF upload and parsing (`/api/upload-pdf`)

**`shared/schema.ts`** - Database schema and validation:
- Drizzle ORM table definitions
- Zod schemas for request/response validation
- TypeScript type exports

**`server/storage.ts`** - Storage abstraction layer:
- `IStorage` interface for storage operations
- `MemStorage` implementation for development
- Designed for easy PostgreSQL integration

### Frontend Architecture
- **React Query** for server state management and caching
- **Radix UI** components with custom styling
- **TailwindCSS** with custom configuration
- **Custom hooks** in `/hooks` for reusable logic (auth, API keys, mobile detection)

### Deployment Configuration
- **Vercel**: Configured via `vercel.json` for serverless deployment
- **Production Build**: Frontend builds to `/dist/public`, backend bundles with esbuild
- **API Routing**: All `/api/*` routes handled by `api/[...path].ts` serverless function

## Important Implementation Details

### AI Integration Reliability
All AI API calls use `Promise.race` with timeout handling and error recovery. The system is designed to handle partial failures gracefully - if some AI providers fail, others continue working.

### PDF Processing Fallback
PDF parsing includes comprehensive error handling with mock content generation if `pdf-parse` fails, ensuring the application remains functional even with PDF parsing issues.

### Authentication Flow
The system supports both authenticated and unauthenticated usage. API keys can be provided per request or stored in user accounts. Authentication state is managed through HTTP-only cookies and JWT tokens.

### Development vs Production
- Development: Uses memory storage, Vite dev server, and development plugins
- Production: Uses PostgreSQL (when configured), serves static files, and runs as a single Express server

### File Upload Constraints
- PDF files only, 10MB limit
- Uses memory storage for serverless compatibility
- Automatic text extraction with fallback content generation