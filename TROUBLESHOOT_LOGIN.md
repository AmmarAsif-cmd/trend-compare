# 🔍 Troubleshoot Premium Login Issue

## Steps to Debug

### Step 1: Check Server Logs

When you try to log in, check your **server console/terminal** where Next.js is running. You should now see detailed logs like:

```
[Auth] Attempting login for: premium@test.com
[Auth] User found: { id: '...', email: '...', ... }
[Auth] Password validation result: true/false
```

**Look for:**
- Does it say "User found"?
- What does "Password validation result" say?
- Any error messages?

### Step 2: Verify Password Hash in Database

Run this SQL in Neon to check the password:

```sql
SELECT 
  email,
  "subscriptionTier",
  SUBSTRING(password, 1, 7) as hash_format,
  LENGTH(password) as hash_length,
  password IS NOT NULL as has_password
FROM "User" 
WHERE email = 'premium@test.com';
```

**Expected:**
- `hash_format`: Should be `$2a$12$` or `$2b$12$`
- `hash_length`: Should be 60 characters
- `has_password`: Should be `true`

### Step 3: Generate Fresh Password Hash

The hash in the SQL might be incorrect. Generate a fresh one:

**In Command Prompt:**
```cmd
node -e "const bcrypt=require('bcryptjs');bcrypt.hash('premium123',12).then(h=>console.log('Hash:',h))"
```

**Copy the output hash** and use it in the SQL below.

### Step 4: Update Password with Fresh Hash

Run this SQL in Neon (replace `YOUR_NEW_HASH` with the hash from Step 3):

```sql
UPDATE "User"
SET 
  password = 'YOUR_NEW_HASH',
  "updatedAt" = NOW()
WHERE email = 'premium@test.com';

-- Verify
SELECT 
  email,
  SUBSTRING(password, 1, 30) as hash_preview,
  LENGTH(password) as hash_length
FROM "User" 
WHERE email = 'premium@test.com';
```

### Step 5: Test Password Verification

Run this script to test if the password works:

**In Command Prompt:**
```cmd
node node_modules\.bin\tsx scripts/verify-premium-user-password.ts
```

This will:
- Check if user exists
- Test the password
- Fix it if wrong
- Show detailed info

---

## Common Issues

### Issue 1: Password Hash Format Wrong
- Hash must start with `$2a$12$` or `$2b$12$`
- Hash must be exactly 60 characters
- No extra spaces or newlines

### Issue 2: AUTH_SECRET Missing
Check your `.env` file has:
```
AUTH_SECRET=your-secret-here
```

### Issue 3: Database Connection
Make sure `DATABASE_URL` is correct in `.env`

### Issue 4: Prisma Client Not Generated
Run: `npx prisma generate` (in Command Prompt)

---

## Quick Test

After fixing, try logging in and **watch the server logs**. You should see:
- `[Auth] Attempting login for: premium@test.com`
- `[Auth] User found: ...`
- `[Auth] Password validation result: true` ← This is the key!
- `[Auth] ✅ Login successful`

If you see `Password validation result: false`, the hash is wrong.

---

## Alternative: Create New User

If nothing works, create a completely new user:

```sql
-- Delete old user
DELETE FROM "Subscription" WHERE "userId" IN (SELECT id FROM "User" WHERE email = 'premium@test.com');
DELETE FROM "User" WHERE email = 'premium@test.com';

-- Create fresh user (run the create-premium-user script or use signup page)
```

Then sign up fresh with:
- Email: `premium@test.com`
- Password: `premium123`

Then update to premium in database.

---

**Next Step:** Check your server logs when you try to log in and share what you see!

