# 🔐 NextAuth Secret Setup (AUTH_SECRET)

## Quick Fix

NextAuth v5 beta requires `AUTH_SECRET` environment variable. Here's how to set it up:

### Option 1: Generate Secret with Script (Recommended)

```bash
tsx scripts/generate-auth-secret.ts
```

Copy the output and add it to your `.env.local` file.

### Option 2: Generate Secret Manually

**On Windows (PowerShell):**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**On Mac/Linux:**
```bash
openssl rand -base64 32
```

Copy the output and add to your `.env.local` file.

### Step 3: Add to .env.local

Create or edit `.env.local` in your project root:

```env
# NextAuth Secret (Required for authentication)
AUTH_SECRET=your-generated-secret-here

# NextAuth URL (for local development)
AUTH_URL=http://localhost:3000
```

### Step 4: Restart Server

After adding the secret, **restart your development server**:

1. Stop the server (Ctrl+C)
2. Start again: `npm run dev`

The error should be gone!

---

## What is AUTH_SECRET?

`AUTH_SECRET` is used by NextAuth.js to:
- Encrypt session tokens
- Sign cookies securely
- Generate secure session IDs

**Important:** Keep this secret safe! Never commit it to git.

---

## For Production

In production (e.g., Vercel), add `AUTH_SECRET` as an environment variable:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - Key: `AUTH_SECRET`
   - Value: (your generated secret)
   - Environments: Production, Preview, Development
3. Redeploy

---

## Troubleshooting

### Error Still Appears After Adding Secret?

1. ✅ Make sure `.env.local` is in the project root (not in a subfolder)
2. ✅ Make sure the file is named exactly `.env.local` (not `.env.local.txt`)
3. ✅ Restart the development server completely
4. ✅ Check that there are no spaces around the `=` sign: `AUTH_SECRET=value` (not `AUTH_SECRET = value`)

### Still Having Issues?

Check your `.env.local` file format:

```env
# ✅ Correct
AUTH_SECRET=abc123xyz456

# ❌ Wrong (spaces)
AUTH_SECRET = abc123xyz456

# ❌ Wrong (quotes - not needed)
AUTH_SECRET="abc123xyz456"
```

---

## Quick Reference

**Generate Secret:**
```bash
tsx scripts/generate-auth-secret.ts
```

**Add to .env.local:**
```env
AUTH_SECRET=<generated-secret>
AUTH_URL=http://localhost:3000
```

**Restart Server:**
```bash
npm run dev
```


