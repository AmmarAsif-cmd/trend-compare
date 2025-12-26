-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "trialStartedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_trialEndsAt_subscriptionTier_idx" ON "User"("trialEndsAt", "subscriptionTier");
