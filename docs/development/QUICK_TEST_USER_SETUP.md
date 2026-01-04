# 🚀 Quick Test User Setup

## Fastest Way to Create a Test User

### Step 1: Create Test User

```bash
tsx scripts/create-test-user.ts
```

**Default Credentials Created:**
- **Email:** `test@trendarc.net`
- **Password:** `test123456`
- **Name:** `Test User`

### Step 2: Login

1. Visit: `http://localhost:3000/login`
2. Enter:
   - Email: `test@trendarc.net`
   - Password: `test123456`
3. Click "Sign in"

### Step 3: Test Features

1. **Visit Dashboard:** `http://localhost:3000/dashboard`
2. **Save a Comparison:**
   - Visit any comparison page (e.g., `/compare/iphone-vs-samsung`)
   - Click the "Save" button
   - Visit `/dashboard` to see it saved
3. **View History:**
   - Visit several comparison pages
   - Check `/dashboard` to see your viewing history

---

## Alternative: Create Custom User

```bash
tsx scripts/create-test-user.ts your-email@example.com yourpassword "Your Name"
```

---

## Alternative: Sign Up via Website

1. Visit: `http://localhost:3000/signup`
2. Fill in the form and create account
3. You'll be automatically logged in

---

## ✅ Quick Verification Checklist

After logging in, verify:

- [ ] Dashboard link appears in header
- [ ] Can visit `/dashboard` page
- [ ] Can save comparisons (Save button works)
- [ ] Saved comparisons appear in dashboard
- [ ] Comparison history is tracked
- [ ] Most viewed comparisons are shown

---

## 🔧 If Script Doesn't Work

Make sure:
1. Database migration has been run (see `MIGRATION_INSTRUCTIONS.md`)
2. Prisma Client is generated: `npx prisma generate`
3. Dependencies are installed: `npm install`
4. Database connection is working: Check `.env` file


