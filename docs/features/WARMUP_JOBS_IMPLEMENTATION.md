# Background Warmup Jobs Implementation

## ✅ Implementation Complete

Background warmup jobs have been implemented to precompute and cache expensive outputs with distributed locking, concurrency limits, and comprehensive logging.

## 📁 Files Created

1. **`lib/jobs/warmup-forecasts.ts`** - Nightly forecast refresh job
2. **`lib/jobs/warmup-ai-explanations.ts`** - Weekly AI explanation refresh job
3. **`lib/jobs/warmup-on-demand.ts`** - On-demand warmup job
4. **`lib/jobs/logger.ts`** - Job logging utilities
5. **`lib/jobs/system-ai-context.ts`** - System AI context for background jobs
6. **`app/api/jobs/warmup-forecasts/route.ts`** - Forecast warmup endpoint
7. **`app/api/jobs/warmup-ai-explanations/route.ts`** - AI explanation warmup endpoint
8. **`app/api/comparison/warmup/route.ts`** - On-demand warmup endpoint (updated)
9. **`vercel.json`** - Cron job configuration

## 🎯 Job Overview

### 1. Warmup Forecasts (Nightly)

**Schedule:** Daily at 2:00 AM UTC  
**Purpose:** Refresh forecasts for popular comparisons (last 7 days)  
**Endpoint:** `POST /api/jobs/warmup-forecasts`

**Features:**
- Finds popular comparisons from last 7 days
- Generates forecasts for both terms
- Caches forecasts (7d fresh, 30d stale)
- Uses distributed locking
- Concurrency limit: 5 comparisons at a time
- Processes up to 50 comparisons per run

### 2. Warmup AI Explanations (Weekly)

**Schedule:** Weekly on Sunday at 3:00 AM UTC  
**Purpose:** Refresh AI explanations for popular comparisons  
**Endpoint:** `POST /api/jobs/warmup-ai-explanations`

**Features:**
- Finds popular comparisons (high view count, last 30 days)
- Generates AI insights (meaning explanations, peak explanations)
- Caches AI insights (7d fresh, 30d stale)
- Uses distributed locking
- Concurrency limit: 3 comparisons at a time
- Processes up to 30 comparisons per run

### 3. On-Demand Warmup

**Trigger:** When premium endpoint returns `needsWarmup: true`  
**Purpose:** Generate missing forecasts and AI insights for specific comparison  
**Endpoint:** `POST /api/comparison/warmup`

**Features:**
- Triggered automatically by premium endpoint
- Generates forecasts if missing
- Generates AI insights if missing
- Uses distributed locking per comparison
- Fire-and-forget (returns immediately)
- Never blocks user requests

## 🔒 Security

### Secret Token Authentication
All job endpoints require `X-Job-Secret` or `X-Warmup-Secret` header:
```typescript
const secret = request.headers.get('X-Job-Secret');
const expectedSecret = process.env.JOB_SECRET;
```

### Environment Variables
```env
# Job secret (for scheduled jobs)
JOB_SECRET=your-secret-here

# Warmup secret (for on-demand warmup)
WARMUP_SECRET=your-warmup-secret-here

# App URL (for warmup trigger)
NEXT_PUBLIC_APP_URL=https://trendarc.net
```

## 🔐 Distributed Locking

### Lock Keys
- Forecasts: `warmup:forecasts:lock`
- AI Explanations: `warmup:ai-explanations:lock`
- On-Demand: `warmup:on-demand:{slug}:{dataHash}`

### Lock Duration
- Forecasts: 1 hour max
- AI Explanations: 2 hours max
- On-Demand: 30 minutes max

### Implementation
- Uses Redis distributed locks if available
- Falls back gracefully if Redis unavailable
- Prevents duplicate job execution
- Automatic lock release on completion/error

## ⚙️ Concurrency Limits

### In-Process Limits
- Forecasts: 5 comparisons concurrently
- AI Explanations: 3 comparisons concurrently
- On-Demand: 1 per comparison (via lock)

### Job-Level Limits
- Max 1 job of each type running at a time
- Returns 429 if concurrency limit reached
- Prevents resource exhaustion

## 📊 Logging

### Job Logger
All jobs log:
- Job start (status: 'running')
- Job completion (status: 'success' or 'failed')
- Processed count
- Failed count
- Errors (limited to 10)
- Duration

### Log Format
```typescript
{
  jobType: 'warmup-forecasts' | 'warmup-ai-explanations' | 'warmup-on-demand',
  status: 'success' | 'failed' | 'running',
  processed?: number,
  failed?: number,
  errors?: string[],
  duration: number,
  metadata?: Record<string, any>
}
```

## 🚫 Never Block User Requests

