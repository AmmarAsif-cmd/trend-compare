-- Migration: Add PeakExplanationCache table
-- This migration adds the cache table for peak explanations

CREATE TABLE IF NOT EXISTS "PeakExplanationCache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "peakDate" TIMESTAMP(3) NOT NULL,
    "peakValue" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "events" TEXT,
    "bestEvent" TEXT,
    "citations" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "sourceCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PeakExplanationCache_pkey" PRIMARY KEY ("id")
);

-- Create unique index on cacheKey
CREATE UNIQUE INDEX IF NOT EXISTS "PeakExplanationCache_cacheKey_key" ON "PeakExplanationCache"("cacheKey");

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "PeakExplanationCache_keyword_idx" ON "PeakExplanationCache"("keyword");
CREATE INDEX IF NOT EXISTS "PeakExplanationCache_peakDate_idx" ON "PeakExplanationCache"("peakDate");
CREATE INDEX IF NOT EXISTS "PeakExplanationCache_lastAccessed_idx" ON "PeakExplanationCache"("lastAccessed");
CREATE INDEX IF NOT EXISTS "PeakExplanationCache_status_idx" ON "PeakExplanationCache"("status");

-- Add comments
COMMENT ON TABLE "PeakExplanationCache" IS 'Caches peak explanations to reduce API costs. Historical events never change, so cache forever.';
COMMENT ON COLUMN "PeakExplanationCache"."cacheKey" IS 'Format: "keyword:YYYY-MM-DD"';
COMMENT ON COLUMN "PeakExplanationCache"."status" IS 'verified | probable | possible | unknown';

