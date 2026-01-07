# 🔔 Alert Checking Setup for Vercel Hobby Plan

## ⚠️ Hobby Plan Limitation

**Vercel Hobby plan only allows daily cron jobs** (once per day maximum). This means:
- ✅ Can use: `0 2 * * *` (daily at 2 AM)
- ✅ Can use: `0 3 * * 0` (weekly on Sunday)
- ❌ Cannot use: `0 * * * *` (hourly - runs 24 times per day)
- ❌ Cannot use: `*/5 * * * *` (every 5 minutes)

## 📋 Current Configuration

The alert checking cron job is set to run **once per day** at 4:00 AM UTC:

```json
{
  "path": "/api/cron/check-alerts",
  "schedule": "0 4 * * *"
}
```

**Impact:**
- ✅ Daily and weekly alerts will be checked properly
- ⚠️ "Instant" alerts (should check hourly) will only be checked once per day
- ⚠️ Users with instant alerts may experience delays

## 🔧 Recommended Solution: External Cron Service

For **instant alerts** to work properly, set up an external cron service to check alerts hourly.

### Option 1: cron-job.org (Free - Recommended)

1. **Sign up** at [cron-job.org](https://cron-job.org)

2. **Create new cron job:**
   - **Title**: TrendArc Alert Check (Hourly)
   - **URL**: `https://your-domain.vercel.app/api/cron/check-alerts`
   - **Method**: GET
   - **Schedule**: `0 * * * *` (Every hour at minute 0)
   - **Headers**:
     ```
     Authorization: Bearer YOUR_CRON_SECRET
     ```
   - **Notifications**: Enable email alerts if job fails

3. **Environment Variable:**
   - Add `CRON_SECRET` to Vercel environment variables
   - Use the same secret in the cron job header

4. **Test:**
   ```bash
   curl -X GET https://your-domain.vercel.app/api/cron/check-alerts \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

### Option 2: EasyCron (Free Tier)

- URL: https://www.easycron.com
- Free tier: 1 cron job
- Setup similar to cron-job.org

### Option 3: GitHub Actions (Free for Public Repos)

Create `.github/workflows/check-alerts.yml`:

```yaml
name: Check Trend Alerts

on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:  # Allow manual trigger

jobs:
  check-alerts:
    runs-on: ubuntu-latest
    steps:
      - name: Check Alerts
        run: |
          curl -X GET https://your-domain.vercel.app/api/cron/check-alerts \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

**Setup:**
1. Add `CRON_SECRET` to GitHub repository secrets
2. Push the workflow file
3. GitHub will run it hourly

## 🔐 Security

**Important**: Always use authentication:

1. **Set `CRON_SECRET` environment variable** in Vercel
2. **Use the same secret** in your external cron service
3. **Never commit secrets** to Git

Generate a secure secret:
```bash
openssl rand -hex 32
```

## 📊 How It Works

The `getAlertsToCheck()` function already handles different alert frequencies:

- **Instant alerts**: Checks if `lastChecked` was more than 1 hour ago
- **Daily alerts**: Checks if `lastChecked` was more than 24 hours ago
- **Weekly alerts**: Checks if `lastChecked` was more than 7 days ago

**With hourly external cron:**
- ✅ Instant alerts checked every hour
- ✅ Daily alerts checked when due
- ✅ Weekly alerts checked when due

**With only daily Vercel cron:**
- ⚠️ Instant alerts only checked once per day (not ideal)
- ✅ Daily alerts checked daily
- ✅ Weekly alerts checked when due

## ✅ Verification

After setting up external cron:

1. **Test manually:**
   ```bash
   curl -X GET https://your-domain.vercel.app/api/cron/check-alerts \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

2. **Check response:**
   ```json
   {
     "success": true,
     "processed": 5,
     "triggered": 2,
     "errors": 0,
     "duration": "1234ms",
     "timestamp": "2024-01-01T12:00:00.000Z"
   }
   ```

3. **Monitor:**
   - Check Vercel function logs
   - Monitor external cron service dashboard
   - Set up alerts if job fails

## 🚀 Upgrade Path

If you need more frequent cron jobs or guaranteed execution times:

**Upgrade to Vercel Pro Plan:**
- ✅ Unlimited cron job frequencies (hourly, every 5 minutes, etc.)
- ✅ Guaranteed execution times (no 1-hour variance window)
- ✅ Better monitoring and alerting
- ✅ More function execution time

---

**Summary**: For Hobby plan, use external cron service for hourly alert checking. The daily Vercel cron serves as a backup.


