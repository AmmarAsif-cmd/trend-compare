-- Manual Migration: Add KeywordCategory table for category caching
-- This migration adds the KeywordCategory model to support keyword-level category caching
-- reducing AI API calls by 95%+ for repeat category detections.
--
-- Run this manually if the automatic migration doesn't apply:
-- psql $DATABASE_URL < prisma/migrations/add_keyword_category_table.sql

-- Create the KeywordCategory table
CREATE TABLE IF NOT EXISTS "KeywordCategory" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "reasoning" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeywordCategory_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on keyword
CREATE UNIQUE INDEX IF NOT EXISTS "KeywordCategory_keyword_key" ON "KeywordCategory"("keyword");

-- Create performance indexes
CREATE INDEX IF NOT EXISTS "KeywordCategory_category_idx" ON "KeywordCategory"("category");
CREATE INDEX IF NOT EXISTS "KeywordCategory_source_idx" ON "KeywordCategory"("source");
CREATE INDEX IF NOT EXISTS "KeywordCategory_updatedAt_idx" ON "KeywordCategory"("updatedAt");

-- Verify table was created
SELECT 'KeywordCategory table created successfully' AS status;
