# System Dashboard - Admin Debugging & Monitoring

## Overview

The System Dashboard is a **private admin-only** tool for monitoring, debugging, and managing all TrendArc services and APIs in real-time.

## Access

**URL:** `/admin/system`

**Authentication:** Requires admin login (same credentials as blog admin)

**Quick Access:** Click the "🔧 System" button from the Blog Admin Dashboard

---

## Features

### 1. Real-Time Service Monitoring

Monitor the health and status of all critical services:

- **Database (PostgreSQL)** - Connection status, table counts, response time
- **AI Insights (Claude Haiku)** - API key status, budget limits, generation capability
- **Blog System** - Post count, API functionality
- **Google Trends API** - Trending topics availability
- **Environment Variables** - Configuration status
- **Prisma Client** - Generation status

### 2. Status Indicators

Each service shows:
- ✅ **Healthy** - Service fully operational
- ⚠️ **Degraded** - Service working but with limitations
- ❌ **Down** - Service unavailable or misconfigured
- 🔄 **Checking** - Health check in progress

### 3. Detailed Logs

Click any service to expand and view:
- **Recent activity logs** with timestamps
- **Log levels**: SUCCESS, INFO, WARN, ERROR
- **Detailed JSON response** from health checks
- **Response times** for performance monitoring

### 4. Quick Actions

- **Refresh All** - Re-check all services instantly
- **Individual Logs** - View service-specific logs
- **Back to Blog Admin** - Quick navigation

---

## Available Services

### Database (PostgreSQL)
- **Checks:** Connection status, Prisma client generation
- **Data:** Table counts (Comparisons, BlogPosts, AIInsightUsage)
- **Performance:** Query response time

**Common Issues:**
- "Connection failed" → Check DATABASE_URL in environment variables
- "Prisma client not generated" → Run `npx prisma generate`

### AI Insights (Claude Haiku)
- **Checks:** API key configuration, budget limits
- **Data:** Daily/monthly usage, remaining quota
- **Cost:** Estimated monthly spend

**Common Issues:**
- "API key not configured" → Add ANTHROPIC_API_KEY to Vercel
- "Budget limit reached" → Wait for daily/monthly reset (200/day, 6000/month)

### Blog System
- **Checks:** API connectivity, database access
- **Data:** Total post count, system functionality

**Common Issues:**
- "API error" → Check database connection
- "Failed to load" → Verify Prisma migration completed

### Google Trends API
- **Checks:** API availability, data freshness
- **Data:** Current trending topic count

**Common Issues:**
- "No data" → API rate limit or temporary unavailability
- "API error" → Check network connectivity

### Environment Variables
- **Checks:** All required variables configured
- **Data:** Configured vs. missing variables

**Required Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `ANTHROPIC_API_KEY` - Claude API key
- `SESSION_SECRET` - Session encryption key
- `ADMIN_PASSWORD` - Admin login password

### Prisma Client
- **Checks:** Client generation status
- **Data:** Schema sync status

**Common Issues:**
- "Not generated" → Run `npx prisma generate`
- "Schema mismatch" → Run `npx prisma migrate deploy`

---

## API Endpoints Reference

### Admin APIs
```
POST   /api/admin/login
GET    /api/admin/check-auth
POST   /api/admin/logout
GET    /api/admin/blog/posts
GET    /api/admin/blog/posts/[id]
PATCH  /api/admin/blog/posts/[id]
DELETE /api/admin/blog/posts/[id]
POST   /api/admin/blog/posts/create
POST   /api/admin/blog/generate
```

### Public APIs
```
POST /api/compare
GET  /api/suggest
GET  /api/top-week
GET  /api/google-trending
GET  /api/ai-insights-status
GET  /api/health/db
```

---

## Debugging Guide

### Problem: AI Insights Not Working

1. Go to System Dashboard (`/admin/system`)
2. Check **AI Insights (Claude Haiku)** service
3. Click to expand logs
4. Look for:
   - "API key not configured" → Add ANTHROPIC_API_KEY
   - "Budget limit reached" → Wait for reset or increase limits
   - "Generation error" → Check logs for specific error

### Problem: Blog Posts Not Publishing

1. Go to System Dashboard
2. Check **Database (PostgreSQL)** service
3. Check **Blog System** service
4. Expand logs to see specific errors
5. Common fixes:
   - Run database migration if schema error
   - Check Prisma client generation
   - Verify DATABASE_URL is correct

### Problem: Trends Data Not Loading

1. Check **Google Trends API** service
2. Expand logs to see API response
3. Common causes:
   - Rate limiting (wait a few minutes)
   - Temporary API outage (retry later)
   - Network connectivity issues

### Problem: Session Not Persisting

1. Check **Environment Variables** service
2. Verify `SESSION_SECRET` is configured
3. Check browser cookies are enabled
4. Clear cookies and try logging in again

---

## Log Levels Explained

- **SUCCESS** (Green) - Operation completed successfully
- **INFO** (Blue) - Informational message, normal operation
- **WARN** (Yellow) - Warning, service degraded but functional
- **ERROR** (Red) - Error occurred, service may be down

---

## Performance Metrics

The dashboard tracks:
- **Response Time** - How fast each service responds (in milliseconds)
- **Last Checked** - Timestamp of last health check
- **Overall Health** - Percentage of healthy services (top right)

**Healthy Response Times:**
- Database: < 100ms
- AI Insights: < 500ms
- Blog System: < 200ms
- Trends API: < 1000ms

---

## Security

- ✅ **Authentication Required** - Only accessible to logged-in admins
- ✅ **No Public Access** - URL not linked publicly
- ✅ **Sensitive Data Hidden** - API keys show only first 10 characters
- ✅ **Session-Protected** - Uses same secure session as blog admin

**Note:** Keep the `/admin/system` URL private. Do not share publicly.

---

## Tips for Best Performance

1. **Regular Monitoring** - Check dashboard daily
2. **Watch Budget** - Monitor AI Insights usage to avoid hitting limits
3. **Database Health** - Ensure response times stay low (< 100ms)
4. **Error Logs** - Review ERROR level logs immediately
5. **Environment Vars** - Keep all required variables configured

---

## Troubleshooting Common Errors

### "Database connection failed"
```bash
# Verify DATABASE_URL is set
echo $DATABASE_URL

# Test connection manually
npx prisma db push
```

### "Prisma client not generated"
```bash
# Generate Prisma client
npx prisma generate

# Restart server
npm run dev
```

### "API key not configured"
1. Go to Vercel dashboard
2. Settings → Environment Variables
3. Add `ANTHROPIC_API_KEY`
4. Redeploy application

---

## Future Enhancements

Planned features:
- 📊 Historical performance graphs
- 📧 Email alerts for service outages
- 📝 Downloadable log exports
- ⏱️ Automated health check scheduling
- 📈 Usage analytics and trends
- 🔔 Real-time notifications

---

## Quick Reference

| Service | Healthy Status | Common Fix |
|---------|---------------|------------|
| Database | ✅ Connected, <100ms | Check DATABASE_URL |
| AI Insights | ✅ Can generate | Add ANTHROPIC_API_KEY |
| Blog System | ✅ Posts loaded | Run migrations |
| Trends API | ✅ Data available | Wait for rate limit |
| Environment | ✅ All configured | Set missing vars |
| Prisma | ✅ Client generated | Run `prisma generate` |

---

**For additional help, check the logs in each expanded service section.**
