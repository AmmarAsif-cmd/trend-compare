-- AlterTable: Make userId optional and add ipAddress for anonymous users
ALTER TABLE "ComparisonHistory" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "ComparisonHistory" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;

-- CreateIndex: Add indexes for anonymous user tracking
CREATE INDEX IF NOT EXISTS "ComparisonHistory_ipAddress_idx" ON "ComparisonHistory"("ipAddress");
CREATE INDEX IF NOT EXISTS "ComparisonHistory_ipAddress_viewedAt_idx" ON "ComparisonHistory"("ipAddress", "viewedAt");
