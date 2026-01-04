# 🔐 Google OAuth Setup Guide

## Overview

Google OAuth sign-in has been added to TrendArc. Users can now sign in or sign up using their Google account for a faster, more convenient authentication experience.

## Environment Variables Required

Add these to your `.env.local` file:

```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# NextAuth Configuration
AUTH_SECRET=your-auth-secret-here
AUTH_URL=http://localhost:3000  # For local development
```

## How to Get Google OAuth Credentials

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name (e.g., "TrendArc")
4. Click "Create"

### Step 2: Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and click "Enable"

### Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: External (for testing) or Internal (for Google Workspace)
   - App name: TrendArc
   - User support email: your email
   - Developer contact: your email
   - Click "Save and Continue"
   - Scopes: Click "Save and Continue" (default scopes are fine)
   - Test users: Add your email (for testing)
   - Click "Save and Continue"
4. Application type: "Web application"
5. Name: "TrendArc Web Client"
6. Authorized JavaScript origins:
   - `http://localhost:3000` (for local development)
   - `https://yourdomain.com` (for production)
7. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for local development)
   - `https://yourdomain.com/api/auth/callback/google` (for production)
8. Click "Create"
9. Copy the **Client ID** and **Client Secret**

### Step 4: Add to Environment Variables

Add the credentials to your `.env.local`:

```env
GOOGLE_CLIENT_ID=paste-your-client-id-here
GOOGLE_CLIENT_SECRET=paste-your-client-secret-here
```

## For Production (Vercel)

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add:
   - `GOOGLE_CLIENT_ID` = (your client ID)
   - `GOOGLE_CLIENT_SECRET` = (your client secret)
   - `AUTH_SECRET` = (your auth secret)
   - `AUTH_URL` = `https://yourdomain.com`
4. Update Google OAuth settings to include your production domain:
   - Authorized JavaScript origins: `https://yourdomain.com`
   - Authorized redirect URIs: `https://yourdomain.com/api/auth/callback/google`

## How It Works

1. **User clicks "Continue with Google"** on login or signup page
2. **Redirects to Google** for authentication
3. **Google redirects back** with user information
4. **System checks** if user exists in database:
   - If **new user**: Creates account automatically with Google email/name
   - If **existing user**: Links Google account and signs them in
5. **User is signed in** and redirected to the app

## Features

- ✅ One-click sign-in/signup
- ✅ Automatic account creation for new users
- ✅ Email verification (Google emails are pre-verified)
- ✅ Name automatically populated from Google profile
- ✅ Works on both login and signup pages
- ✅ Seamless integration with existing email/password auth

## Database Migration Required

Before using Google OAuth, you need to make the password field optional in the database:

```bash
# Option 1: Run the migration SQL directly
psql your_database < prisma/migrations/make_password_optional.sql

# Option 2: Generate and run Prisma migration
npx prisma migrate dev --name make_password_optional

# Option 3: If using Prisma Studio, manually update the schema and run:
npx prisma db push
```

The password field is now optional to support OAuth users who don't have passwords.

## Testing

1. **Run the database migration** (see above)
2. Make sure environment variables are set
3. Restart your development server
4. Go to `/login` or `/signup`
5. Click "Continue with Google"
6. Sign in with your Google account
7. You should be redirected back and signed in

## Troubleshooting

### "Invalid client" error
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Verify the credentials are for the correct project

### Redirect URI mismatch
- Make sure the redirect URI in Google Console matches exactly:
  - `http://localhost:3000/api/auth/callback/google` (local)
  - `https://yourdomain.com/api/auth/callback/google` (production)

### OAuth consent screen issues
- For testing, make sure your email is added as a test user
- For production, you may need to verify your app with Google

### User not created
- Check server logs for errors
- Verify database connection is working
- Check that Prisma schema allows empty passwords (OAuth users don't have passwords)

## Security Notes

- Never commit `.env.local` to git
- Keep `GOOGLE_CLIENT_SECRET` secure
- Use different credentials for development and production
- Regularly rotate secrets

