# Authentication & User Flow Documentation

## Overview
TrendArc now has a foolproof authentication system that creates a smooth user journey from anonymous browsing to paid premium subscriptions.

## User Flow Diagram

```
Anonymous User (IP-tracked)
    ↓
5 Free Comparisons/Day
    ↓
Hit Limit → See Banner
    ↓
Sign Up (with Email)
    ↓
7-Day Premium Trial (Auto-granted)
    ↓
Trial Expires
    ↓
Auto-Convert to Premium ✨
    ↓
Subscribed User (Unlimited)
```

## 1. Anonymous Users (Not Logged In)

### Rate Limits:
- **Daily Limit**: 5 comparisons per day
- **Hourly Limit**: 3 comparisons per hour (anti-abuse)
- **Tracking**: IP address-based
- **Storage**: ComparisonHistory table with `ipAddress` field

### User Experience:
1. Browse freely without account
2. See comparison counter after first use
3. Banner shows remaining comparisons
4. At limit: Prompted to sign up for free trial

### Technical Implementation:
```typescript
// Check anonymous limit
const limitStatus = await checkAnonymousLimit(ipAddress);
// Returns: { allowed, remaining, total, limit, resetTime }

// Track anonymous view
await trackAnonymousView(ipAddress, slug, termA, termB, timeframe, geo);
```

### API Endpoints:
- `GET /api/anonymous/status` - Check current limit status

---

## 2. Authentication Protection

### Login/Signup Pages:
- **Redirect if authenticated**: Users already logged in are sent to dashboard
- **Loading state**: Shows spinner while checking auth status
- **Seamless UX**: No flash of login form for authenticated users

### Implementation:
```typescript
// Both login and signup pages
const { data: session, status } = useSession();

useEffect(() => {
  if (status === "authenticated") {
    router.push("/dashboard");
  }
}, [status, router]);
```

---

## 3. Trial System (7-Day Premium)

### Automatic Trial on Signup:
```typescript
// User signs up
subscriptionTier: "trial"
trialStartedAt: new Date()
trialEndsAt: new Date() + 7 days

// Premium features enabled immediately
```

### Trial Banner:
- Shows days remaining
- Color coding: Blue → Orange (3 days) → Red (last day)
- Message: "Premium access continues automatically!"

### What Trial Users Get:
✅ Unlimited comparisons
✅ All timeframes (7d, 30d, 12m, 5y, all)
✅ AI insights and predictions
✅ Export as PNG/CSV
✅ Statistics and achievements
✅ Saved comparisons

---

## 4. Auto-Premium Conversion

### After 7 Days:
- **Automatic**: Trial converts to premium (NO downgrade!)
- **No interruption**: Seamless transition
- **Cron job**: Runs daily at midnight

### Cron Setup (vercel.json):
```json
{
  "crons": [{
    "path": "/api/cron/expire-trials",
    "schedule": "0 0 * * *"
  }]
}
```

### Conversion Logic:
```typescript
// lib/trial-system.ts
export async function expireTrials() {
  await prisma.user.updateMany({
    where: {
      subscriptionTier: 'trial',
      trialEndsAt: { lt: new Date() },
    },
    data: { subscriptionTier: 'premium' },
  });
}
```

---

## 5. Database Schema

### ComparisonHistory Model:
```prisma
model ComparisonHistory {
  id        String   @id @default(cuid())
  userId    String?  // Optional for anonymous users
  ipAddress String?  // Track anonymous users
  slug      String
  termA     String
  termB     String
  timeframe String   @default("12m")
  geo       String   @default("")
  viewedAt  DateTime @default(now())
  user      User?    @relation(fields: [userId], references: [id])

  @@index([ipAddress])
  @@index([ipAddress, viewedAt])
}
```

### User Model (Trial Fields):
```prisma
model User {
  subscriptionTier  String      @default("free")
  trialStartedAt    DateTime?
  trialEndsAt       DateTime?
  // ...
}
```

---

## 6. Components & Banners

### AnonymousLimitBanner:
- **Shown to**: Non-logged-in users
- **After**: First comparison
- **Shows**: Remaining comparisons, progress bar
- **CTA**: "Start Free Trial" button
- **Dismissed**: Saved in sessionStorage

### TrialBanner:
- **Shown to**: Trial users only
- **Shows**: Days remaining, countdown
- **Message**: "Premium access continues automatically!"
- **CTA**: "View Account" button

### Display Logic:
```
If user is authenticated:
  If trial user: Show TrialBanner
  Else: No banner

If user is anonymous:
  If has made comparisons: Show AnonymousLimitBanner
  Else: No banner
```

---

## 7. Comparison Tracking