### On-Demand Warmup
- Returns immediately (fire-and-forget)
- Job runs in background
- User gets response without waiting
- No Puppeteer or heavy compute in request path

### Scheduled Jobs
- Run on separate cron schedule
- Never triggered by user requests
- Isolated from user-facing endpoints

## 📅 Cron Configuration

### Vercel Cron
```json
{
  "crons": [
    {
      "path": "/api/jobs/warmup-forecasts",
      "schedule": "0 2 * * *"  // Daily at 2 AM
    },
    {
      "path": "/api/jobs/warmup-ai-explanations",
      "schedule": "0 3 * * 0"  // Weekly on Sunday at 3 AM
    }
  ]
}
```

### External Cron Services
For non-Vercel deployments, use:
- **cron-job.org**
- **EasyCron**
- **GitHub Actions** (scheduled workflows)

**Example:**
```bash
# Daily at 2 AM UTC
curl -X POST https://trendarc.net/api/jobs/warmup-forecasts \
  -H "X-Job-Secret: your-secret" \
  -H "Content-Type: application/json" \
  -d '{"limit": 50, "concurrency": 5}'
```

## 🔄 Job Flow

### Forecast Warmup Flow
1. Cron triggers `/api/jobs/warmup-forecasts`
2. Verify secret token
3. Check concurrency limit
4. Acquire distributed lock
5. Get popular comparisons (last 7 days)
6. Process in batches (concurrency: 5)
7. Generate forecasts for each comparison
8. Cache forecasts
9. Release lock
10. Log results

### AI Explanation Warmup Flow
1. Cron triggers `/api/jobs/warmup-ai-explanations`
2. Verify secret token
3. Check concurrency limit
4. Acquire distributed lock
5. Get popular comparisons (high views, last 30 days)
6. Process in batches (concurrency: 3)
7. Generate AI insights for each comparison
8. Cache AI insights
9. Release lock
10. Log results

### On-Demand Warmup Flow
1. Premium endpoint detects `needsWarmup: true`
2. Triggers `/api/comparison/warmup` (async)
3. Verify secret token
4. Acquire distributed lock for comparison
5. Generate missing forecasts
6. Generate missing AI insights
7. Cache results
8. Release lock
9. Log results

## 📊 Popular Comparison Selection

### Forecasts (Last 7 Days)
- Comparisons created in last 7 days
- OR last visited in last 7 days
- OR view count > 0
- Ordered by: viewCount desc, lastVisited desc, createdAt desc
- Limit: 50

### AI Explanations (Last 30 Days)
- Comparisons with viewCount >= 10
- OR last visited in last 30 days
- Ordered by: viewCount desc, lastVisited desc
- Limit: 30

## ✅ Requirements Checklist

- [x] Secure endpoints with secret token
- [x] Distributed locks (Redis if available)
- [x] Job concurrency limits
- [x] Log job runs and failures
- [x] Never run Puppeteer or heavy compute in user request path
- [x] Refresh forecasts nightly for popular comparisons
- [x] Refresh AI explanations weekly for popular comparisons
- [x] On-demand warmup when premium endpoint returns needsWarmup
- [x] Fire-and-forget for on-demand warmup
- [x] Comprehensive error handling
- [x] Cache results with appropriate TTLs

## 🎯 Usage Examples

### Manual Trigger (Testing)
```bash
# Forecast warmup
curl -X POST http://localhost:3000/api/jobs/warmup-forecasts \
  -H "X-Job-Secret: your-secret" \
  -H "Content-Type: application/json" \
  -d '{"limit": 10, "concurrency": 2}'

# AI explanation warmup
curl -X POST http://localhost:3000/api/jobs/warmup-ai-explanations \
  -H "X-Job-Secret: your-secret" \
  -H "Content-Type: application/json" \
  -d '{"limit": 5, "concurrency": 1}'
```

### On-Demand Warmup (Automatic)
The premium endpoint automatically triggers warmup when needed:
```typescript
// In app/api/comparison/premium/route.ts
if (result.needsWarmup) {
  await triggerWarmup(canonical, result.pack.dataHash);
}
```

## 🔧 Configuration

### Job Limits
- **Forecasts:** 50 comparisons, 5 concurrency
- **AI Explanations:** 30 comparisons, 3 concurrency
- **On-Demand:** 1 per comparison (via lock)

### Cache TTLs
- **Forecasts:** 7 days fresh, 30 days stale
- **AI Insights:** 7 days fresh, 30 days stale

### Lock Durations
- **Forecasts:** 1 hour max
- **AI Explanations:** 2 hours max
- **On-Demand:** 30 minutes max

---

**Status**: ✅ Complete - Secure, distributed, logged, and never blocks user requests

