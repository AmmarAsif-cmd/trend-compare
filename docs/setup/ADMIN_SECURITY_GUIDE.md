# 🔒 Admin Security Guide

## Overview

This guide explains how to secure your admin panel with a hard-to-guess URL and enhanced password security.

## ✅ What's Been Implemented

### 1. **Secure Admin Path**
- Admin panel is now accessible at a random, hard-to-guess path
- Default path: `/cp-9a4eef7` (change this in production!)
- Old `/admin` path is blocked from search engines

### 2. **Enhanced Password Security**
- Supports SHA-256 password hashing (recommended)
- Falls back to plain text for development (not recommended for production)
- Constant-time comparison to prevent timing attacks

### 3. **Next.js Rewrites**
- Maps secure path to actual admin folder
- No need to rename folders
- Works transparently

## 🚀 Setup Instructions

### Step 1: Generate a Secure Admin Path

Generate a random path for your admin panel:

```bash
node -e "console.log('cp-' + require('crypto').randomBytes(8).toString('hex'))"
```

This will output something like: `cp-9a4eef788c8daaec`

### Step 2: Set Environment Variables

Add to your `.env.local`:

```env
# Secure admin path (change this!)
ADMIN_PATH=cp-9a4eef788c8daaec

# Generate password hash (see Step 3)
ADMIN_PASSWORD_HASH=your-hash-here

# Session secret (generate a random string)
SESSION_SECRET=your-random-session-secret-here
```

### Step 3: Generate Password Hash

**Option A: Using the script (Recommended)**

```bash
tsx scripts/generate-password-hash.ts your-secure-password
```

This will output a hash like:
```
ADMIN_PASSWORD_HASH=5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8
```

Copy this to your `.env.local`.

**Option B: Using Node.js directly**

```bash
node -e "console.log(require('crypto').createHash('sha256').update('your-password').digest('hex'))"
```

### Step 4: Generate Session Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add the output to `SESSION_SECRET` in `.env.local`.

### Step 5: Update Admin Path (Optional)

If you want to change the default admin path, edit `lib/admin-config.ts`:

```typescript
export const ADMIN_PATH = process.env.ADMIN_PATH || 'cp-your-new-path';
```

## 🔐 Security Best Practices

### ✅ DO:
- ✅ Use a long, random admin path (16+ characters)
- ✅ Use password hashing (ADMIN_PASSWORD_HASH)
- ✅ Use a strong, unique password
- ✅ Rotate passwords periodically
- ✅ Keep `.env.local` out of version control
- ✅ Use HTTPS in production
- ✅ Monitor failed login attempts

### ❌ DON'T:
- ❌ Use predictable admin paths like `/admin` or `/dashboard`
- ❌ Store plain text passwords in environment variables
- ❌ Commit `.env.local` to git
- ❌ Share admin credentials
- ❌ Use weak passwords

## 📝 Accessing the Admin Panel

After setup, access your admin panel at:

```
https://yourdomain.com/cp-9a4eef7/login
```

(Replace `cp-9a4eef7` with your actual `ADMIN_PATH`)

## 🔄 Updating Your Password

1. Generate a new hash:
   ```bash
   tsx scripts/generate-password-hash.ts your-new-password
   ```

2. Update `ADMIN_PASSWORD_HASH` in `.env.local`

3. Restart your server

## 🛡️ Additional Security Features

### Rate Limiting
- 5 failed login attempts per 15 minutes per IP
- Automatic lockout after max attempts
- IP-based tracking

### Session Security
- HTTP-only cookies (prevents XSS)
- Secure cookies in production (HTTPS only)
- 8-hour session expiration
- Cryptographically secure session tokens

### Security Headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security
- Content-Security-Policy

## 🚨 Troubleshooting

### Can't login after setting password hash
- Make sure `ADMIN_PASSWORD_HASH` is exactly 64 characters (SHA-256)
- Check for extra spaces or newlines in `.env.local`
- Try regenerating the hash

### Admin path not working
- Check `ADMIN_PATH` in `.env.local` matches `next.config.ts` rewrites
- Restart your Next.js server after changing environment variables
- Check browser console for errors

### Session expires too quickly
- Default is 8 hours
- Can be adjusted in `lib/auth.ts` (SESSION_COOKIE maxAge)

## 📚 Files Modified

- `lib/admin-config.ts` - Admin path configuration
- `lib/auth.ts` - Enhanced password hashing
- `next.config.ts` - URL rewrites for secure path
- `app/robots.ts` - Blocks admin paths from search engines
- `scripts/generate-password-hash.ts` - Password hash generator

## 🔗 Related Documentation

- [Next.js Rewrites](https://nextjs.org/docs/app/api-reference/next-config-js/rewrites)
- [Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

