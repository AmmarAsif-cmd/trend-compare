-- Migration: Fix TrendAlert column types to match Prisma schema
-- This ensures all numeric columns are DOUBLE PRECISION (Float) to match Prisma Float? type

DO $$
BEGIN
    -- Change threshold from INTEGER to DOUBLE PRECISION if needed
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'TrendAlert' 
        AND column_name = 'threshold'
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE "TrendAlert" 
        ALTER COLUMN "threshold" TYPE DOUBLE PRECISION;
    END IF;

    -- Change baselineScoreA from INTEGER to DOUBLE PRECISION if needed
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'TrendAlert' 
        AND column_name = 'baselineScoreA'
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE "TrendAlert" 
        ALTER COLUMN "baselineScoreA" TYPE DOUBLE PRECISION;
    END IF;

    -- Change baselineScoreB from INTEGER to DOUBLE PRECISION if needed
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'TrendAlert' 
        AND column_name = 'baselineScoreB'
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE "TrendAlert" 
        ALTER COLUMN "baselineScoreB" TYPE DOUBLE PRECISION;
    END IF;

    -- Change changePercent from INTEGER to DOUBLE PRECISION if needed
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'TrendAlert' 
        AND column_name = 'changePercent'
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE "TrendAlert" 
        ALTER COLUMN "changePercent" TYPE DOUBLE PRECISION;
    END IF;
END $$;

