# AI Sentiment Analysis Application

## Overview

This is an AI-powered sentiment analysis web application built for Interswitch that analyzes customer feedback to extract emotional insights, sentiment scores, and actionable recommendations. The application uses OpenAI's GPT-5 model to perform natural language processing on customer feedback, providing comprehensive sentiment analysis including emotion detection, confidence scoring, and priority-based insights.

## Recent Changes

**December 4, 2025 - Replit Environment Setup**
- Imported from GitHub and configured for Replit environment
- Installed all npm dependencies
- Configured OpenAI integration with GPT-5 model (updated from GPT-4o)
- Set up workflow for development server on port 5000
- Configured deployment for autoscale production hosting
- Verified frontend and backend are running correctly
- Made drizzle.config.ts optional (app is stateless, no database needed)

**December 4, 2025 - Vercel Deployment Setup**
- Created api/index.ts serverless function for Vercel
- Created vercel.json configuration for API routing and SPA support
- Added build:vercel script for Vercel-compatible frontend build
- Updated vite.config.ts to conditionally load Replit plugins only in Replit environment
- App can now be deployed to both Replit (traditional server) and Vercel (serverless)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR (Hot Module Replacement)
- Wouter for lightweight client-side routing
- Single Page Application (SPA) architecture with a main entry point at `client/src/main.tsx`

**UI Component System**
- Shadcn UI component library (New York style variant) for consistent, accessible components
- Radix UI primitives for headless, accessible component foundations
- Tailwind CSS for utility-first styling with custom design tokens
- Component path aliases configured for clean imports (`@/components`, `@/lib`, etc.)

**Design System**
- Custom CSS variables for theming (supports light/dark modes)
- Consistent spacing units (4, 6, 8, 12, 16, 20, 24)
- Typography hierarchy using Inter font family
- Modern data analysis tool aesthetic inspired by Linear and Notion
- Color system based on HSL values with teal accent (#0D9488)

**State Management**
- TanStack Query (React Query) for server state management and API caching
- React Hook Form with Zod resolvers for form validation
- Local component state for UI interactions
- Custom hooks for reusable logic (e.g., `use-mobile`, `use-toast`)

### Backend Architecture

**Server Framework**
- Express.js as the HTTP server framework
- ES Modules (type: "module") for modern JavaScript imports
- TypeScript throughout for type safety
- HTTP server created with Node's built-in `http` module

**API Design**
- RESTful API with single POST endpoint: `/api/analyze`
- Request/response validation using Zod schemas
- JSON-based communication
- Error handling with appropriate HTTP status codes
- Request logging middleware for debugging and monitoring

**Build & Deployment Strategy**
- Separate build processes for client (Vite) and server (esbuild)
- Client builds to `dist/public`, server bundles to `dist/index.cjs`
- Server dependencies allowlisted for bundling to optimize cold starts
- Production mode uses bundled CommonJS output for better performance

**Validation Layer**
- Shared Zod schemas between client and server (`shared/schema.ts`)
- Type-safe request/response contracts
- Runtime validation on API endpoints
- Sample feedback data for testing

### Data Storage

**Current Implementation**
- In-memory storage implementation (`MemStorage` class)
- Stateless API design - each analysis request is independent
- No persistent database currently in use for sentiment analysis results

### External Dependencies

**AI/ML Services**
- OpenAI API (GPT-5 model) for sentiment analysis
- Configured via `OPENAI_API_KEY` environment variable
- Structured prompts for consistent JSON response format
- Analyzes: sentiment type, sentiment score, confidence, emotions, insights, and summary

**UI Component Libraries**
- Radix UI: Comprehensive collection of unstyled, accessible components
- Embla Carousel: Touch-friendly carousel component
- CMDK: Command palette component for future features
- Lucide React: Icon library for consistent iconography

**Development Tools**
- Replit-specific plugins for development experience
  - Runtime error overlay for better debugging
  - Cartographer for code navigation
  - Dev banner for development mode indication

**Styling & Utilities**
- Tailwind CSS with PostCSS for processing
- class-variance-authority (CVA) for variant-based component styling
- clsx and tailwind-merge for conditional class handling
- date-fns for date formatting and manipulation

**Type Safety & Validation**
- Zod for runtime schema validation
- TypeScript for compile-time type checking
- Shared type definitions between frontend and backend

## Key Features

1. **AI-Powered Sentiment Analysis**: Uses OpenAI GPT-5 to analyze customer feedback
2. **Emotion Detection**: Extracts specific emotions (joy, frustration, satisfaction, etc.) with intensity scores
3. **Actionable Insights**: Generates priority-based recommendations based on feedback
4. **Clean Professional Interface**: Teal-accented design matching Interswitch branding
5. **Quick Sample Buttons**: Pre-loaded sample feedback for testing
6. **Character Counter**: Real-time feedback length tracking
7. **Loading States**: Smooth animations during analysis
8. **Error Handling**: Robust error messages with retry support

## API Endpoint

### POST /api/analyze

**Request:**
```json
{
  "feedback": "Customer feedback text here"
}
```

**Response:**
```json
{
  "sentiment": "positive" | "negative" | "neutral",
  "sentimentScore": 0-100,
  "confidence": 0-100,
  "emotions": [{"name": "joy", "intensity": 85}],
  "insights": [{"text": "Action item", "priority": "high"}],
  "summary": "Brief summary"
}
```