### For Authenticated Users:
```typescript
await recordComparisonView(slug, termA, termB, timeframe, geo, null);
// Tracked by userId
```

### For Anonymous Users:
```typescript
const ipAddress = getClientIP(request);
await recordComparisonView(slug, termA, termB, timeframe, geo, ipAddress);
// Tracked by IP
```

---

## 8. Environment Variables

### Required in Production:
```bash
DATABASE_URL="postgresql://..."       # Postgres connection
AUTH_SECRET="<random-32-chars>"       # Auth encryption
NEXTAUTH_URL="https://trendarc.net"   # Optional (auto-detected)
CRON_SECRET="<random>"                # Optional (cron security)
```

### Generate Secrets:
```bash
openssl rand -base64 32
```

---

## 9. Migration Checklist

### Database Migrations:
1. ✅ `20251226010314_add_trial_fields` - Trial tracking
2. ✅ `20251226020138_add_anonymous_user_support` - Anonymous users

### To Apply:
```bash
npx prisma migrate deploy
```

---

## 10. User Journey Examples

### Example 1: Anonymous → Trial → Premium
```
Day 1:  Browse anonymously (IP: 123.45.67.89)
        Compare "iPhone vs Android" (1/5)
        Compare "React vs Vue" (2/5)

Day 2:  Compare "Tesla vs Toyota" (3/5)
        See banner: "2 comparisons remaining"

Day 3:  Compare "Coffee vs Tea" (4/5)
        Banner: Orange warning

Day 4:  Compare "Mac vs PC" (5/5)
        Hit limit: "Daily limit reached!"

        Signs up → Instant 7-day trial
        subscriptionTier: "trial"

Day 5-11: Unlimited comparisons
          Full premium features
          Trial banner visible

Day 12: Trial expires
        AUTO-CONVERT to premium
        subscriptionTier: "premium"
        No interruption!

Forever: Premium user ✨
```

### Example 2: Direct Signup
```
Day 1:  User goes to /signup
        Creates account
        → Instant 7-day trial
        → Redirected to /dashboard

        Tries to visit /login
        → Auto-redirected to /dashboard

Day 8:  Trial expires
        → Auto-premium
        → No action needed
```

---

## 11. Benefits of This System

### For Users:
✅ Try before commitment (7-day trial)
✅ No credit card required upfront
✅ No interruption when trial ends
✅ Clear limits and expectations
✅ Anonymous browsing option

### For Business:
✅ Captures emails early
✅ Low friction signup
✅ Automatic conversions
✅ Prevents free rider problem
✅ Encourages daily engagement

### For Development:
✅ Simple state machine
✅ Clear user states
✅ Easy to test
✅ Minimal edge cases
✅ Fail-safe defaults

---

## 12. Testing

### Manual Test Scenarios:

**Anonymous User:**
1. Open site in incognito
2. Make 5 comparisons
3. Verify banner appears and updates
4. Verify limit enforced after 5

**Authenticated User:**
1. Visit /login while logged in
2. Should redirect to /dashboard
3. Visit /signup while logged in
4. Should redirect to /dashboard

**Trial User:**
1. Sign up new account
2. Verify trial started
3. Verify TrialBanner shows
4. Verify premium features work

**Trial Expiration:**
1. Manually set trialEndsAt to past date
2. Run cron: `/api/cron/expire-trials`
3. Verify user converted to premium

---

## 13. Monitoring & Analytics

### Key Metrics to Track:
- Anonymous users hitting limit (signup intent)
- Trial signup rate
- Trial → Premium conversion rate (should be 100%!)
- Average comparisons before signup
- Days to conversion

### Database Queries:
```sql
-- Anonymous users close to limit today
SELECT ipAddress, COUNT(*) as count
FROM "ComparisonHistory"
WHERE userId IS NULL
  AND viewedAt >= CURRENT_DATE
GROUP BY ipAddress
HAVING COUNT(*) >= 4;

-- Trial users expiring soon
SELECT email, trialEndsAt
FROM "User"
WHERE subscriptionTier = 'trial'
  AND trialEndsAt <= CURRENT_DATE + INTERVAL '1 day';

-- Conversion funnel
SELECT
  COUNT(CASE WHEN subscriptionTier = 'trial' THEN 1 END) as trials,
  COUNT(CASE WHEN subscriptionTier = 'premium' THEN 1 END) as premium,
  COUNT(*) as total
FROM "User";
```

---

## Summary

This authentication system creates a **frictionless funnel**:

1. **Anonymous** (IP-limited) → Try the product
2. **Sign Up** (free trial) → Experience full value
3. **Auto-Premium** (seamless) → Keep using without interruption

No payment gates, no downgrades, no friction. Just a smooth journey from curious visitor to paying customer! 🚀
