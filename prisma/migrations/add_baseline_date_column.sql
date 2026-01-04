-- Migration: Add baselineDate column to TrendAlert table
-- This column stores the date when the baseline scores were recorded

-- Add baselineDate column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'TrendAlert' 
        AND column_name = 'baselineDate'
    ) THEN
        ALTER TABLE "TrendAlert" 
        ADD COLUMN "baselineDate" TIMESTAMP(3);
        
        -- Set baselineDate to createdAt for existing records
        UPDATE "TrendAlert" 
        SET "baselineDate" = "createdAt" 
        WHERE "baselineDate" IS NULL;
    END IF;
END $$;

