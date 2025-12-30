# 🚀 Quick Start - Running & Testing the Application

## Prerequisites Check

Before running, make sure you have:
- ✅ Node.js 20+ installed
- ✅ PostgreSQL database (local or cloud like Neon, Supabase)
- ✅ Environment variables configured (`.env.local`)

---

## Step 1: Install Dependencies

```bash
cd trend-compare
npm install
```

---

## Step 2: Set Up Environment Variables

Create `.env.local` file in the root directory:

```env
# Required
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
TRENDS_MODE=google

# Required for AI features
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Authentication (if using user accounts)
AUTH_SECRET=your_random_32_byte_string
NEXTAUTH_SECRET=your_random_32_byte_string

# Optional - Multi-source data
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
TMDB_API_KEY=your_tmdb_api_key
STEAM_API_KEY=your_steam_api_key
BESTBUY_API_KEY=your_bestbuy_api_key
GITHUB_TOKEN=your_github_token
NEWS_API_KEY=your_newsapi_key
```

**Generate AUTH_SECRET:**
```bash
# On Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Or use online tool: https://generate-secret.vercel.app/32
```

---

## Step 3: Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Optional: View database in Prisma Studio
npx prisma studio
```

---

## Step 4: Run Development Server

```bash
npm run dev
```

The application will start at: **http://localhost:3000**

---

## 🧪 Testing the Freemium Model Fixes

### Test 1: Daily Limit (20 comparisons/day)

1. **Create a free user account:**
   - Go to http://localhost:3000/signup
   - Create a new account (free tier by default)

2. **Test the limit:**
   - Make 20 comparisons (e.g., "iphone vs android", "netflix vs disney", etc.)
   - On the 21st comparison, you should see a limit message
   - Check that the limit message says "20 comparisons/day"

3. **Verify in code:**
   - Check `lib/daily-limit.ts` - should show `FREE_USER_DAILY_LIMIT = 20`

### Test 2: ActionableInsightsPanel (Premium Only)

1. **As a free user:**
   - Go to any comparison page (e.g., http://localhost:3000/compare/iphone-vs-android)
   - Scroll down to where ActionableInsightsPanel should be
   - **Expected:** Panel should NOT be visible

2. **As a premium user:**
   - Upgrade account to premium (or manually set in database)
   - Go to the same comparison page
   - **Expected:** ActionableInsightsPanel should be visible

3. **Verify in code:**
   - Check `app/compare/[slug]/page.tsx` around line 951
   - Should see: `{hasPremiumAccess && (<ActionableInsightsPanel ... />)}`

### Test 3: SimplePrediction Replaced with Upgrade Prompt

1. **As a free user:**
   - Go to any comparison page
   - Look for predictions section
   - **Expected:** Should see upgrade prompt with "🔮 30-Day Trend Predictions" and "PREMIUM" badge
   - Should NOT see SimplePrediction component

2. **As a premium user:**
   - Go to the same comparison page
   - **Expected:** Should see full TrendPrediction component (not upgrade prompt)

3. **Verify in code:**
   - Check `app/compare/[slug]/page.tsx` around line 999
   - Should see upgrade prompt section instead of `<SimplePrediction />`

---

## 🔍 Manual Database Testing

### Check User Tier in Database

```bash
# Open Prisma Studio
npx prisma studio

# Navigate to User table
# Check the `tier` field:
# - "free" = Free user
# - "premium" = Premium user
```

### Manually Set User to Premium (for testing)

```sql
-- In Prisma Studio SQL tab or your database client:
UPDATE "User" SET tier = 'premium' WHERE email = 'your-test-email@example.com';
```

---

## 🐛 Troubleshooting

### Issue: "Prisma Client not generated"
```bash
npx prisma generate
```

### Issue: "Database connection error"
- Check your `DATABASE_URL` in `.env.local`
- Verify database is running and accessible
- Test connection: `npx prisma db pull`

### Issue: "Module not found"
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Port 3000 already in use"
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
npm run dev -- -p 3001
```

---

## 📊 Quick Test Checklist

- [ ] Development server starts without errors
- [ ] Can access homepage at http://localhost:3000
- [ ] Can create a free user account
- [ ] Daily limit shows "20 comparisons/day" (not 50)
- [ ] Free users don't see ActionableInsightsPanel
- [ ] Free users see upgrade prompt instead of SimplePrediction
- [ ] Premium users see all features
- [ ] Can make comparisons successfully

---

## 🎯 Next Steps After Testing

Once testing is complete:
1. Commit your changes
2. Push to the branch
3. Create a pull request if needed
4. Deploy to staging/production

---

**Happy Testing! 🚀**

