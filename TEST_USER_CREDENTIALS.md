# Test User Credentials

## Quick Test User Setup

### Option 1: Create Test User via Script (Recommended)

Run the test user creation script:

```bash
tsx scripts/create-test-user.ts
```

This will create a user with default credentials:
- **Email:** `test@trendarc.net`
- **Password:** `test123456`
- **Name:** `Test User`

### Option 2: Create Custom Test User

To create a user with custom credentials:

```bash
tsx scripts/create-test-user.ts your-email@example.com yourpassword "Your Name"
```

### Option 3: Sign Up via Website

1. Visit: `http://localhost:3000/signup`
2. Fill in the form:
   - Email: `test@example.com` (or any email)
   - Name: `Test User` (optional)
   - Password: `test123456` (must be at least 8 characters)
   - Confirm Password: `test123456`
3. Click "Create account"
4. You'll be automatically logged in

## Default Test User (if created via script)

```
Email: test@trendarc.net
Password: test123456
```

## Login Instructions

1. Visit: `http://localhost:3000/login`
2. Enter your email and password
3. Click "Sign in"
4. You'll be redirected to the homepage

## Testing Features

After logging in, you can test:

### 1. **Saved Comparisons**
- Visit any comparison page (e.g., `/compare/iphone-vs-samsung`)
- Click the "Save" button
- Visit `/dashboard` to see your saved comparisons

### 2. **Comparison History**
- View different comparison pages
- Visit `/dashboard` to see your viewing history

### 3. **Personal Dashboard**
- Visit `/dashboard`
- You'll see:
  - Stats overview (saved count, recent views, most viewed)
  - List of saved comparisons
  - Recent viewing history
  - Most viewed comparisons

### 4. **Save Button on Comparison Pages**
- The "Save" button appears in the header of each comparison page
- It shows "Saved" when a comparison is saved
- Click again to unsave

## Premium User Testing

To test premium features, you'll need to:

1. Upgrade to premium via Stripe (test mode)
2. Use Stripe test card: `4242 4242 4242 4242`
3. Or modify the user in database to set `subscriptionTier: "premium"`

## Database Verification

To verify the user was created:

```bash
npx prisma studio
```

Then check the `User` table to see your test user.

## Troubleshooting

### User Already Exists
If you see "User already exists", the script will show you the existing credentials. Just use those to log in.

### Can't Login
- Make sure the database migration has been run (see `MIGRATION_INSTRUCTIONS.md`)
- Verify Prisma Client is generated: `npx prisma generate`
- Check server logs for errors
- Make sure you're using the correct email/password

### Dashboard Not Showing Data
- Make sure you're logged in
- Visit some comparison pages first to build history
- Save some comparisons to see them in the dashboard


