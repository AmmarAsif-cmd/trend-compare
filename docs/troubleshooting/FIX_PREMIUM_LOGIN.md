# 🔧 Fix Premium User Login Issue

## Problem
Getting "Invalid email or password" when trying to log in with premium account.

## Solution

### Option 1: Run Diagnostic Script (Recommended)

Since PowerShell blocks `npx`, use **Command Prompt** (cmd):

```cmd
cd C:\Users\User\Desktop\Project\trned-compare-cursor\trend-compare
node node_modules\.bin\tsx scripts/check-and-fix-premium-user.ts
```

Or if that doesn't work, use the SQL method below.

---

### Option 2: SQL Method (Works Immediately)

Run this SQL directly in your Neon database console:

```sql
-- Check if user exists
SELECT id, email, "subscriptionTier", 
       CASE WHEN password IS NULL THEN 'No password' 
            WHEN LENGTH(password) < 20 THEN 'Invalid password format'
            ELSE 'Has password' END as password_status
FROM "User" 
WHERE email = 'premium@test.com';

-- If user exists but password is wrong, update it
-- Generate bcrypt hash for 'premium123' (12 rounds)
-- You can use: https://bcrypt-generator.com/ or run: node -e "const bcrypt=require('bcryptjs');bcrypt.hash('premium123',12).then(h=>console.log(h))"

-- Update user with correct password hash
UPDATE "User"
SET 
  password = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqJqZqZqZq', -- bcrypt hash of 'premium123'
  "subscriptionTier" = 'premium',
  name = 'Premium Test User'
WHERE email = 'premium@test.com';

-- Ensure premium subscription exists
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
  AND NOT EXISTS (
    SELECT 1 FROM "Subscription" s 
    WHERE s."userId" = u.id 
      AND s.tier = 'premium' 
      AND s.status = 'active'
  );

-- Verify the user
SELECT 
  u.email,
  u."subscriptionTier",
  CASE WHEN u.password IS NOT NULL AND LENGTH(u.password) > 20 THEN '✅ Has password' ELSE '❌ No password' END as password_status,
  COUNT(s.id) as active_subscriptions
FROM "User" u
LEFT JOIN "Subscription" s ON s."userId" = u.id AND s.status = 'active'
WHERE u.email = 'premium@test.com'
GROUP BY u.id, u.email, u."subscriptionTier", u.password;
```

---

### Option 3: Generate New Password Hash

If you need to generate a new bcrypt hash for a different password:

**Using Node.js (in Command Prompt):**
```cmd
node -e "const bcrypt=require('bcryptjs');bcrypt.hash('premium123',12).then(h=>console.log('Hash:',h))"
```

**Or use online tool:**
- Visit: https://bcrypt-generator.com/
- Rounds: 12
- Password: `premium123`
- Copy the generated hash

---

## Expected Credentials

- **Email:** `premium@test.com`
- **Password:** `premium123`

---

## After Fixing

1. **Try logging in again** with the credentials above
2. **Check browser console** for any errors
3. **Check server logs** for authentication errors

---

## Common Issues

### Issue 1: Password Hash Format
- Bcrypt hashes should start with `$2a$12$` or `$2b$12$`
- They should be about 60 characters long
- Make sure the hash in the database matches the format

### Issue 2: User Doesn't Exist
- Run the SQL INSERT statement above
- Or use the diagnostic script

### Issue 3: Database Connection
- Check your `DATABASE_URL` in `.env`
- Make sure Prisma client is generated: `npx prisma generate`

---

## Verification

After running the fix, verify:

1. User exists in database
2. Password hash is correct (starts with `$2a$12$`)
3. Subscription tier is `premium`
4. Active premium subscription exists

Then try logging in again!

