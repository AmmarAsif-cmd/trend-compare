# Comparison Page API Refactor

## ✅ Implementation Complete

Comparison page data loading has been refactored into 3 endpoints for better performance and separation of concerns.

## 📁 Files Created

1. **`app/api/comparison/core/route.ts`** - Core data endpoint
2. **`app/api/comparison/premium/route.ts`** - Premium insights endpoint
3. **`app/api/comparison/deepdive/route.ts`** - Deep dive metrics endpoint
4. **`app/api/comparison/warmup/route.ts`** - Background warmup job endpoint

## 🎯 Endpoint Overview

### 1. GET /api/comparison/core

**Purpose:** Fast, immediate data for initial render

**Returns:**
- Basic comparison data (series, terms, stats)
- Core metrics (shares, totals, averages)
- Category, view count, timestamps

**Features:**
- ✅ Cacheable (10 min cache, 1 hour stale)
- ✅ Fast (no heavy computations)
- ✅ Public access (no premium required)

**Example:**
```typescript
GET /api/comparison/core?slug=taylor-swift-vs-beyonce&tf=12m&geo=
```

**Response:**
```json
{
  "slug": "taylor-swift-vs-beyonce",
  "terms": ["Taylor Swift", "Beyonce"],
  "timeframe": "12m",
  "geo": "",
  "series": [...],
  "stats": {
    "termA": { "total": 1000, "share": 55, "average": 50 },
    "termB": { "total": 800, "share": 45, "average": 40 }
  },
  "category": "music",
  "viewCount": 1234,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### 2. GET /api/comparison/premium

**Purpose:** Premium insights (InsightsPack, forecasts, AI insights)

**Returns:**
- InsightsPack (signals, interpretations, decision guidance)
- Forecast bundle (if cached)
- AI insights (if cached)
- needsWarmup flag

**Features:**
- ✅ Premium access required (server-side enforcement)
- ✅ Rate limited (20 req/min per user)
- ✅ Never blocks on AI generation (only reads cached)
- ✅ Triggers background warmup if needsWarmup is true

**Example:**
```typescript
GET /api/comparison/premium?slug=taylor-swift-vs-beyonce&tf=12m&geo=
```

**Response:**
```json
{
  "insightsPack": {
    "version": "1",
    "slug": "taylor-swift-vs-beyonce",
    "signals": [...],
    "interpretations": [...],
    "decisionGuidance": {...},
    "forecasts": {...},
    "peaks": {...},
    "aiInsights": {...}
  },
  "needsWarmup": false
}
```

### 3. GET /api/comparison/deepdive

**Purpose:** Heavy metrics and breakdown tables

**Returns:**
- Multi-source breakdown
- Geographic breakdown
- Detailed statistics
- Performance metrics

**Features:**
- ✅ Rate limited (10 req/min per user)
- ✅ Can be expensive to compute
- ✅ Cacheable (10 min cache, 1 hour stale)

**Example:**
```typescript
GET /api/comparison/deepdive?slug=taylor-swift-vs-beyonce&tf=12m&geo=
```

**Response:**
```json
{
  "breakdown": {
    "scores": {
      "termA": {...},
      "termB": {...}
    },
    "sources": ["Google Trends", "YouTube", "Spotify"],
    "category": "music"
  },
  "geographic": {...},
  "performance": {...}
}
```

### 4. POST /api/comparison/warmup

**Purpose:** Background job to warmup AI insights and forecasts

**Features:**
- ✅ Secured with secret header (`X-Warmup-Secret`)
- ✅ Prevents duplicate warmup jobs
- ✅ Fire-and-forget (async)

**Example:**
```typescript
POST /api/comparison/warmup
Headers: { "X-Warmup-Secret": "your-secret" }
Body: { "slug": "taylor-swift-vs-beyonce", "dataHash": "..." }
```

## 🔒 Security & Access Control

### Premium Endpoint
- ✅ Server-side premium check via `canAccessPremium()`
- ✅ Returns 403 if not premium
- ✅ Rate limited (20 req/min per user)

### Deep Dive Endpoint
- ✅ Rate limited (10 req/min per user)
- ✅ No premium requirement (but can be expensive)

### Warmup Endpoint
- ✅ Secured with `X-Warmup-Secret` header
- ✅ Must match `WARMUP_SECRET` env variable
- ✅ Prevents duplicate jobs (5 min TTL)

## ⚡ Performance

### Core Endpoint
- **Cache:** 10 minutes fresh, 1 hour stale
- **Speed:** < 100ms (no heavy computations)
- **Public:** No authentication required

### Premium Endpoint
- **Cache:** 5 minutes fresh, 30 minutes stale
- **Speed:** < 500ms (only reads cached AI)
- **Never blocks:** Only returns cached AI insights

### Deep Dive Endpoint
- **Cache:** 10 minutes fresh, 1 hour stale
- **Speed:** 1-3 seconds (heavy computations)
- **Rate limited:** Prevents abuse

## 🔄 Warmup Flow

1. **Premium endpoint** checks if `needsWarmup` is true
2. If true, triggers background warmup job (async)
3. **Warmup job** generates missing forecasts/AI insights
4. Results are cached for future requests
5. Next request returns cached data

## 📊 Rate Limiting

### Premium Endpoint
- **Limit:** 20 requests per minute per user
- **Window:** 60 seconds
- **Storage:** In-memory (can be moved to Redis)

### Deep Dive Endpoint
- **Limit:** 10 requests per minute per user
- **Window:** 60 seconds
- **Storage:** In-memory (can be moved to Redis)

## 🎯 Usage in Frontend

### Initial Load
```typescript
// 1. Load core data (fast)
const coreData = await fetch(`/api/comparison/core?slug=${slug}&tf=${timeframe}&geo=${geo}`);

// 2. Load premium insights (if premium user)
if (hasPremium) {
  const premiumData = await fetch(`/api/comparison/premium?slug=${slug}&tf=${timeframe}&geo=${geo}`);
  
  // 3. Trigger warmup if needed
  if (premiumData.needsWarmup) {
    // Warmup triggered automatically by endpoint
  }
}

// 3. Load deep dive (on demand, e.g., when user expands section)
const deepDive = await fetch(`/api/comparison/deepdive?slug=${slug}&tf=${timeframe}&geo=${geo}`);
```

## 🔧 Environment Variables

```env
# Warmup secret (for background job security)
WARMUP_SECRET=your-secret-here

# App URL (for warmup job trigger)
NEXT_PUBLIC_APP_URL=https://trendarc.net
```

## ✅ Requirements Checklist

- [x] Core endpoint returns immediate data for fast render
- [x] Premium endpoint returns InsightsPack
- [x] Premium endpoint returns forecast bundle if cached
- [x] Premium endpoint returns AI insights if cached
- [x] Premium endpoint returns needsWarmup flag
- [x] Premium endpoints enforce premium access server-side
- [x] Rate limiting on premium and deepdive endpoints
- [x] Core endpoint is cacheable and fast
- [x] Premium endpoint never blocks on AI generation
- [x] Background warmup job triggered if needsWarmup true
- [x] Warmup job is secured

---

**Status**: ✅ Complete - Three endpoints with proper separation, caching, and security

