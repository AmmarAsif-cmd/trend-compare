-- Add email verification token fields to User table
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "emailVerificationToken" TEXT,
ADD COLUMN IF NOT EXISTS "emailVerificationExpires" TIMESTAMP(3);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS "User_emailVerificationToken_idx" ON "User"("emailVerificationToken");

