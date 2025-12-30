-- Migration: Make password optional for OAuth users
-- Run this migration to allow OAuth users (Google sign-in) to have null passwords

ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;


