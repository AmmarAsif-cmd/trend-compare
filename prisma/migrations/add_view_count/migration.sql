-- Add viewCount column to Comparison table
ALTER TABLE "Comparison" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0;

-- Create index for sorting by popularity
CREATE INDEX IF NOT EXISTS "Comparison_viewCount_idx" ON "Comparison"("viewCount");

