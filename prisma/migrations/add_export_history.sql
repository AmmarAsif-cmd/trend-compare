-- Migration: Add ExportHistory table to track all user exports
-- Run this SQL directly in your database

CREATE TABLE IF NOT EXISTS "ExportHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "termA" TEXT NOT NULL,
    "termB" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL DEFAULT '12m',
    "geo" TEXT NOT NULL DEFAULT '',
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExportHistory_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "ExportHistory_userId_idx" ON "ExportHistory"("userId");
CREATE INDEX IF NOT EXISTS "ExportHistory_userId_createdAt_idx" ON "ExportHistory"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "ExportHistory_slug_idx" ON "ExportHistory"("slug");
CREATE INDEX IF NOT EXISTS "ExportHistory_type_idx" ON "ExportHistory"("type");
CREATE INDEX IF NOT EXISTS "ExportHistory_createdAt_idx" ON "ExportHistory"("createdAt");

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ExportHistory_userId_fkey'
    ) THEN
        ALTER TABLE "ExportHistory" 
        ADD CONSTRAINT "ExportHistory_userId_fkey" 
        FOREIGN KEY ("userId") 
        REFERENCES "User"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
    END IF;
END $$;

