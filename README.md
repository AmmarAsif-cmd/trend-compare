# TrendArc - Intelligent Trend Comparison Platform

> Your trend intelligence dashboard. Compare what's hot across movies, music, games, products, tech, and more with multi-source data and AI insights.

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.18-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

## ✨ Features

- 🔍 **Multi-Source Data Integration**: YouTube, TMDB (Movies), Spotify (Music), Steam (Games), Best Buy (Products)
- 🤖 **AI-Powered Category Detection**: Automatically detects whether you're comparing movies, music, games, products, or tech
- 📊 **Google Trends Integration**: Real-time search interest data
- 💡 **AI Insights**: Context-aware analysis powered by Claude 3.5 Haiku
- 🎯 **Smart Trending Algorithm**: Quality-filtered trending comparisons
- 📈 **TrendArc Score**: Weighted algorithm combining search interest, social buzz, authority, and momentum
- 🌍 **Geographic & Timeframe Filters**: Compare trends by region and time period
- ⚡ **Performance Optimized**: Caching, rate limiting, and efficient database queries
- 🔒 **Security First**: Input validation, profanity filtering, rate limiting, CORS protection

## 🚀 Tech Stack

- **Framework**: Next.js 16.0.7 (App Router, Turbopack)
- **Language**: TypeScript 5 (strict mode)
- **Database**: PostgreSQL + Prisma ORM
- **AI**: Anthropic Claude 3.5 Haiku
- **Styling**: Tailwind CSS 4
- **Charts**: Chart.js + react-chartjs-2
- **Testing**: Vitest + React Testing Library
- **Validation**: leo-profanity, is-url-superb

## 📋 Prerequisites

- Node.js 20+ and npm
- PostgreSQL database (local or cloud like Neon, Supabase, etc.)
- Anthropic API key (required for AI features)
- Optional API keys for enhanced data sources (Spotify, TMDB, Steam, etc.)

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/trend-compare.git
cd trend-compare
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file and configure your variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Required
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
TRENDS_MODE=google

