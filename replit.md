# TrendArc

## Overview

TrendArc is a Next.js application that compares keyword popularity trends using data from multiple sources (Google Trends, Reddit, Wikipedia) and generates AI-powered insights using Claude. Users can compare any two topics side-by-side with interactive charts, get data-driven analysis, and explore trending comparisons. The system also includes an auto-generating blog system that creates SEO-optimized content from popular comparisons.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS v4 with custom CSS variables for theming
- **Charts**: Chart.js with react-chartjs-2 for trend visualizations
- **Icons**: Lucide React for consistent iconography
- **Testing**: Vitest with React Testing Library and happy-dom

### Backend Architecture
- **API Routes**: Next.js App Router API endpoints under `/app/api/`
- **Database ORM**: Prisma with PostgreSQL
- **AI Integration**: Anthropic Claude SDK for generating insights and blog posts
- **Rate Limiting**: Middleware-based rate limiting (40 requests per minute per IP)

### Core Features
1. **Comparison Engine** (`lib/content-engine.ts`): Orchestrates multi-source data fetching, pattern detection, and narrative generation
2. **Intelligent Comparison System** (`lib/intelligent-comparison.ts`): Multi-source comparison with TrendArc Score algorithm
   - **Category Detection** (`lib/category-resolver.ts`): Detects if comparing movies, products, tech, people, etc.
   - **TrendArc Score** (`lib/trendarc-score.ts`): Weighted composite scoring (0-100) combining multiple data sources
   - **Data Adapters** (`lib/sources/adapters/`): YouTube, TMDB, Reddit adapters for category-specific data
3. **TrendArc Verdict** (`components/ComparisonVerdict.tsx`): Displays winner/loser with scores, confidence, and actionable recommendations
4. **Insights System** (`lib/insights/`): Statistical analysis including z-scores, regression, spike detection, and temporal analysis
5. **Blog System**: Auto-generates SEO-optimized blog posts from trending comparisons using Claude Haiku
6. **Caching**: Comparisons are stored in PostgreSQL with data hashing to avoid redundant API calls

### Data Flow
1. User submits comparison request
2. System checks database for cached results
3. If not cached or stale, fetches from Google Trends API (primary) with fallback to Reddit/Wikipedia
4. Runs statistical analysis and generates AI insights
5. Stores results in database and returns to user

### Authentication
- Simple admin authentication for blog dashboard
- HTTP-only cookies for session management
- Rate limiting on login attempts (5 per 15 minutes)

### Security
- Content Security Policy headers configured in `next.config.ts`
- CORS allowlist for specific domains
- Input validation and sanitization for search terms (`lib/validateTerms.ts`)

## External Dependencies

### APIs & Services
- **Google Trends API**: Primary data source for search interest trends (via `google-trends-api` npm package)
- **Anthropic Claude API**: AI-powered insights and blog post generation (Claude Haiku for cost efficiency)
- **Reddit API**: Fallback data source for social engagement metrics
- **Wikipedia API**: Fallback for knowledge interest data
- **Sentry**: Error monitoring and tracking (`@sentry/nextjs`)

### Database
- **PostgreSQL**: Primary database via Prisma ORM
- **Tables**: Comparisons, BlogPosts, AIInsightUsage (for budget tracking)

### Key NPM Packages
- `@prisma/client`: Database ORM
- `@anthropic-ai/sdk`: Claude AI integration
- `google-trends-api`: Google Trends data fetching
- `react-markdown`: Markdown rendering for blog posts
- `slugify`: URL slug generation
- `leo-profanity`: Content moderation