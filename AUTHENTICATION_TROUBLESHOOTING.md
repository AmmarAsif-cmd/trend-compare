# 🔐 Authentication Troubleshooting Guide

## Common Issues & Fixes

### Issue 1: "MissingSecret" Error

**Error:** `[auth][error] MissingSecret: Please define a 'secret'`

**Solution:**
1. Generate a secret:
   ```bash
   tsx scripts/generate-auth-secret.ts
   ```
2. Add to `.env.local`:
   ```env
   AUTH_SECRET=your-generated-secret-here
   AUTH_URL=http://localhost:3000
   ```
3. Restart your development server

### Issue 2: "Invalid email or password" (User doesn't exist)

**Symptoms:** Can't sign in even with correct credentials

**Possible Causes:**
1. Database migration not run - User table doesn't exist
2. User was never created
3. Wrong email/password

**Solution:**
1. Check if database migration is complete:
   ```bash
   # Run migration SQL manually or via Prisma
   # File: prisma/migrations/add_saved_comparisons_and_history.sql
   # File: prisma/migrations/manual_add_user_subscription.sql
   ```
2. Create a test user:
   ```bash
   tsx scripts/create-test-user.ts
   ```
3. Verify user exists in database:
   ```bash
   npx prisma studio
   # Check User table
   ```

### Issue 3: Signup Fails

**Symptoms:** "Failed to create account" error

**Possible Causes:**
1. Database migration not complete (User table missing)
2. Database connection error
3. User already exists (different error message should appear)

**Solution:**
1. **Check Database Migration:**
   - Ensure `User` and `Subscription` tables exist
   - Run migration: `prisma/migrations/manual_add_user_subscription.sql`
   - Generate Prisma client: `npx prisma generate`

2. **Check Database Connection:**
   - Verify `DATABASE_URL` in `.env.local`
   - Test connection: `npx prisma db pull`

3. **Check Server Logs:**
   - Look for specific error messages in terminal
   - Check for Prisma errors

### Issue 4: "Account created but login failed"

**Symptoms:** Signup succeeds but auto-login fails

**Possible Causes:**
1. AUTH_SECRET not set
2. NextAuth configuration issue
3. Session creation failed

**Solution:**
1. Ensure `AUTH_SECRET` is set in `.env.local`
2. Restart server after adding AUTH_SECRET
3. Try logging in manually after signup

### Issue 5: Database Connection Errors

**Error:** "PrismaClient not initialized" or "Database connection error"

**Solution:**
1. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Check Database URL:**
   ```env
   DATABASE_URL=postgresql://user:password@host:port/database
   ```

3. **Test Connection:**
   ```bash
   npx prisma db pull
   ```

### Issue 6: "User already exists" but can't login

**Symptoms:** Signup says user exists, but login fails

**Possible Causes:**
1. User exists but password is wrong
2. Password hash mismatch
3. Database inconsistency

**Solution:**
1. Use the create-test-user script to create a fresh user
2. Or manually delete the user from database and recreate
3. Check password hashing: ensure bcrypt is working

---

## Step-by-Step Debugging

### Step 1: Verify Environment Variables

Check `.env.local` has:
```env
# Required for NextAuth
AUTH_SECRET=your-secret-here
AUTH_URL=http://localhost:3000

# Required for database
DATABASE_URL=postgresql://...

# Optional (for Stripe - not needed for basic auth)
# STRIPE_SECRET_KEY=...
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
```

### Step 2: Verify Database Tables

1. Open database console (pgAdmin, DBeaver, etc.)
2. Check if these tables exist:
   - `User`
   - `Subscription`
   - `SavedComparison` (if migration run)
   - `ComparisonHistory` (if migration run)

3. If tables missing, run migrations:
   ```bash
   # Manual SQL migration
   # Run: prisma/migrations/manual_add_user_subscription.sql
   # Run: prisma/migrations/add_saved_comparisons_and_history.sql
   ```

### Step 3: Generate Prisma Client

```bash
npx prisma generate
```

### Step 4: Test Signup Flow

1. Visit: `http://localhost:3000/signup`
2. Fill form and submit
3. Check browser console (F12) for errors
4. Check server terminal for errors

### Step 5: Test Login Flow

1. Visit: `http://localhost:3000/login`
2. Use credentials from test user script
3. Check browser console for errors
4. Check server terminal for errors

---

## Quick Test

### Create Test User & Test Login

```bash
# 1. Create test user
tsx scripts/create-test-user.ts

# 2. Login with:
# Email: test@trendarc.net
# Password: test123456

# 3. Should redirect to homepage and show Dashboard link in header
```

---

## Expected Behavior

### Successful Signup Flow:
1. Fill signup form
2. Submit → Creates user in database
3. Auto-login → Creates NextAuth session
4. Redirects to homepage
5. Dashboard link appears in header

### Successful Login Flow:
1. Fill login form
2. Submit → Validates credentials
3. Creates NextAuth session
4. Redirects to homepage or redirect URL
5. Dashboard link appears in header

---

## Still Having Issues?

1. **Check Server Logs:**
   - Look for error messages in terminal
   - Look for Prisma errors
   - Look for NextAuth errors

2. **Check Browser Console:**
   - Open DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed requests

3. **Verify All Steps:**
   - ✅ AUTH_SECRET is set
   - ✅ Database migration is complete
   - ✅ Prisma client is generated
   - ✅ User table exists
   - ✅ Server restarted after env changes

---

## Common Error Messages

| Error | Solution |
|-------|----------|
| `MissingSecret` | Add `AUTH_SECRET` to `.env.local` |
| `Invalid email or password` | Check user exists, verify password |
| `User with this email already exists` | User exists, try login instead |
| `Failed to create account` | Check database migration, connection |
| `PrismaClient not initialized` | Run `npx prisma generate` |
| `Database connection error` | Check `DATABASE_URL` in `.env.local` |


