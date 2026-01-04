# 🔧 Troubleshooting Admin Login Issues

## Common Issues and Solutions

### Issue 1: "Failed to login. Please try again."

**Possible Causes:**

1. **Password not set in .env.local**
   - ✅ Check `.env.local` exists in project root
   - ✅ Verify `ADMIN_PASSWORD=your-password` is set
   - ✅ Make sure no quotes around password: `ADMIN_PASSWORD=my-password` (not `ADMIN_PASSWORD="my-password"`)
   - ✅ Restart server after changing `.env.local`

2. **Wrong password**
   - ✅ Double-check the password you're typing
   - ✅ Check for extra spaces
   - ✅ Make sure Caps Lock is off

3. **Environment variable not loaded**
   - ✅ Restart Next.js dev server completely
   - ✅ Check server console for warnings about missing password
   - ✅ Verify `.env.local` is in the project root (not in a subfolder)

4. **Rate limiting**
   - ✅ Wait 15 minutes if you've tried 5+ times
   - ✅ Check error message for "Too many failed attempts"

### Issue 2: "Admin password not configured"

**Solution:**
```env
# Add to .env.local
ADMIN_PASSWORD=your-password-here
```

Then restart your server:
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Issue 3: Password works but session doesn't persist

**Solution:**
1. Check browser cookies are enabled
2. Try in incognito/private mode
3. Clear browser cache and cookies
4. Check browser console for errors

### Issue 4: "Invalid password" even with correct password

**Check:**
1. Open browser DevTools (F12) → Console tab
2. Look for error messages
3. Check server terminal for warnings
4. Verify `.env.local` format:
   ```env
   # ✅ Correct
   ADMIN_PASSWORD=my-password-123
   
   # ❌ Wrong (quotes)
   ADMIN_PASSWORD="my-password-123"
   
   # ❌ Wrong (spaces)
   ADMIN_PASSWORD = my-password-123
   ```

## Debug Steps

### Step 1: Check Environment Variables

Check your server console when it starts. You should see:
- No warnings about missing password
- If you see: `[Auth] ⚠️ No ADMIN_PASSWORD_HASH or ADMIN_PASSWORD configured!`
  → Your password is not being loaded

### Step 2: Verify .env.local Format

```env
# ✅ Correct format
ADMIN_PASSWORD=your-password
SESSION_SECRET=your-secret
ADMIN_PATH=cp-9a4eef7

# ❌ Common mistakes
ADMIN_PASSWORD = your-password  # Space around =
ADMIN_PASSWORD="your-password"  # Quotes
ADMIN_PASSWORD='your-password'  # Single quotes
```

### Step 3: Check Server Logs

When you try to login, check your server terminal for:
- `[Login API] Password check:` - Shows if password is configured
- `[Auth] ❌ No ADMIN_PASSWORD...` - Password not configured
- Any other error messages

## Quick Fix Checklist

- [ ] `.env.local` exists in project root
- [ ] `ADMIN_PASSWORD=your-password` is set (no quotes, no spaces around `=`)
- [ ] Server was restarted after changing `.env.local`
- [ ] Password typed correctly (check for typos)
- [ ] Not rate limited (wait 15 min if needed)
- [ ] Browser cookies enabled
- [ ] Check server console for error messages

## Example Working .env.local

```env
# Admin Configuration
ADMIN_PASSWORD=my-secure-password-123
SESSION_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
ADMIN_PATH=cp-9a4eef7

# Other variables...
ANTHROPIC_API_KEY=sk-ant-...
```

## Need More Help?

1. **Check server terminal** - Look for error messages when you try to login
2. **Check browser console** (F12) - Look for network errors
3. **Try a simple password first**: `ADMIN_PASSWORD=test123`
4. **Verify file location**: `.env.local` should be in the same folder as `package.json`

