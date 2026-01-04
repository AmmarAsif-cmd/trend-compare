# 🚀 Vercel Hobby Plan Deployment Guide

## ✅ Build Status

**Build Status**: ✅ **PASSING** (Verified locally)

The application builds successfully with:
- ✅ TypeScript compilation
- ✅ Next.js optimization
- ✅ Static page generation
- ✅ All routes properly configured

## 📋 Pre-Deployment Checklist

### 1. Environment Variables

Add these to Vercel Dashboard → Settings → Environment Variables:

#### **Required (Critical)**
```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Authentication
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=https://your-domain.vercel.app

# AI Features
ANTHROPIC_API_KEY=sk-ant-...

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

#### **Optional but Recommended**
```env
# Cache (Redis/Upstash)
CACHE_PROVIDER=upstash
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Multi-source Data (enriches comparisons)
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
TMDB_API_KEY=...
STEAM_API_KEY=...
BESTBUY_API_KEY=...
GITHUB_TOKEN=...
NEWS_API_KEY=...

# Stripe (if using payments)
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...

# Warmup Jobs
WARMUP_SECRET=<generate with: openssl rand -hex 32>

# Analytics
NEXT_PUBLIC_GA_ID=G-...

# AdSense (if ready)
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-...
NEXT_PUBLIC_ADSENSE_SLOT_1=...
NEXT_PUBLIC_ADSENSE_SLOT_2=...
NEXT_PUBLIC_ADSENSE_SLOT_3=...
NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR=...

# Admin
ADMIN_PATH=cp-9a4eef7
ADMIN_PASSWORD_HASH=<bcrypt hash>
```

### 2. Database Setup

**Recommended**: Use Neon, Supabase, or Vercel Postgres

1. Create a PostgreSQL database
2. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```
3. Add `DATABASE_URL` to Vercel environment variables

### 3. Build Configuration

Vercel will auto-detect Next.js, but verify:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)
- **Node Version**: 20.x (recommended)

### 4. Cron Jobs Configuration

**Important**: Vercel Hobby plan allows **only 2 cron jobs**.

Cron jobs are configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/jobs/warmup-forecasts",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/check-alerts",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Active Cron Jobs:**
1. **Warmup Forecasts** - Daily at 2:00 AM UTC (refreshes forecasts for popular comparisons)
2. **Check Alerts** - Every hour (checks trend alerts and sends emails)

**Removed from Vercel Cron:**
- `warmup-ai-explanations` - Weekly AI explanation refresh (moved to external service - see below)

**Alternative for AI Explanations Warmup:**

Since Vercel Hobby only allows 2 cron jobs, the AI explanations warmup job should be run via:

**Option 1: External Cron Service (Recommended)**
- Use [cron-job.org](https://cron-job.org) (free)
- Schedule: Weekly on Sunday at 3:00 AM UTC (`0 3 * * 0`)
- URL: `https://your-domain.vercel.app/api/jobs/warmup-ai-explanations`
- Method: POST
- Headers: `X-Job-Secret: your-job-secret`

**Option 2: Manual Trigger**
- Can be triggered manually via API when needed
- Or combine with forecasts job (modify forecasts endpoint to optionally run AI explanations)

**Note**: Vercel cron jobs require:
- The routes must be accessible (no authentication blocking)
- Routes should handle errors gracefully
- Consider adding authentication via `JOB_SECRET` environment variable

### 5. Vercel Hobby Plan Limits

**Important considerations**:

- ✅ **100GB Bandwidth/month** - Monitor usage
- ✅ **100 Function Invocations/day** - Should be sufficient for most use cases
- ✅ **Serverless Functions**: 10s execution time limit (Hobby)
- ⚠️ **Edge Functions**: Unlimited (use for lightweight operations)
- ✅ **Cron Jobs**: Included (2 configured - Hobby plan limit)
- ✅ **Environment Variables**: Unlimited
- ⚠️ **Build Time**: 45 minutes max per build

### 6. Optimizations for Hobby Plan

#### **Reduce Build Time**
- ✅ Prisma client generation is optimized (safe script)
- ✅ Source maps disabled in production
- ✅ Static pages pre-rendered where possible

#### **Reduce Function Execution Time**
- ✅ API routes use caching where possible
- ✅ Database queries are optimized
- ✅ Heavy operations (Puppeteer) are optional

#### **Reduce Bandwidth**
- ✅ Images optimized with Next.js Image component
- ✅ Static assets cached
- ✅ API responses cached

### 7. Deployment Steps

1. **Connect Repository**
   - Push code to GitHub/GitLab/Bitbucket
   - Import project in Vercel
   - Vercel will auto-detect Next.js

2. **Configure Environment Variables**
   - Add all required variables (see section 1)
   - Set for Production, Preview, and Development

3. **Deploy**
   - Vercel will automatically build and deploy
   - Monitor build logs for any issues

4. **Post-Deployment**
   - Run database migrations: `npx prisma migrate deploy`
   - Test critical features
   - Verify cron jobs are running

### 8. Common Issues & Solutions

#### **Build Fails**
- ✅ **Fixed**: TypeScript errors resolved
- ✅ **Fixed**: Puppeteer `waitForTimeout` deprecated method replaced
- Check build logs for specific errors

#### **Database Connection Issues**
- Verify `DATABASE_URL` is correct
- Check database allows connections from Vercel IPs
- Ensure SSL is enabled (`?sslmode=require`)

#### **Cron Jobs Not Running**
- Verify routes are accessible
- Check Vercel dashboard → Cron Jobs
- Ensure routes return 200 status
- Add authentication via headers if needed

#### **Function Timeout**
- Optimize slow API routes
- Use caching to reduce computation
- Consider moving heavy operations to background jobs

### 9. Monitoring & Maintenance

#### **Monitor**
- Vercel Analytics (included)
- Function execution times
- Bandwidth usage
- Error rates

#### **Maintenance**
- Regular database backups
- Monitor API quotas
- Update dependencies regularly
- Review and optimize slow queries

### 10. Security Checklist

- ✅ Environment variables not committed
- ✅ `.env*` in `.gitignore`
- ✅ Secrets generated securely
- ✅ HTTPS enforced (automatic on Vercel)
- ✅ Security headers configured
- ✅ CSP headers in report-only mode

### 11. Performance Optimization

Already implemented:
- ✅ Static page generation where possible
- ✅ Image optimization
- ✅ Caching layer (Redis/Upstash optional)
- ✅ Database query optimization
- ✅ Code splitting

### 12. Testing Production Build

Before deploying, test locally:

```bash
# Build production version
npm run build

# Start production server
npm start

# Test critical features
# - Homepage loads
# - Comparison pages work
# - API routes respond
# - Authentication works
```

## 🎯 Quick Deploy Checklist

- [ ] Code pushed to Git repository
- [ ] Vercel project created and connected
- [ ] All environment variables added
- [ ] Database created and migrations run
- [ ] Build succeeds (verified)
- [ ] Domain configured (optional)
- [ ] Cron jobs verified
- [ ] Production features tested
- [ ] Monitoring set up

## 📞 Support

If you encounter issues:
1. Check Vercel build logs
2. Check function logs in Vercel dashboard
3. Review error messages
4. Check database connection
5. Verify environment variables

---

**Status**: ✅ **Ready for Vercel Hobby Plan Deployment**

All build errors have been resolved. The application is optimized for Vercel's serverless architecture and Hobby plan limits.

