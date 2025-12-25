# ⚡ Quick Authentication Check (No Scripts Needed)

## Essential Checks (2 minutes)

### ✅ Check 1: AUTH_SECRET

**Look in `.env.local` file:**

Does it have this line?
```env
AUTH_SECRET=nbfPHNz/4sbzzGIGlnInafufm5h53e4+wZSazWVw5Ds=
```

**If NO:** Add it, then restart server

**If YES:** Continue to next check

---

### ✅ Check 2: Database Tables

**Option A: Quick check via Prisma Studio**
```bash
npx prisma studio
```
- Opens browser
- Look for `User` table in left sidebar
- If missing → Run migration

**Option B: Check via database console**
- Open your database tool
- Run: `SELECT COUNT(*) FROM "User";`
- If error "table does not exist" → Run migration

**If tables missing:**
1. Open: `prisma/migrations/manual_add_user_subscription.sql`
2. Copy SQL
3. Run in database console

---

### ✅ Check 3: Generate Prisma Client

**Run in Command Prompt (not PowerShell):**
```bash
npx prisma generate
```

**To open Command Prompt:**
- Press `Win + R`
- Type `cmd`
- Press Enter
- Navigate: `cd path\to\your\project`

---

### ✅ Check 4: Test Signup

1. Visit: `http://localhost:3000/signup`
2. Fill form:
   - Email: `test@example.com`
   - Password: `test123456`
   - Name: `Test User`
3. Click "Create account"
4. **Watch server terminal** for errors

**Success:** Redirects to homepage  
**Failure:** Check error message

---

### ✅ Check 5: Test Login

1. Visit: `http://localhost:3000/login`
2. Use credentials from signup
3. Click "Sign in"
4. **Watch server terminal** for errors

**Success:** Redirects, Dashboard link appears  
**Failure:** Check error message

---

## Most Common Issues

### Issue: "MissingSecret" Error
**Fix:** Add `AUTH_SECRET` to `.env.local` and restart server

### Issue: "User table does not exist"
**Fix:** Run migration SQL from `prisma/migrations/manual_add_user_subscription.sql`

### Issue: "PrismaClient not initialized"
**Fix:** Run `npx prisma generate` (use Command Prompt)

### Issue: Signup says "Failed to create account"
**Check:**
1. Database tables exist?
2. DATABASE_URL correct?
3. Server terminal error message?

---

## What to Share If Still Failing

1. Error message from server terminal (when you try signup/login)
2. Error message from browser console (F12 → Console tab)
3. Which step failed (signup or login)


