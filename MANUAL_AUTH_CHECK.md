# 🔍 Manual Authentication Setup Check

Since PowerShell execution policy is blocking scripts, use this manual checklist:

## ✅ Step-by-Step Checklist

### 1. Check AUTH_SECRET

**Check `.env.local` file in project root:**

```env
AUTH_SECRET=nbfPHNz/4sbzzGIGlnInafufm5h53e4+wZSazWVw5Ds=
AUTH_URL=http://localhost:3000
```

**If missing:**
- Generate secret: Copy this value (already generated): `nbfPHNz/4sbzzGIGlnInafufm5h53e4+wZSazWVw5Ds=`
- Add to `.env.local`
- Restart server

### 2. Check DATABASE_URL

**Check `.env.local` has:**
```env
DATABASE_URL=postgresql://user:password@host:port/database
```

**If missing:** Add your database connection string

### 3. Check Database Tables

**Option A: Using Prisma Studio (Easiest)**
```bash
npx prisma studio
```
- Should open in browser
- Check if `User` table exists
- Check if `Subscription` table exists

**Option B: Using Database Console**
- Open your database client (pgAdmin, DBeaver, etc.)
- Run: `SELECT * FROM "User" LIMIT 1;`
- If error "table does not exist" → Run migration

### 4. Check Database Migration

**If tables don't exist, run migration:**

1. Open your database console
2. Open file: `prisma/migrations/manual_add_user_subscription.sql`
3. Copy the entire SQL
4. Run it in your database console
5. Also run: `prisma/migrations/add_saved_comparisons_and_history.sql`

### 5. Generate Prisma Client

**Run this command:**
```bash
npx prisma generate
```

**Note:** If PowerShell blocks this, use Command Prompt (cmd) instead:
1. Press `Win + R`
2. Type `cmd` and press Enter
3. Navigate to project: `cd C:\Users\User\Desktop\Project\trned-compare-cursor\trend-compare`
4. Run: `npx prisma generate`

### 6. Check Server Console

**When you start the server (`npm run dev`), check for:**

✅ Good signs:
- No "MissingSecret" errors
- No Prisma initialization errors
- Server starts successfully

❌ Bad signs:
- `[auth][error] MissingSecret` → Add AUTH_SECRET
- `PrismaClient not initialized` → Run `npx prisma generate`
- Database connection errors → Check DATABASE_URL

### 7. Test Signup

1. Visit: `http://localhost:3000/signup`
2. Fill form and submit
3. **Check browser console (F12)** for errors
4. **Check server terminal** for errors

**Common errors:**
- "Failed to create account" → Check server terminal for Prisma error
- "Database connection error" → Check DATABASE_URL
- "User table does not exist" → Run migration

### 8. Test Login

1. Create test user first (see below)
2. Visit: `http://localhost:3000/login`
3. Use test credentials
4. Check browser console and server terminal

---

## 🧪 Create Test User (Without Script)

Since scripts are blocked, create user manually:

### Option 1: Via Signup Page (Easiest)
1. Visit: `http://localhost:3000/signup`
2. Fill form:
   - Email: `test@trendarc.net`
   - Password: `test123456` (min 8 chars)
   - Name: `Test User`
3. Submit

### Option 2: Via Database (If signup fails)

Run this SQL in your database console:

```sql
-- Hash password for 'test123456' using bcrypt
-- You'll need to generate this hash first
-- Or use the signup API endpoint instead
```

**Better:** Use the signup API endpoint via browser console:

1. Open browser console (F12) on any page
2. Run:
```javascript
fetch('/api/user/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@trendarc.net',
    password: 'test123456',
    name: 'Test User'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

---

## 🔧 Quick Fixes

### If "MissingSecret" Error:
```env
# Add to .env.local
AUTH_SECRET=nbfPHNz/4sbzzGIGlnInafufm5h53e4+wZSazWVw5Ds=
AUTH_URL=http://localhost:3000
```
**Then restart server**

### If "User table does not exist":
1. Run migration SQL manually in database console
2. Run: `npx prisma generate` (use Command Prompt if PowerShell blocked)

### If "Database connection error":
1. Check `DATABASE_URL` in `.env.local`
2. Verify database is running
3. Test connection in database client

### If Signup/Login still fails:
1. **Check browser console (F12)** → Look for error messages
2. **Check server terminal** → Look for Prisma/auth errors
3. Share the specific error message for help

---

## 📋 Summary Checklist

- [ ] AUTH_SECRET added to `.env.local`
- [ ] AUTH_URL added to `.env.local`
- [ ] DATABASE_URL set in `.env.local`
- [ ] User table exists (check via Prisma Studio or DB console)
- [ ] Subscription table exists
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] Server restarted after env changes
- [ ] No errors in server console on startup
- [ ] Can access signup page
- [ ] Can create account (or test user exists)
- [ ] Can login with credentials

---

## 🆘 Still Having Issues?

1. **Check Server Console:**
   - Look for any red error messages
   - Copy the full error message

2. **Check Browser Console:**
   - Open DevTools (F12)
   - Check Console tab
   - Check Network tab for failed requests

3. **Share:**
   - Error message from server console
   - Error message from browser console
   - Which step failed (signup or login)


