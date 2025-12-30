-- Migration: Add forgot password and last sign-in method tracking
-- Run this migration to add password reset functionality and sign-in method tracking

-- Add lastSignInMethod field (tracks "google" or "credentials")
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastSignInMethod" TEXT;

-- Add password reset token fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordResetToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordResetExpires" TIMESTAMP(3);

-- Add index for password reset token lookups
CREATE INDEX IF NOT EXISTS "User_passwordResetToken_idx" ON "User"("passwordResetToken");

