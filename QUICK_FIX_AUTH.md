# 🚀 Quick Fix for Authentication Issues

## Step 1: Run Diagnostic

Check what's missing:

```bash
tsx scripts/check-auth-setup.ts
```

This will tell you exactly what needs to be fixed.

## Step 2: Fix Issues

### If AUTH_SECRET is missing:

```bash
# Generate secret
tsx scripts/generate-auth-secret.ts

# Add to .env.local:
AUTH_SECRET=<generated-secret>
AUTH_URL=http://localhost:3000
```

### If Database tables are missing:

1. **Run User/Subscription migration:**
   - Open your database console
   - Run: `prisma/migrations/manual_add_user_subscription.sql`

2. **Run Saved Comparisons migration:**
   - Run: `prisma/migrations/add_saved_comparisons_and_history.sql`

3. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

### If Prisma Client error:

```bash
npx prisma generate
```

## Step 3: Restart Server

After making changes:

```bash
# Stop server (Ctrl+C)
npm run dev
```

## Step 4: Test

```bash
# Create test user
tsx scripts/create-test-user.ts

# Login with:
# Email: test@trendarc.net
# Password: test123456
```

## Common Issues

| Issue | Quick Fix |
|-------|-----------|
| MissingSecret error | Add `AUTH_SECRET` to `.env.local` |
| Can't signup | Run database migration |
| Can't login | Check user exists, verify password |
| Database error | Check `DATABASE_URL` in `.env.local` |

## Still Not Working?

1. Check browser console (F12) for errors
2. Check server terminal for error messages
3. Run diagnostic script again
4. See `AUTHENTICATION_TROUBLESHOOTING.md` for detailed help


