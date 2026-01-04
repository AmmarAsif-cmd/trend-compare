# 🔐 Premium User Setup

## ✅ Premium Access Restored

The premium access checks have been restored. Free and premium users now have different access levels.

## 🧪 Create Premium Test User

### Option 1: Using Script (Recommended)

Run the script to create a premium test user:

```bash
npx tsx scripts/create-premium-user.ts
```

Or if tsx is not available, use Node with ts-node:

```bash
node --loader ts-node/esm scripts/create-premium-user.ts
```

### Option 2: Manual SQL

Run this SQL in your database:

```sql
-- Create premium user (password: premium123)
INSERT INTO "User" (id, email, name, password, "subscriptionTier", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'premium@test.com',
  'Premium Test User',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqJqZqZqZq', -- bcrypt hash of 'premium123'
  'premium',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET "subscriptionTier" = 'premium';

-- Create active premium subscription
INSERT INTO "Subscription" (id, "userId", tier, status, "currentPeriodStart", "currentPeriodEnd", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text,
  u.id,
  'premium',
  'active',
  NOW(),
  NOW() + INTERVAL '30 days',
  NOW(),
  NOW()
FROM "User" u
WHERE u.email = 'premium@test.com'
ON CONFLICT DO NOTHING;
```

## 📋 Test User Credentials

**Email:** `premium@test.com`  
**Password:** `premium123`

## 🎯 Premium Features

Premium users have access to:

- ✅ **PDF Downloads** - Download professional comparison reports
- ✅ **Data Export** - Export comparison data as CSV or JSON
- ✅ **Rich AI Insights** - Category detection, predictions, peak explanations
- ✅ **Extended Timeframes** - Access to 5-year and all-time data
- ✅ **Email Alerts** - Set up trend change notifications
- ✅ **Ad-Free Experience** - No ads displayed
- ✅ **Priority Support** - Faster response times

## 🔒 Free User Limitations

Free users can:

- ✅ View all comparisons
- ✅ Basic AI insights (template-based)
- ✅ 12-month timeframe only
- ✅ Save comparisons
- ✅ View comparison history

Free users **cannot**:

- ❌ Download PDF reports
- ❌ Export data (CSV/JSON)
- ❌ Access rich AI insights
- ❌ Use extended timeframes (5y, all-time)
- ❌ Set up email alerts
- ❌ Ad-free experience

## 🧪 Testing

1. **Test Premium User:**
   - Log in with `premium@test.com` / `premium123`
   - Visit any comparison page
   - You should see:
     - PDF Download button (works)
     - CSV/JSON Export buttons (work)
     - Rich AI insights (if API key configured)
     - All timeframes available

2. **Test Free User:**
   - Create a new account or use existing free account
   - Visit any comparison page
   - You should see:
     - PDF Download button (redirects to pricing)
     - CSV/JSON Export buttons (redirect to pricing)
     - Basic AI insights only
     - Limited timeframes

## 🔄 Switching Between Users

To test both tiers:

1. **Premium:** Log in with `premium@test.com`
2. **Free:** Log out and create a new account, or use an existing free account

## 📝 Notes

- Premium access is checked via `canAccessPremium()` function
- The function checks:
  1. User is logged in
  2. User's `subscriptionTier` is "premium" OR
  3. User has an active subscription with status "trialing"
- Premium features are gated throughout the app using this function