# Required for AI features
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional - Multi-source data (the more you add, the richer the data!)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
TMDB_API_KEY=your_tmdb_api_key
STEAM_API_KEY=your_steam_api_key
BESTBUY_API_KEY=your_bestbuy_api_key
GITHUB_TOKEN=your_github_token
NEWS_API_KEY=your_newsapi_key
```

#### Getting API Keys

| Service | Sign Up Link | Free Tier | Used For |
|---------|-------------|-----------|----------|
| **Anthropic** | [console.anthropic.com](https://console.anthropic.com/) | $5 credit | AI category detection & insights |
| **Spotify** | [developer.spotify.com](https://developer.spotify.com/dashboard) | Yes | Music artist data |
| **TMDB** | [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) | Yes | Movies & TV shows data |
| **Steam** | [steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey) | Yes | Gaming data |
| **Best Buy** | [developer.bestbuy.com](https://developer.bestbuy.com/) | Yes | Product data |
| **GitHub** | [github.com/settings/tokens](https://github.com/settings/tokens) | Yes | Tech/developer data |
| **NewsAPI** | [newsapi.org](https://newsapi.org) | 100 req/day | Real-time news events |

### 4. Database Setup

Generate Prisma client and run migrations:

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Optional: View database in Prisma Studio
npx prisma studio
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## 📦 Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

For detailed deployment instructions, see the [Vercel Deployment Guide](./docs/deployment/VERCEL_DEPLOYMENT_GUIDE.md).

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) folder:

- **[📖 Documentation Index](./docs/README.md)** - Complete documentation overview
- **[🚀 Deployment Guides](./docs/deployment/)** - Production deployment instructions
- **[⚙️ Setup Guides](./docs/setup/)** - Configuration and setup instructions
- **[✨ Features](./docs/features/)** - Feature documentation
- **[🔧 Troubleshooting](./docs/troubleshooting/)** - Common issues and solutions
- **[💻 Development](./docs/development/)** - Development guides and workflows

**Quick Links:**
- [Quick Start Guide](./docs/setup/QUICK_START.md)
- [Local Setup](./docs/setup/LOCAL_SETUP_GUIDE.md)
- [Vercel Deployment](./docs/deployment/VERCEL_DEPLOYMENT_GUIDE.md)
- [Troubleshooting](./docs/troubleshooting/)

### Environment Variables in Vercel

Go to Project Settings → Environment Variables and add all variables from `.env.local`.

**Important**: Make sure to add `DATABASE_URL` and `ANTHROPIC_API_KEY` at minimum.

### Database Migration on Deploy

The build script automatically runs migrations:

```json
"build": "node scripts/migrate-if-db-available.js && next build"
```

## 📊 Project Structure

```
trend-compare/
├── app/                      # Next.js App Router pages
│   ├── api/                 # API routes
│   ├── compare/[slug]/      # Comparison pages
│   └── page.tsx             # Homepage
├── components/              # React components
│   ├── AI/                  # AI insights components
│   ├── HeroSection.tsx      # Landing page hero
│   └── ...
├── lib/                     # Core business logic
│   ├── ai-category-detector.ts      # AI-powered category detection
│   ├── smart-category-detector.ts   # API-based category detection
│   ├── intelligent-comparison.ts    # Main comparison orchestration
│   ├── trendarc-score.ts           # Scoring algorithm
│   ├── sources/                    # API adapters
│   │   ├── youtube.ts
│   │   ├── spotify.ts
│   │   ├── tmdb.ts
│   │   └── ...
│   └── topThisWeek.ts              # Trending comparisons logic
├── prisma/
│   └── schema.prisma        # Database schema
├── middleware.ts            # Rate limiting, CORS
└── package.json
```

## 🎯 Key Features Explained

### AI Category Detection

The system uses a two-tier approach:
1. **AI Detection** (Claude 3.5 Haiku): Fast, context-aware classification
2. **API Probing** (Fallback): Queries all APIs to detect category if AI is uncertain

Categories supported: `music`, `movies`, `games`, `products`, `tech`, `people`, `brands`, `places`, `general`

### TrendArc Scoring Algorithm

Each comparison gets a 0-100 score based on:
- **Search Interest** (40%): Google Trends data
- **Social Buzz** (30%): YouTube views & engagement
- **Authority** (20%): TMDB ratings, Steam reviews, etc.
- **Momentum** (10%): Growth rate over time

### Quality Filtering

Trending comparisons are filtered to exclude:
- Test/demo terms (sample, test, demo, etc.)
- Single characters or pure numbers
- Gibberish patterns
- Low view counts (< 2 views)

## 🔒 Security Features

- **Rate Limiting**: 40 requests/minute per IP
- **Input Validation**: Length limits, character whitelisting
- **Profanity Filtering**: Using leo-profanity
- **URL Blocking**: Prevents URL injection
- **CORS Protection**: Configured allowlist
- **SQL Injection Prevention**: Prisma ORM parameterized queries

## 📈 Performance Optimizations

- **Caching**: Comparison results cached for 1 hour
- **Database Indexing**: Optimized queries with proper indexes
- **Turbopack**: Fast development builds
- **Edge Functions**: For real-time trending data
- **Unstable Cache**: Next.js caching for trending comparisons

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Test database connection
npx prisma db pull
```

### Prisma Client Not Generated

```bash
npx prisma generate
```

### Environment Variables Not Loading

- Ensure `.env.local` exists in root directory
- Restart dev server after changing env vars
- Check for typos in variable names

### AI Detection Returns "general" for Everything

- Verify `ANTHROPIC_API_KEY` is set correctly
- Check API key has sufficient credits
- Review logs for detailed error messages

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review error logs in console

---

**Built with ❤️ using Next.js and TypeScript**
