# 📱 Running Migrations from Your Phone

Since you're on your phone, here are several ways to run the database migration:

---

## ✅ RECOMMENDED: Let Vercel Handle It Automatically

**Easiest option - no manual work needed!**

When you push to your branch, Vercel will:
1. Detect the schema change
2. Run the migration automatically during deployment
3. Everything works ✨

**What to do:**
1. Just push your branch (already done ✅)
2. Merge PR or deploy the branch
3. Vercel runs the migration automatically

The build script already includes:
```json
"build": "... && node scripts/migrate-if-db-available.js && next build"
```

---

## Option 2: Run Via Vercel Dashboard (Phone-Friendly)

1. **Open Vercel app on your phone** (or browser):
   - Go to https://vercel.com/dashboard
   - Find your project

2. **Trigger a redeploy:**
   - Go to Deployments tab
   - Click latest deployment
   - Click "Redeploy" button
   - Migration runs automatically ✅

3. **Check logs:**
   - View deployment logs
   - Look for: "Migration complete"

---

## Option 3: Vercel CLI (If you have terminal access on phone)

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login
vercel login

# Run migration in production
vercel env pull .env.production
DATABASE_URL=your_db_url npx prisma migrate deploy
```

---

## Option 4: Direct Database Access (Advanced)

If you have database access (Neon, Supabase, etc.):

1. **Copy the SQL from migration file:**
   ```
   prisma/migrations/20241221_add_keyword_pairs/migration.sql
   ```

2. **Run it in your database dashboard:**
   - Open Neon/Supabase dashboard on phone
   - Go to SQL Editor
   - Paste and run the SQL
   - Done! ✅

**SQL to run:**
```sql
CREATE TABLE "KeywordPair" (
    "id" TEXT NOT NULL,
    "termA" TEXT NOT NULL,
    "termB" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "qualityScore" INTEGER NOT NULL,
    "searchVolume" TEXT DEFAULT 'unknown',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'manual',
    "importedFrom" TEXT,
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "KeywordPair_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "unique_pair" ON "KeywordPair"("termA", "termB");
CREATE INDEX "KeywordPair_category_idx" ON "KeywordPair"("category");
CREATE INDEX "KeywordPair_status_idx" ON "KeywordPair"("status");
CREATE INDEX "KeywordPair_qualityScore_idx" ON "KeywordPair"("qualityScore");
CREATE INDEX "KeywordPair_source_idx" ON "KeywordPair"("source");
```

---

## Option 5: GitHub Actions (Automated)

Create a workflow file to run migrations automatically:

**File:** `.github/workflows/migrate.yml`

```yaml
name: Run Database Migration

on:
  workflow_dispatch: # Manual trigger from phone
  push:
    branches:
      - main
    paths:
      - 'prisma/schema.prisma'

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

**To trigger from phone:**
1. Go to GitHub repo on phone
2. Actions tab
3. Select "Run Database Migration"
4. Click "Run workflow"

---

## ⚡ QUICKEST FOR YOU RIGHT NOW

Since you're on phone, I recommend:

### **Option A: Wait for Vercel (Zero effort)**
1. Merge your PR or deploy branch
2. Vercel auto-runs migration
3. Done in ~2 minutes ✅

### **Option B: Run SQL directly (1 minute)**
1. Open your database dashboard (Neon/Supabase)
2. Go to SQL Editor
3. Copy SQL from above
4. Run it
5. Done! ✅

---

## 🔍 How to Verify Migration Worked

After running migration (any method):

1. **Check in database dashboard:**
   - Look for `KeywordPair` table
   - Should have all columns

2. **Test the admin page:**
   - Visit: `https://your-domain.com/admin/keywords`
   - Should load without errors

3. **Try importing keywords:**
   ```bash
   npm run keywords:import-seed
   ```

---

## 📋 Migration File Created

I've created the migration file for you:
```
✅ prisma/migrations/20241221_add_keyword_pairs/migration.sql
```

This file will be automatically applied when:
- Vercel deploys your app
- You run `npx prisma migrate deploy`
- You run the SQL manually

---

## 🚨 Important Notes

1. **Migration is safe** - Only adds new table, doesn't modify existing data
2. **No downtime** - Can run while app is live
3. **Reversible** - Can drop table if needed (but you won't need to)

---

## 🎯 Recommended Next Steps (From Phone)

1. **Option A - Let Vercel handle it:**
   - Merge your PR to main branch
   - Vercel auto-deploys and runs migration
   - Visit `/admin/keywords` to verify

2. **Option B - Quick manual:**
   - Open database SQL editor
   - Run the SQL above
   - Redeploy on Vercel
   - Visit `/admin/keywords`

**Either way, you're ready to go! 🚀**

---

Need help with any of these options? Let me know which one you'd prefer!
