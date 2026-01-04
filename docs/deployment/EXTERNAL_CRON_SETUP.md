# 🔄 External Cron Setup (Optional)

**Note**: Vercel allows up to **20 cron jobs per project**, so external cron services are optional. However, they may be useful if you need:
- **Precise timing** (Hobby plan has 1-hour variance window)
- **More control** over execution
- **Better monitoring** and alerting

## 📋 Current Vercel Cron Jobs (3/20)

1. ✅ **Warmup Forecasts** - Daily at 2:00 AM UTC (may run 2:00-2:59 AM on Hobby plan)
2. ✅ **Warmup AI Explanations** - Weekly on Sunday at 3:00 AM UTC (may run 3:00-3:59 AM on Hobby plan)
3. ✅ **Check Alerts** - Daily at 4:00 AM UTC (may run 4:00-4:59 AM on Hobby plan)

**⚠️ Note**: Hobby plan only allows daily cron jobs. For hourly alert checking, use external cron service (see `HOBBY_PLAN_ALERT_SETUP.md`).

## 🔧 External Cron Setup

### Recommended Service: cron-job.org (Free)

1. **Sign up** at [cron-job.org](https://cron-job.org)
2. **Create new cron job:**
   - **Title**: TrendArc AI Explanations Warmup
   - **URL**: `https://your-domain.vercel.app/api/jobs/warmup-ai-explanations`
   - **Method**: POST
   - **Schedule**: `0 3 * * 0` (Weekly on Sunday at 3:00 AM UTC)
   - **Headers**:
     ```
     Content-Type: application/json
     X-Job-Secret: your-job-secret-here
     ```
   - **Body** (optional):
     ```json
     {
       "secret": "your-job-secret-here"
     }
     ```

3. **Environment Variable**:
   - Add `JOB_SECRET` to Vercel environment variables
   - Use the same secret in the cron job header

### Alternative Services

#### EasyCron (Free Tier)
- URL: https://www.easycron.com
- Free tier: 1 cron job
- Setup similar to cron-job.org

#### GitHub Actions (Free for Public Repos)
Create `.github/workflows/warmup-ai.yml`:

```yaml
name: Warmup AI Explanations

on:
  schedule:
    - cron: '0 3 * * 0'  # Weekly on Sunday at 3 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  warmup:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Warmup
        run: |
          curl -X POST https://your-domain.vercel.app/api/jobs/warmup-ai-explanations \
            -H "Content-Type: application/json" \
            -H "X-Job-Secret: ${{ secrets.JOB_SECRET }}" \
            -d '{"secret": "${{ secrets.JOB_SECRET }}"}'
```

**Setup:**
1. Add `JOB_SECRET` to GitHub repository secrets
2. Push the workflow file
3. GitHub will run it on schedule

#### Cronitor (Free Tier)
- URL: https://cronitor.io
- Free tier: 5 monitors
- Setup similar to cron-job.org

## 🔐 Security

**Important**: Always use authentication for cron jobs:

1. **Set `JOB_SECRET` environment variable** in Vercel
2. **Use the same secret** in your external cron service
3. **Never commit secrets** to Git

Generate a secure secret:
```bash
openssl rand -hex 32
```

## ✅ Verification

After setting up external cron:

1. **Test manually**:
   ```bash
   curl -X POST https://your-domain.vercel.app/api/jobs/warmup-ai-explanations \
     -H "Content-Type: application/json" \
     -H "X-Job-Secret: your-job-secret" \
     -d '{"secret": "your-job-secret"}'
   ```

2. **Check logs** in Vercel dashboard
3. **Verify** the job runs on schedule

## 📊 Monitoring

- Check Vercel function logs for job execution
- Monitor external cron service dashboard
- Set up alerts if job fails

---

## ⚠️ Hobby Plan Timing Variance

On Vercel Hobby plan, cron jobs may trigger anywhere within the scheduled hour window:
- Job scheduled for `0 2 * * *` may run between **2:00 AM - 2:59 AM**
- Job scheduled for `0 * * * *` may run anywhere within that hour

**When to use external cron:**
- ✅ Need precise execution time (e.g., exactly at 2:00 AM)
- ✅ Need better monitoring and alerting
- ✅ Want to avoid timing variance

**When Vercel cron is fine:**
- ✅ Jobs can run within 1-hour window (most background jobs)
- ✅ Current warmup and alert jobs are not time-critical
- ✅ Simpler setup (no external service needed)

**Upgrade to Pro plan** for guaranteed execution times if precise timing is critical.

