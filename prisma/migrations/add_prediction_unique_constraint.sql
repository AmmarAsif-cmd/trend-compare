-- Add unique constraint to prevent duplicate predictions
-- Run this SQL to add the constraint to existing database

-- First, remove any duplicate predictions (keep the most recent one)
DELETE FROM "Prediction" p1
WHERE EXISTS (
  SELECT 1 FROM "Prediction" p2
  WHERE p2.slug = p1.slug
    AND p2.term = p1.term
    AND p2."forecastDate" = p1."forecastDate"
    AND p2."predictedDate" > p1."predictedDate"
);

-- Add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "Prediction_slug_term_forecastDate_key" 
ON "Prediction"("slug", "term", "forecastDate");


