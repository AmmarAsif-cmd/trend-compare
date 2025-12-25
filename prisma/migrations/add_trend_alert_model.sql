-- Migration: Add TrendAlert Model
-- This migration adds the TrendAlert table for premium email alerts feature

-- Create TrendAlert table
CREATE TABLE IF NOT EXISTS "TrendAlert" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "termA" TEXT NOT NULL,
  "termB" TEXT NOT NULL,
  "alertType" TEXT NOT NULL,
  "threshold" DOUBLE PRECISION,
  "changePercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
  "frequency" TEXT NOT NULL DEFAULT 'daily',
  "status" TEXT NOT NULL DEFAULT 'active',
  "baselineScoreA" DOUBLE PRECISION,
  "baselineScoreB" DOUBLE PRECISION,
  "baselineDate" TIMESTAMP(3),
  "lastChecked" TIMESTAMP(3),
  "lastTriggered" TIMESTAMP(3),
  "notifyCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TrendAlert_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "TrendAlert" ADD CONSTRAINT "TrendAlert_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS "TrendAlert_userId_idx" ON "TrendAlert"("userId");
CREATE INDEX IF NOT EXISTS "TrendAlert_slug_idx" ON "TrendAlert"("slug");
CREATE INDEX IF NOT EXISTS "TrendAlert_status_idx" ON "TrendAlert"("status");
CREATE INDEX IF NOT EXISTS "TrendAlert_lastChecked_idx" ON "TrendAlert"("lastChecked");
CREATE INDEX IF NOT EXISTS "TrendAlert_frequency_idx" ON "TrendAlert"("frequency");

