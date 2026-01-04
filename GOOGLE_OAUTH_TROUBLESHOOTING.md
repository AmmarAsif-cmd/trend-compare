# 🔧 Google OAuth Troubleshooting: 401 invalid_client Error

## Error: 401: invalid_client

This error means Google cannot validate your OAuth credentials. Here's how to fix it:

## Quick Checklist

### ✅ Step 1: Verify Environment Variables Are Set

Check your `.env.local` file has these variables:

```env
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

**Important:**
- Make sure there are **no spaces** around the `=` sign
- Make sure the values are **not wrapped in quotes** (unless they contain spaces)
- Make sure the file is named exactly `.env.local` (not `.env.local.txt`)

### ✅ Step 2: Restart Your Server

After adding/updating environment variables, **restart your development server**:
1. Stop the server (Ctrl+C)
2. Start again: `npm run dev`

Environment variables are only loaded when the server starts.

### ✅ Step 3: Verify Google Cloud Console Settings

Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials

#### Check Your OAuth 2.0 Client:

1. **Client ID** - Should match `GOOGLE_CLIENT_ID` in your `.env.local`
2. **Client Secret** - Should match `GOOGLE_CLIENT_SECRET` in your `.env.local`

#### Check Authorized Redirect URIs:

For **local development**, you MUST have:
```
http://localhost:3000/api/auth/callback/google
```

For **production**, you MUST have:
```
https://yourdomain.com/api/auth/callback/google
```

**Common mistakes:**
- ❌ Missing `/api/auth/callback/google` path
- ❌ Using `https://` instead of `http://` for localhost
- ❌ Extra trailing slashes
- ❌ Wrong port number

#### Check Authorized JavaScript Origins:

For **local development**:
```
http://localhost:3000
```

For **production**:
```
https://yourdomain.com
```

### ✅ Step 4: Check OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Make sure it's configured (at least for testing)
3. If testing, add your email to "Test users"
4. Make sure the app is in "Testing" or "In production" status

### ✅ Step 5: Verify the Error Details

The error might show more details. Check:
- Is it happening on the redirect back from Google?
- Is it happening when clicking the button?
- What's the exact error message?

## Common Issues & Solutions

### Issue 1: "Redirect URI mismatch"

**Error:** `redirect_uri_mismatch`

**Solution:**
1. Go to Google Cloud Console → Credentials
2. Click on your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", add:
   - `http://localhost:3000/api/auth/callback/google` (for local)
   - `https://yourdomain.com/api/auth/callback/google` (for production)
4. Click "Save"
5. Wait 1-2 minutes for changes to propagate
6. Try again

### Issue 2: "Invalid client"

**Error:** `401: invalid_client`

**Solution:**
1. Double-check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`
2. Make sure they match exactly what's in Google Cloud Console
3. Restart your server
4. Clear browser cache/cookies and try again

### Issue 3: "Access blocked: This app's request is invalid"

**Error:** OAuth consent screen error

**Solution:**
1. Go to OAuth consent screen
2. Make sure your email is added as a "Test user" (if app is in Testing mode)
3. Or publish the app (if ready for production)

### Issue 4: Environment variables not loading

**Solution:**
1. Make sure `.env.local` is in the **root** of your project (same level as `package.json`)
2. Make sure the file is named exactly `.env.local` (not `.env.local.txt` or `.env`)
3. Restart your server completely
4. Check server logs on startup - you should see a warning if Google credentials are missing

## Testing Steps

1. **Check if credentials are loaded:**
   - Look at server startup logs
   - You should see a warning if Google credentials are missing
   - If you see the warning, credentials aren't loaded

2. **Test the redirect URI:**
   - Click "Continue with Google"
   - Check the URL in the browser address bar
   - It should redirect to `accounts.google.com`
   - After Google auth, it should redirect to `http://localhost:3000/api/auth/callback/google`

3. **Check browser console:**
   - Open browser DevTools (F12)
   - Check Console tab for any errors
   - Check Network tab for failed requests

## Still Not Working?

### Option 1: Create New OAuth Credentials

1. Go to Google Cloud Console → Credentials
2. Delete the old OAuth 2.0 Client ID
3. Create a new one:
   - Application type: Web application
   - Name: TrendArc Web Client
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
4. Copy the new Client ID and Client Secret
5. Update `.env.local`
6. Restart server

### Option 2: Use a Different Google Account

Sometimes the issue is with the Google account being used. Try:
- Using a different Google account
- Using an incognito/private browser window
- Clearing browser cookies for `accounts.google.com`

### Option 3: Check Server Logs

Look at your Next.js server console for:
- Any warnings about missing Google credentials
- Any errors during the OAuth flow
- The exact error message from Google

## Quick Test Script

Create a test file to verify your credentials are loaded:

```typescript
// test-google-oauth.ts
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
```

Run: `tsx test-google-oauth.ts`

## Need More Help?

If none of these solutions work:
1. Check the exact error message in browser console
2. Check server logs for detailed errors
3. Verify your Google Cloud project is active
4. Make sure billing is enabled (if required)
5. Try creating a completely new OAuth client


