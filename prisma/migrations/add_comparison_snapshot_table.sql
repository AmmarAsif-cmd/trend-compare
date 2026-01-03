-- Migration: Add ComparisonSnapshot table
-- This table stores snapshots of comparison metrics for tracking changes over time

-- Create ComparisonSnapshot table
CREATE TABLE IF NOT EXISTS "ComparisonSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "termA" TEXT NOT NULL,
    "termB" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "geo" TEXT NOT NULL DEFAULT '',
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "marginPoints" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "volatility" DOUBLE PRECISION NOT NULL,
    "agreementIndex" DOUBLE PRECISION NOT NULL,
    "winner" TEXT NOT NULL,
    "winnerScore" DOUBLE PRECISION NOT NULL,
    "loserScore" DOUBLE PRECISION NOT NULL,
    "category" TEXT,

    CONSTRAINT "ComparisonSnapshot_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "ComparisonSnapshot_userId_idx" ON "ComparisonSnapshot"("userId");
CREATE INDEX IF NOT EXISTS "ComparisonSnapshot_userId_slug_timeframe_geo_idx" ON "ComparisonSnapshot"("userId", "slug", "timeframe", "geo");
CREATE INDEX IF NOT EXISTS "ComparisonSnapshot_slug_idx" ON "ComparisonSnapshot"("slug");
CREATE INDEX IF NOT EXISTS "ComparisonSnapshot_computedAt_idx" ON "ComparisonSnapshot"("computedAt");

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ComparisonSnapshot_userId_fkey'
    ) THEN
        ALTER TABLE "ComparisonSnapshot" 
        ADD CONSTRAINT "ComparisonSnapshot_userId_fkey" 
        FOREIGN KEY ("userId") 
        REFERENCES "User"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
    END IF;
END $$;

