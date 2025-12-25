-- Migration: Add WarmupJob table for forecast warmup job queue
-- Run this SQL directly in your database

-- Create WarmupJob table
CREATE TABLE IF NOT EXISTS "WarmupJob" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "geo" TEXT NOT NULL,
    "dataHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "debugId" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "WarmupJob_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint (matching Prisma schema name)
CREATE UNIQUE INDEX IF NOT EXISTS "WarmupJob_warmup_job_unique_key"
    ON "WarmupJob"("slug", "timeframe", "geo", "dataHash");
    
-- Note: Prisma will create this constraint with the name "warmup_job_unique"
-- If you see an error about the constraint name, you may need to:
-- 1. Let Prisma create the table first, OR
-- 2. Rename the constraint to match Prisma's expected name

-- Create indexes
CREATE INDEX IF NOT EXISTS "WarmupJob_status_idx" ON "WarmupJob"("status");
CREATE INDEX IF NOT EXISTS "WarmupJob_slug_idx" ON "WarmupJob"("slug");
CREATE INDEX IF NOT EXISTS "WarmupJob_createdAt_idx" ON "WarmupJob"("createdAt");
CREATE INDEX IF NOT EXISTS "WarmupJob_status_createdAt_idx" ON "WarmupJob"("status", "createdAt");

-- Add comment for status enum values
COMMENT ON COLUMN "WarmupJob"."status" IS 'Status: queued, running, ready, failed';

