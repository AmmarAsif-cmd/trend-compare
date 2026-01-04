# WARMUP_SECRET Setup Guide

## What is WARMUP_SECRET?

`WARMUP_SECRET` is a security token used to authenticate requests to the `/api/jobs/run-warmup` endpoint. It prevents unauthorized access to the warmup job execution endpoint.

## How to Generate a Secret

### Option 1: Using OpenSSL (Recommended)
```bash
openssl rand -hex 32
```

This generates a 64-character hexadecimal string, for example:
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

### Option 2: Using Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Option 3: Online Generator
Use a secure random string generator like:
- https://randomkeygen.com/
- Use the "CodeIgniter Encryption Keys" or similar (64+ characters)

### Option 4: PowerShell (Windows)
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
```

## Where to Set It

### 1. Local Development (.env.local)

Create or edit `.env.local` in your project root:

```env
WARMUP_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

**Important:** `.env.local` should already be in your `.gitignore` file (it should NOT be committed to version control).

### 2. Production Environment

#### Vercel:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add a new variable:
   - **Name:** `WARMUP_SECRET`
   - **Value:** (paste your generated secret)
   - **Environment:** Production, Preview, Development (as needed)

#### Other Platforms:
Set it in your platform's environment variable settings (similar process).

## Security Best Practices

1. **Use a strong, random string** (at least 32 characters, preferably 64+)
2. **Never commit secrets to git** - always use `.env.local` or environment variables
3. **Use different secrets** for development, staging, and production
4. **Rotate secrets periodically** (especially if compromised)
5. **Keep it secret** - don't share it in chat, emails, or logs

## How It's Used

The warmup execution endpoint (`/api/jobs/run-warmup`) checks for this secret:

```typescript
const secret = request.headers.get('X-Warmup-Secret');
const expectedSecret = process.env.WARMUP_SECRET;

if (secret !== expectedSecret) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

When the premium endpoint triggers a warmup, it includes this header:
```typescript
fetch('/api/jobs/run-warmup', {
  headers: {
    'X-Warmup-Secret': process.env.WARMUP_SECRET,
  },
});
```

## Testing

After setting the secret, test that warmup works:

1. Make a request to the premium endpoint:
   ```bash
   curl "http://localhost:3000/api/comparison/premium?slug=amazon-vs-costco&tf=12m"
   ```

2. Check the response for `warmupStatus: "queued"`

3. The warmup job should execute (check logs for `[RunWarmup] Processing job...`)

4. Make the request again and check for `warmupStatus: "ready"` and `forecastAvailable: true`

## Troubleshooting

**Error: "Warmup service is not configured"**
- Make sure `WARMUP_SECRET` is set in your environment
- Restart your development server after adding it

**Error: "Unauthorized"**
- Check that the secret matches exactly (no extra spaces or characters)
- Verify it's set in the correct environment file

**Warmup not executing:**
- Check that the secret is being read: `console.log(process.env.WARMUP_SECRET)` (remove after testing!)
- Verify the fetch call includes the `X-Warmup-Secret` header

---

**Remember:** Generate a new secret for each environment and keep it secure!

