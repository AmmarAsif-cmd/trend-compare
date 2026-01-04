# 🔧 Fix: redirect_uri_mismatch Error

## Error Message
```
Error 400: redirect_uri_mismatch
redirect_uri=http://localhost:3000/api/auth/callback/google
```

## Quick Fix (5 minutes)

### Step 1: Go to Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one if needed)
3. Go to **APIs & Services** → **Credentials**

### Step 2: Edit Your OAuth 2.0 Client

1. Find your OAuth 2.0 Client ID in the list
2. Click on it to edit

### Step 3: Add the Redirect URI

Under **"Authorized redirect URIs"**, click **"+ ADD URI"** and add:

```
http://localhost:3000/api/auth/callback/google
```

**Important:**
- ✅ Use `http://` (not `https://`) for localhost
- ✅ Use port `3000` (or your actual port)
- ✅ Include the full path: `/api/auth/callback/google`
- ✅ No trailing slash
- ✅ Exact match required

### Step 4: Save and Wait

1. Click **"SAVE"** at the bottom
2. **Wait 1-2 minutes** for changes to propagate
3. Try signing in again

## For Production

When deploying to production, you MUST add the production redirect URI:

**For TrendArc production:**
```
https://trendarc.net/api/auth/callback/google
```

**For other domains:**
```
https://yourdomain.com/api/auth/callback/google
```

**Important for Production:**
1. Set `NEXTAUTH_URL` environment variable in Vercel:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `NEXTAUTH_URL=https://trendarc.net`
   - Or: `AUTH_URL=https://trendarc.net`
2. Add the production redirect URI in Google Cloud Console
3. You can have BOTH development and production URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://trendarc.net/api/auth/callback/google` (production)

## Common Mistakes to Avoid

❌ **Wrong:**
- `http://localhost:3000` (missing callback path)
- `https://localhost:3000/api/auth/callback/google` (https instead of http)
- `http://localhost:3000/api/auth/callback/google/` (trailing slash)
- `http://127.0.0.1:3000/api/auth/callback/google` (using 127.0.0.1 instead of localhost)

✅ **Correct:**
- `http://localhost:3000/api/auth/callback/google`

## Verify Your Setup

After adding the redirect URI:

1. ✅ Check it's saved in Google Console
2. ✅ Wait 1-2 minutes
3. ✅ Clear browser cache/cookies
4. ✅ Try signing in again

## Still Not Working?

### Check Your Port Number

If you're running on a different port (not 3000), update both:
1. The redirect URI in Google Console
2. Your `AUTH_URL` in `.env.local`:
   ```env
   AUTH_URL=http://localhost:YOUR_PORT
   ```

### Check Multiple Redirect URIs

You can add multiple redirect URIs:
- `http://localhost:3000/api/auth/callback/google` (development)
- `https://yourdomain.com/api/auth/callback/google` (production)

Just make sure the one you're using matches exactly.

## How to Find Your Current Redirect URI

The redirect URI NextAuth uses is determined by:
1. `NEXTAUTH_URL` environment variable (if set)
2. `AUTH_URL` environment variable (if set)
3. Auto-detected from the request URL

**Format:** `{baseUrl}/api/auth/callback/google`

**To check what redirect URI is being used:**
1. Check your environment variables (`NEXTAUTH_URL` or `AUTH_URL`)
2. Or check the error message - it usually shows the redirect URI that failed
3. The redirect URI in the error must match EXACTLY what's in Google Cloud Console

## Quick Checklist

- [ ] Redirect URI added in Google Cloud Console
- [ ] URI matches exactly (check the error message for the exact URI)
- [ ] For production: `https://trendarc.net/api/auth/callback/google`
- [ ] For development: `http://localhost:3000/api/auth/callback/google`
- [ ] Saved the changes in Google Console
- [ ] Waited 1-2 minutes after saving
- [ ] Set `NEXTAUTH_URL` or `AUTH_URL` in environment variables (for production)
- [ ] Restarted development server (if local)
- [ ] Cleared browser cache
- [ ] Tried signing in again


