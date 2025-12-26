-- Manual Migration Application Script
-- Run this if automatic migrations fail on Vercel
--
-- Usage:
--   psql $DATABASE_URL < scripts/apply-migration-manually.sql
--
-- This script is idempotent - safe to run multiple times

-- Check if _prisma_migrations table exists
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "finished_at" TIMESTAMP(3),
    "migration_name" TEXT NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);

-- Apply KeywordCategory table migration
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

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "KeywordCategory_keyword_key" ON "KeywordCategory"("keyword");
CREATE INDEX IF NOT EXISTS "KeywordCategory_category_idx" ON "KeywordCategory"("category");
CREATE INDEX IF NOT EXISTS "KeywordCategory_source_idx" ON "KeywordCategory"("source");
CREATE INDEX IF NOT EXISTS "KeywordCategory_updatedAt_idx" ON "KeywordCategory"("updatedAt");

-- Record migration in _prisma_migrations
INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "logs", "started_at", "finished_at", "applied_steps_count")
VALUES (
    '20251225214109_add_keyword_category',
    '1',
    '20251225214109_add_keyword_category',
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    1
)
ON CONFLICT ("id") DO NOTHING;

-- Verify table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'KeywordCategory') THEN
        RAISE NOTICE '✅ KeywordCategory table exists and is ready';
    ELSE
        RAISE EXCEPTION '❌ KeywordCategory table creation failed';
    END IF;
END $$;

SELECT '✅ Migration applied successfully' AS status;
