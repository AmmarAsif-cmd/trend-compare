-- Add trial tracking fields to User table
-- This enables 7-day trial period for new signups

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "trialStartedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);

-- Add index for querying expired trials
CREATE INDEX IF NOT EXISTS "User_trialEndsAt_subscriptionTier_idx"
ON "User"("trialEndsAt", "subscriptionTier");

-- Update existing free users to have null trial dates
-- (They never had a trial, so they shouldn't get one retroactively)
UPDATE "User"
SET "trialStartedAt" = NULL, "trialEndsAt" = NULL
WHERE "subscriptionTier" = 'free'
  AND "trialStartedAt" IS NULL;

SELECT 'Trial fields added successfully' AS status;
