# 🔔 Email Alerts Background Job - Setup Guide

## Overview

The email alerts background job checks all active trend alerts periodically and sends emails when triggers occur.

## Implementation

### 1. API Route Created
- **File:** `app/api/cron/check-alerts/route.ts`
- **Endpoint:** `GET /api/cron/check-alerts`
- **Functionality:**
  - Fetches all alerts that need checking (based on frequency)
  - Checks each alert against current trend data
  - Sends emails when alerts trigger
  - Updates alert status (lastChecked, lastTriggered, notifyCount)

### 2. Enhanced Alert Checking
- **File:** `lib/trend-alerts.ts`
- **Improvements:**
  - `getAlertsToCheck()` now properly handles different frequencies:
    - **Instant:** Check every hour
    - **Daily:** Check once per day
    - **Weekly:** Check once per week
  - Better date filtering logic

## Setup Options

### Option 1: Vercel Cron Jobs (Recommended for Vercel deployments)

**File:** `vercel.json` (already created)

```json
{
  "crons": [
    {
      "path": "/api/cron/check-alerts",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Schedule:** Runs every hour (`0 * * * *`)

**Security:** Vercel automatically adds authentication headers

**To Deploy:**
1. Push `vercel.json` to your repository
2. Vercel will automatically set up the cron job
3. No additional configuration needed

---

### Option 2: External Cron Service

Use services like:
- **cron-job.org** (free)
- **EasyCron** (free tier available)
- **Cronitor** (free tier available)
- **GitHub Actions** (free for public repos)

**Setup:**
1. Create account on cron service
2. Add new cron job
3. URL: `https://yourdomain.com/api/cron/check-alerts`
4. Schedule: Every hour (`0 * * * *`)
5. Method: GET
6. Add header: `Authorization: Bearer YOUR_CRON_SECRET`

**Environment Variable:**
Add to `.env`:
```
CRON_SECRET=your-secret-token-here
```

---

### Option 3: Server Cron (For self-hosted)

**Setup crontab:**
```bash
# Edit crontab
crontab -e

# Add this line (runs every hour)
0 * * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/cron/check-alerts
```

---

## Security

The endpoint is protected by:
1. **Authorization Header Check:**
   - Requires `Authorization: Bearer <CRON_SECRET>`
   - Set `CRON_SECRET` in environment variables

2. **For Vercel Cron:**
   - Vercel automatically adds `x-vercel-signature` header
   - You can verify this in the route if needed

**To add Vercel signature verification:**
```typescript
// In route.ts
const vercelSignature = request.headers.get('x-vercel-signature');
if (!vercelSignature && process.env.VERCEL) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

## Testing

### Manual Test
```bash
# Test locally
curl http://localhost:3000/api/cron/check-alerts

# Test with auth (production)
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/cron/check-alerts
```

### Expected Response
```json
{
  "success": true,
  "processed": 5,
  "triggered": 2,
  "errors": 0,
  "duration": "1234ms",
  "timestamp": "2025-01-XX..."
}
```

---

## Monitoring

### Logs
The cron job logs:
- Number of alerts processed
- Number of alerts triggered
- Errors encountered
- Duration of execution

### Check Logs
- **Vercel:** Dashboard → Functions → Logs
- **Self-hosted:** Check server logs
- **External cron:** Check service dashboard

---

## Alert Frequencies

### Instant Alerts
- **Check Frequency:** Every hour
- **Use Case:** Critical changes that need immediate notification
- **Example:** "Notify me instantly when my brand overtakes competitor"

### Daily Alerts
- **Check Frequency:** Once per day
- **Use Case:** Regular monitoring without spam
- **Example:** "Daily summary of trend changes"

### Weekly Alerts
- **Check Frequency:** Once per week
- **Use Case:** Weekly digest of changes
- **Example:** "Weekly trend summary"

---

## Troubleshooting

### Alerts Not Triggering
1. Check if alerts are `active` status
2. Verify `lastChecked` is being updated
3. Check cron job is running (check logs)
4. Verify email service is configured

### Emails Not Sending
1. Check `RESEND_API_KEY` or SMTP settings
2. Verify user email exists in database
3. Check email service logs
4. Test email sending manually

### Cron Not Running
1. Verify `vercel.json` is deployed (for Vercel)
2. Check external cron service status
3. Verify URL is accessible
4. Check authentication headers

---

## Next Steps

1. **Set up cron job** using one of the options above
2. **Test the endpoint** manually first
3. **Create a test alert** and verify it triggers
4. **Monitor logs** for the first few runs
5. **Adjust schedule** if needed (currently hourly)

---

## Files Created/Modified

### New Files:
- `app/api/cron/check-alerts/route.ts` - Cron endpoint
- `vercel.json` - Vercel cron configuration
- `CRON_SETUP_GUIDE.md` - This guide

### Modified Files:
- `lib/trend-alerts.ts` - Enhanced `getAlertsToCheck()` function

---

**Status:** ✅ Background job implementation complete!
**Next:** Set up the cron job using one of the options above.

