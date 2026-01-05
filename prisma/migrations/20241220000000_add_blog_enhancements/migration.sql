-- Add featured field to BlogPost
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false;

-- Add linkedComparisonSlugs array field
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "linkedComparisonSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add index for featured posts (for homepage queries)
CREATE INDEX IF NOT EXISTS "BlogPost_featured_idx" ON "BlogPost"("featured") WHERE "featured" = true AND "status" = 'published';

-- Add index for linkedComparisonSlugs (for comparison page queries)
-- Note: PostgreSQL GIN index for array containment queries
CREATE INDEX IF NOT EXISTS "BlogPost_linkedComparisonSlugs_idx" ON "BlogPost" USING GIN("linkedComparisonSlugs") WHERE "status" = 'published';

