-- Migration: Add performance indexes for faster queries
-- Run this SQL directly in your database

-- Indexes for Comparison table
CREATE INDEX IF NOT EXISTS "Comparison_slug_idx" ON "Comparison"("slug");
CREATE INDEX IF NOT EXISTS "Comparison_category_idx" ON "Comparison"("category");
CREATE INDEX IF NOT EXISTS "Comparison_timeframe_geo_idx" ON "Comparison"("timeframe", "geo");
CREATE INDEX IF NOT EXISTS "Comparison_updatedAt_idx" ON "Comparison"("updatedAt");

-- Indexes for ComparisonSnapshot (for dashboard)
CREATE INDEX IF NOT EXISTS "ComparisonSnapshot_userId_slug_idx" ON "ComparisonSnapshot"("userId", "slug");
CREATE INDEX IF NOT EXISTS "ComparisonSnapshot_computedAt_idx" ON "ComparisonSnapshot"("computedAt");

-- Indexes for ExportHistory
CREATE INDEX IF NOT EXISTS "ExportHistory_userId_createdAt_idx" ON "ExportHistory"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "ExportHistory_type_createdAt_idx" ON "ExportHistory"("type", "createdAt");

-- Indexes for TrendAlert (for cron jobs)
CREATE INDEX IF NOT EXISTS "TrendAlert_status_lastChecked_idx" ON "TrendAlert"("status", "lastChecked");
CREATE INDEX IF NOT EXISTS "TrendAlert_frequency_status_idx" ON "TrendAlert"("frequency", "status");

-- Indexes for SavedComparison (for dashboard)
CREATE INDEX IF NOT EXISTS "SavedComparison_userId_createdAt_idx" ON "SavedComparison"("userId", "createdAt");

-- Indexes for ComparisonHistory (for dashboard)
CREATE INDEX IF NOT EXISTS "ComparisonHistory_userId_viewedAt_idx" ON "ComparisonHistory"("userId", "viewedAt");

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS "Comparison_slug_timeframe_geo_composite_idx" 
  ON "Comparison"("slug", "timeframe", "geo") 
  WHERE "slug" IS NOT NULL;

