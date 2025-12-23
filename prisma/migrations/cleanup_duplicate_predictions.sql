-- CRITICAL: Clean up duplicate predictions
-- Run this SQL to remove all duplicates before the fix takes effect

-- Step 1: Remove duplicate predictions, keeping the most recent one
DELETE FROM "Prediction" p1
WHERE EXISTS (
  SELECT 1 FROM "Prediction" p2
  WHERE p2.slug = p1.slug
    AND p2.term = p1.term
    AND DATE(p2."forecastDate") = DATE(p1."forecastDate")
    AND p2."predictedDate" > p1."predictedDate"
);

-- Step 2: Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'Prediction_slug_term_forecastDate_key'
  ) THEN
    CREATE UNIQUE INDEX "Prediction_slug_term_forecastDate_key" 
    ON "Prediction"(slug, term, DATE("forecastDate"));
    
    RAISE NOTICE 'Unique constraint created successfully';
  ELSE
    RAISE NOTICE 'Unique constraint already exists';
  END IF;
END $$;

-- Step 3: Verify cleanup
SELECT 
  slug, 
  term, 
  COUNT(*) as prediction_count,
  MIN("forecastDate") as earliest,
  MAX("forecastDate") as latest
FROM "Prediction"
GROUP BY slug, term
HAVING COUNT(*) > 60
ORDER BY prediction_count DESC;

-- Expected: Each (slug, term) should have max 30 predictions (30-day forecast)
-- If you see counts > 60, there may still be duplicates - investigate those specific slugs/terms


