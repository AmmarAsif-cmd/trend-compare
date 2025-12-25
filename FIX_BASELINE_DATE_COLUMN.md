# Fix baselineDate Column Issue

## Problem
The `TrendAlert.baselineDate` column is missing from the database, causing errors when creating alerts.

## Solution

### Step 1: Run the Migration SQL
Copy and execute this SQL in your Neon database:

```sql
-- Migration: Add baselineDate column to TrendAlert table
-- This column stores the date when the baseline scores were recorded

-- Add baselineDate column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'TrendAlert' 
        AND column_name = 'baselineDate'
    ) THEN
        ALTER TABLE "TrendAlert" 
        ADD COLUMN "baselineDate" TIMESTAMP(3);
        
        -- Set baselineDate to createdAt for existing records
        UPDATE "TrendAlert" 
        SET "baselineDate" = "createdAt" 
        WHERE "baselineDate" IS NULL;
    END IF;
END $$;
```

### Step 2: Regenerate Prisma Client

After running the SQL, regenerate the Prisma client:

```bash
npx prisma generate
```

Or if that doesn't work:

```bash
node node_modules\.bin\prisma generate
```

Or use the safe script:

```bash
node scripts/prisma-generate-safe.js
```

## What Was Fixed

1. ✅ Added `baselineDate` field to `prisma/schema.prisma`
2. ✅ Updated `lib/trend-alerts.ts` to set `baselineDate` when creating alerts
3. ✅ Created migration SQL file (`prisma/migrations/add_baseline_date_column.sql`)

The `baselineDate` field stores the timestamp when the baseline scores were recorded, which helps track when the alert was set up relative to the current scores.

