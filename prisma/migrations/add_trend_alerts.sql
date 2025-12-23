-- Migration: Add TrendAlert model for email alerts
-- Run this SQL directly in your database

CREATE TABLE IF NOT EXISTS "TrendAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "termA" TEXT NOT NULL,
    "termB" TEXT NOT NULL,
    "alertType" TEXT NOT NULL, -- 'score_change', 'position_change', 'threshold', 'custom'
    "threshold" INTEGER, -- For threshold alerts (e.g., score > 75)
    "baselineScoreA" INTEGER, -- Baseline score for termA when alert was created
    "baselineScoreB" INTEGER, -- Baseline score for termB when alert was created
    "changePercent" INTEGER DEFAULT 10, -- Percentage change to trigger alert (default 10%)
    "frequency" TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'weekly', 'instant'
    "status" TEXT NOT NULL DEFAULT 'active', -- 'active', 'paused', 'deleted'
    "lastTriggered" TIMESTAMP(3),
    "lastChecked" TIMESTAMP(3),
    "notifyCount" INTEGER DEFAULT 0, -- How many times this alert has fired
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrendAlert_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "TrendAlert_userId_idx" ON "TrendAlert"("userId");
CREATE INDEX IF NOT EXISTS "TrendAlert_slug_idx" ON "TrendAlert"("slug");
CREATE INDEX IF NOT EXISTS "TrendAlert_status_idx" ON "TrendAlert"("status");
CREATE INDEX IF NOT EXISTS "TrendAlert_lastChecked_idx" ON "TrendAlert"("lastChecked");

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrendAlert_userId_fkey') THEN
        ALTER TABLE "TrendAlert" 
        ADD CONSTRAINT "TrendAlert_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;


