# Fix Column Type Mismatch Error

## Problem
The error "incorrect binary data format in bind parameter 8" occurs because:
- Your database has `INTEGER` columns (from `add_trend_alerts.sql` migration)
- Prisma schema expects `Float?` (DOUBLE PRECISION)
- This causes a type mismatch when inserting data

## Solution

### Step 1: Update Database Column Types
Run this SQL in your Neon database to change INTEGER columns to DOUBLE PRECISION:

```sql
-- Migration: Fix TrendAlert column types to match Prisma schema
-- This ensures all numeric columns are DOUBLE PRECISION (Float) to match Prisma Float? type

DO $$
BEGIN
    -- Change threshold from INTEGER to DOUBLE PRECISION if needed
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'TrendAlert' 
        AND column_name = 'threshold'
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE "TrendAlert" 
        ALTER COLUMN "threshold" TYPE DOUBLE PRECISION;
    END IF;

    -- Change baselineScoreA from INTEGER to DOUBLE PRECISION if needed
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'TrendAlert' 
        AND column_name = 'baselineScoreA'
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE "TrendAlert" 
        ALTER COLUMN "baselineScoreA" TYPE DOUBLE PRECISION;
    END IF;

    -- Change baselineScoreB from INTEGER to DOUBLE PRECISION if needed
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'TrendAlert' 
        AND column_name = 'baselineScoreB'
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE "TrendAlert" 
        ALTER COLUMN "baselineScoreB" TYPE DOUBLE PRECISION;
    END IF;

    -- Change changePercent from INTEGER to DOUBLE PRECISION if needed
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'TrendAlert' 
        AND column_name = 'changePercent'
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE "TrendAlert" 
        ALTER COLUMN "changePercent" TYPE DOUBLE PRECISION;
    END IF;
END $$;
```

### Step 2: Regenerate Prisma Client

After running the SQL, regenerate Prisma client using one of these methods:

**Option 1: Use the safe script**
```bash
node scripts/prisma-generate-safe.js
```

**Option 2: Use PowerShell with bypass**
```powershell
powershell -ExecutionPolicy Bypass -Command "npx prisma generate"
```

**Option 3: Use cmd instead of PowerShell**
```cmd
cmd /c "npx prisma generate"
```

## What Was Changed

1. ✅ Updated Prisma schema to use `Float?` for numeric columns
2. ✅ Updated code to pass numbers correctly
3. ✅ Created migration SQL to update database column types
4. ⏳ **YOU NEED TO:** Run the SQL migration and regenerate Prisma client

## Why This Happened

You likely ran the `add_trend_alerts.sql` migration which uses `INTEGER` types, but the Prisma schema now expects `Float?` (DOUBLE PRECISION). The migration above will align the database with the Prisma schema.

After completing both steps, the type mismatch error should be resolved!

