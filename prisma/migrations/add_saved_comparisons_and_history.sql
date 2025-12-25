-- Migration: Add SavedComparison and ComparisonHistory models
-- Run this SQL directly in your database

-- Create SavedComparison table
CREATE TABLE IF NOT EXISTS "SavedComparison" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "termA" TEXT NOT NULL,
    "termB" TEXT NOT NULL,
    "category" TEXT,
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedComparison_pkey" PRIMARY KEY ("id")
);

-- Create ComparisonHistory table
CREATE TABLE IF NOT EXISTS "ComparisonHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "termA" TEXT NOT NULL,
    "termB" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL DEFAULT '12m',
    "geo" TEXT NOT NULL DEFAULT '',
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComparisonHistory_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for SavedComparison (one save per user per comparison)
CREATE UNIQUE INDEX IF NOT EXISTS "SavedComparison_user_slug_unique" ON "SavedComparison"("userId", "slug");

-- Create indexes for SavedComparison
CREATE INDEX IF NOT EXISTS "SavedComparison_userId_idx" ON "SavedComparison"("userId");
CREATE INDEX IF NOT EXISTS "SavedComparison_slug_idx" ON "SavedComparison"("slug");
CREATE INDEX IF NOT EXISTS "SavedComparison_createdAt_idx" ON "SavedComparison"("createdAt");

-- Create indexes for ComparisonHistory
CREATE INDEX IF NOT EXISTS "ComparisonHistory_userId_idx" ON "ComparisonHistory"("userId");
CREATE INDEX IF NOT EXISTS "ComparisonHistory_userId_viewedAt_idx" ON "ComparisonHistory"("userId", "viewedAt");
CREATE INDEX IF NOT EXISTS "ComparisonHistory_slug_idx" ON "ComparisonHistory"("slug");
CREATE INDEX IF NOT EXISTS "ComparisonHistory_viewedAt_idx" ON "ComparisonHistory"("viewedAt");

-- Add foreign key constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'SavedComparison_userId_fkey'
    ) THEN
        ALTER TABLE "SavedComparison" 
        ADD CONSTRAINT "SavedComparison_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ComparisonHistory_userId_fkey'
    ) THEN
        ALTER TABLE "ComparisonHistory" 
        ADD CONSTRAINT "ComparisonHistory_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;


