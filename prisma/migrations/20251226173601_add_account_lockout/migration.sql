-- AlterTable: Add account lockout fields to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accountLockedUntil" TIMESTAMP(3);

-- CreateIndex: Index for account lockout queries
CREATE INDEX IF NOT EXISTS "User_accountLockedUntil_idx" ON "User"("accountLockedUntil");
