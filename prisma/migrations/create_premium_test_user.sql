-- Migration: Create Premium Test User
-- Run this SQL directly in your database

-- Note: The password hash below is for 'premium123'
-- Generated using: bcrypt.hash('premium123', 12)
-- Hash: $2b$12$4o2DnRZGMRiqSfSIQLVyWuKUy0VgFAW8JxDg7JfZNjOPi6HSfLc.C

-- Create or update premium test user
INSERT INTO "User" (id, email, name, password, "subscriptionTier", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'premium@test.com',
  'Premium Test User',
  '$2b$12$4o2DnRZGMRiqSfSIQLVyWuKUy0VgFAW8JxDg7JfZNjOPi6HSfLc.C', -- bcrypt hash of 'premium123'
  'premium',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET 
  "subscriptionTier" = 'premium',
  "updatedAt" = NOW();

-- Get the user ID
DO $$
DECLARE
  user_id TEXT;
BEGIN
  SELECT id INTO user_id FROM "User" WHERE email = 'premium@test.com';
  
  -- Create or update active premium subscription
  INSERT INTO "Subscription" (id, "userId", tier, status, "currentPeriodStart", "currentPeriodEnd", "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid()::text,
    user_id,
    'premium',
    'active',
    NOW(),
    NOW() + INTERVAL '30 days',
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING;
  
  -- If subscription exists but is not active, update it
  UPDATE "Subscription"
  SET 
    status = 'active',
    tier = 'premium',
    "currentPeriodStart" = NOW(),
    "currentPeriodEnd" = NOW() + INTERVAL '30 days',
    "updatedAt" = NOW()
  WHERE "userId" = user_id AND (status != 'active' OR tier != 'premium');
  
  RAISE NOTICE 'Premium test user created/updated successfully!';
  RAISE NOTICE 'Email: premium@test.com';
  RAISE NOTICE 'Password: premium123';
END $$;

