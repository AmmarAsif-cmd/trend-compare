-- Migration: Add PdfJob table for PDF export job queue
-- Run this SQL directly in your database

-- Create PdfJob table
CREATE TABLE IF NOT EXISTS "PdfJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "geo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "fileUrl" TEXT,
    "signedUrl" TEXT,
    "signedUrlExpiresAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PdfJob_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "PdfJob_user_slug_timeframe_geo_key" 
    ON "PdfJob"("userId", "slug", "timeframe", "geo");

-- Create indexes
CREATE INDEX IF NOT EXISTS "PdfJob_userId_idx" ON "PdfJob"("userId");
CREATE INDEX IF NOT EXISTS "PdfJob_slug_idx" ON "PdfJob"("slug");
CREATE INDEX IF NOT EXISTS "PdfJob_status_idx" ON "PdfJob"("status");
CREATE INDEX IF NOT EXISTS "PdfJob_createdAt_idx" ON "PdfJob"("createdAt");

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'PdfJob_userId_fkey'
    ) THEN
        ALTER TABLE "PdfJob" 
        ADD CONSTRAINT "PdfJob_userId_fkey" 
        FOREIGN KEY ("userId") 
        REFERENCES "User"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
    END IF;
END $$;

