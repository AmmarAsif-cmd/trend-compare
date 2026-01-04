# ⚡ Quick Fix: Premium User Login

## The Problem
Getting "Invalid email or password" when logging in with `premium@test.com` / `premium123`

## Quick Fix (2 Steps)

### Step 1: Run SQL in Neon

1. Open your **Neon database console**
2. Go to **SQL Editor**
3. Open the file: `prisma/migrations/fix_premium_user_login.sql`
4. **Copy the entire SQL** and run it in Neon
5. You should see verification results at the end

### Step 2: Try Logging In Again

- **Email:** `premium@test.com`
- **Password:** `premium123`

---

## What the SQL Does

1. ✅ Checks if user exists
2. ✅ Updates password with correct bcrypt hash
3. ✅ Creates user if it doesn't exist
4. ✅ Sets subscription tier to `premium`
5. ✅ Creates/updates active premium subscription
6. ✅ Verifies everything is correct

---

## Alternative: Generate New Password Hash

If you want to use a different password, generate a new hash:

**In Command Prompt:**
```cmd
node -e "const bcrypt=require('bcryptjs');bcrypt.hash('your-password',12).then(h=>console.log(h))"
```

Then update the SQL with the new hash.

---

## Verification

After running the SQL, you should see:
- ✅ Password set
- ✅ subscriptionTier: premium
- ✅ active_premium_subs: 1

Then try logging in!

---

**If it still doesn't work**, check:
- Server logs for authentication errors
- Browser console for errors
- Database connection is working

