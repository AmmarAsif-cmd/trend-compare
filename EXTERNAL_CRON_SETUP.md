# 🔄 External Cron Setup for AI Explanations Warmup

Since Vercel Hobby plan only allows **2 cron jobs**, the AI explanations warmup job needs to be run via an external cron service.

## 📋 Current Vercel Cron Jobs (2/2)

1. ✅ **Warmup Forecasts** - Daily at 2:00 AM UTC
2. ✅ **Check Alerts** - Every hour

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

**Note**: If you upgrade to Vercel Pro plan, you can add the AI explanations job back to `vercel.json` as a third cron job.

