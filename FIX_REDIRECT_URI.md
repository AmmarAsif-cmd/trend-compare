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

When deploying to production, also add:

```
https://yourdomain.com/api/auth/callback/google
```

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

## Quick Checklist

- [ ] Redirect URI added in Google Cloud Console
- [ ] URI matches exactly: `http://localhost:3000/api/auth/callback/google`
- [ ] Saved the changes in Google Console
- [ ] Waited 1-2 minutes after saving
- [ ] Restarted development server
- [ ] Cleared browser cache
- [ ] Tried signing in again

