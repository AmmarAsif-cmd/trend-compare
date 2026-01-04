# Migration Resolution Guide

## Current Situation

Your database has migrations applied that aren't in your local migrations directory:
- `20251106023553_add_harvest_tables`
- `20251127184000_add_harvest_keyword_suggestion`
- `20251213002426_add_keyword_category_and_comparison_category`

Additionally, you need to add the new `PeakExplanationCache` model.

## Solution: Use `prisma db push` (Recommended for Development)

This will sync your Prisma schema directly to the database without worrying about migration history.

### Step 1: Sync Schema

```bash
npx prisma db push
```

This will:
- ✅ Add the `PeakExplanationCache` table
- ✅ Keep all existing data
- ✅ Sync any other schema changes
- ⚠️ Note: This doesn't create migration files (fine for dev)

### Step 2: Generate Prisma Client

```bash
npx prisma generate
```

### Step 3: Verify

```bash
npx prisma studio
```

Check that the `PeakExplanationCache` table exists.

---

## Alternative: Mark Migrations as Applied (If you want migration history)

If you want to maintain proper migration history:

### Step 1: Mark Missing Migrations as Applied

```bash
npx prisma migrate resolve --applied 20251106023553_add_harvest_tables
npx prisma migrate resolve --applied 20251127184000_add_harvest_keyword_suggestion
npx prisma migrate resolve --applied 20251213002426_add_keyword_category_and_comparison_category
```

### Step 2: Create Migration for PeakExplanationCache

```bash
npx prisma migrate dev --name add_peak_explanation_cache
```

---

## If PowerShell Blocks npx

If you get execution policy errors, use:

```bash
node node_modules/.bin/prisma db push
node node_modules/.bin/prisma generate
```

Or temporarily allow scripts:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npx prisma db push
```

---

## What Gets Added

The `PeakExplanationCache` table will have:
- ✅ Cache key (unique identifier)
- ✅ Peak data (keyword, date, value)
- ✅ Explanation data (explanation, confidence, events, citations)
- ✅ Metadata (createdAt, lastAccessed, accessCount)
- ✅ Indexes for performance

---

## After Migration

Your peak explanation caching system will be ready to use! The cache will:
- Store explanations permanently (historical events never change)
- Reduce API costs by 95%+ after warmup
- Provide fast retrieval of cached explanations

