# 🔐 Create Premium Test User

## Quick Setup

### Option 1: Run Script (Easiest)

```bash
npx tsx scripts/create-premium-user.ts
```

**Or if tsx is not available:**

```bash
node --loader ts-node/esm scripts/create-premium-user.ts
```

### Option 2: Run SQL Migration

Run the SQL file in your database console:

**File:** `prisma/migrations/create_premium_test_user.sql`

Copy the entire contents and run it in:
- Supabase Dashboard → SQL Editor
- Neon Console → SQL Editor  
- pgAdmin → Query Tool
- Any database client

---

## 📋 Test User Credentials

**Email:** `premium@test.com`  
**Password:** `premium123`

---

## ✅ What Gets Created

1. **User Account**
   - Email: `premium@test.com`
   - Password: `premium123` (hashed with bcrypt)
   - Name: `Premium Test User`
   - Subscription Tier: `premium`

2. **Active Premium Subscription**
   - Tier: `premium`
   - Status: `active`
   - Period: 30 days from creation date

---

## 🧪 Testing Premium Features

After logging in with the premium user:

1. **Visit any comparison page** (e.g., `/compare/chatgpt-vs-gemini`)
2. **You should see:**
   - ✅ PDF Download button (works, not redirecting)
   - ✅ CSV/JSON Export buttons (work, not redirecting)
   - ✅ Rich AI Insights (if ANTHROPIC_API_KEY is configured)
   - ✅ All timeframes available (5y, all-time)
   - ✅ No premium upgrade prompts

3. **Test Free User:**
   - Log out
   - Create a new account or use existing free account
   - Visit the same comparison page
   - You should see:
     - ❌ PDF Download button (redirects to pricing)
     - ❌ CSV/JSON Export buttons (redirect to pricing)
     - ❌ Premium upgrade prompts for AI insights
     - ❌ Limited timeframes

---

## 🔄 Switching Between Users

1. **Premium:** Log in with `premium@test.com` / `premium123`
2. **Free:** Log out and create a new account, or use an existing free account

---

## 🎯 Premium vs Free Features

### Premium Users Can:
- ✅ Download PDF reports
- ✅ Export data (CSV/JSON)
- ✅ Access rich AI insights
- ✅ Use extended timeframes (5y, all-time)
- ✅ Set up email alerts
- ✅ Ad-free experience (when implemented)

### Free Users Can:
- ✅ View all comparisons
- ✅ Basic AI insights (template-based)
- ✅ 12-month timeframe only
- ✅ Save comparisons
- ✅ View comparison history

### Free Users Cannot:
- ❌ Download PDF reports
- ❌ Export data (CSV/JSON)
- ❌ Access rich AI insights
- ❌ Use extended timeframes
- ❌ Set up email alerts

---

## 🔧 Troubleshooting

### Script Fails to Run

If `npx tsx` doesn't work, use the SQL migration instead:

1. Open `prisma/migrations/create_premium_test_user.sql`
2. Copy the entire SQL
3. Run it in your database console

### User Already Exists

The script will update the existing user to premium. If you want a fresh user:

1. Delete the existing user from database
2. Run the script again

### Can't Log In

1. Check that the user was created in the database
2. Verify the password hash is correct
3. Try resetting the password manually

---

## 📝 Notes

- Premium access is checked via `canAccessPremium()` function
- The function checks:
  1. User is logged in
  2. User's `subscriptionTier` is "premium" OR
  3. User has an active subscription with status "trialing"
- Premium features are gated throughout the app using this function


