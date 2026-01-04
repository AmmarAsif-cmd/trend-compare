# Migration Fix Instructions

## Problem
Database has migrations that aren't in your local directory, causing drift. The database also has additional tables (harvest-related) that aren't in your schema.

## Solution Options

### Option 1: Use `prisma db push` (Recommended for Development)
This will sync your schema directly to the database without creating migration files:

```bash
npx prisma db push
```

This will:
- Add the Prediction and PredictionStats tables
- Keep all existing data
- Sync schema without migration history

### Option 2: Mark Missing Migrations as Applied (If you have the migration files)
If you have the migration SQL files, you can mark them as applied:

```bash
npx prisma migrate resolve --applied 20251106023553_add_harvest_tables
npx prisma migrate resolve --applied 20251127184000_add_harvest_keyword_suggestion
npx prisma migrate resolve --applied 20251213002426_add_keyword_category_and_comparison_category
```

Then create the new migration:
```bash
npx prisma migrate dev --name add_prediction_tracking
```

### Option 3: Manual SQL (If PowerShell blocks npx)
Run this SQL directly in your database:

```sql
-- Create Prediction table
CREATE TABLE IF NOT EXISTS "Prediction" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "predictedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "forecastDate" TIMESTAMP(3) NOT NULL,
    "predictedValue" DOUBLE PRECISION NOT NULL,
    "actualValue" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Prediction_slug_term_idx" ON "Prediction"("slug", "term");
CREATE INDEX IF NOT EXISTS "Prediction_forecastDate_idx" ON "Prediction"("forecastDate");
CREATE INDEX IF NOT EXISTS "Prediction_verified_idx" ON "Prediction"("verified");
CREATE INDEX IF NOT EXISTS "Prediction_predictedDate_idx" ON "Prediction"("predictedDate");

-- Create PredictionStats table
CREATE TABLE IF NOT EXISTS "PredictionStats" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "totalPredictions" INTEGER NOT NULL DEFAULT 0,
    "verifiedPredictions" INTEGER NOT NULL DEFAULT 0,
    "averageAccuracy" DOUBLE PRECISION,
    "accuracyByMethod" JSONB,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PredictionStats_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PredictionStats_period_key" UNIQUE ("period")
);
```

Then regenerate Prisma client:
```bash
npx prisma generate
```

## Recommended: Use Option 1 (db push)
Since you're in development and have PowerShell execution policy issues, `prisma db push` is the fastest and safest option.


