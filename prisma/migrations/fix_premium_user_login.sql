-- Fix Premium User Login
-- Run this SQL in your Neon database console to fix the premium user login issue

-- Step 1: Check current user status
SELECT 
  id, 
  email, 
  "subscriptionTier",
  CASE 
    WHEN password IS NULL THEN '❌ No password'
    WHEN LENGTH(password) < 20 THEN '❌ Invalid password format'
    ELSE '✅ Has password'
  END as password_status,
  name
FROM "User" 
WHERE email = 'premium@test.com';

-- Step 2: Update user with correct password hash
-- This hash is for password: 'premium123' (bcrypt, 12 rounds)
-- Generated using: bcrypt.hash('premium123', 12)
-- CORRECT HASH (60 characters):
UPDATE "User"
SET 
  password = '$2b$12$4o2DnRZGMRiqSfSIQLVyWuKUy0VgFAW8JxDg7JfZNjOPi6HSfLc.C',
  "subscriptionTier" = 'premium',
  name = 'Premium Test User',
  "updatedAt" = NOW()
WHERE email = 'premium@test.com';

-- Step 3: If user doesn't exist, create it
INSERT INTO "User" (id, email, name, password, "subscriptionTier", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text,
  'premium@test.com',
  'Premium Test User',
  '$2b$12$4o2DnRZGMRiqSfSIQLVyWuKUy0VgFAW8JxDg7JfZNjOPi6HSfLc.C',
  'premium',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "User" WHERE email = 'premium@test.com'
);

-- Step 4: Ensure active premium subscription exists
DO $$
DECLARE
  user_id TEXT;
BEGIN
  -- Get user ID
  SELECT id INTO user_id FROM "User" WHERE email = 'premium@test.com';
  
  IF user_id IS NOT NULL THEN
    -- Create subscription if it doesn't exist
    INSERT INTO "Subscription" (id, "userId", tier, status, "currentPeriodStart", "currentPeriodEnd", "createdAt", "updatedAt")
    SELECT 
      gen_random_uuid()::text,
      user_id,
      'premium',
      'active',
      NOW(),
      NOW() + INTERVAL '30 days',
      NOW(),
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM "Subscription" 
      WHERE "userId" = user_id 
        AND tier = 'premium' 
        AND status = 'active'
    );
    
    -- Update existing subscription if it's not active or not premium
    UPDATE "Subscription"
    SET 
      tier = 'premium',
      status = 'active',
      "currentPeriodStart" = NOW(),
      "currentPeriodEnd" = NOW() + INTERVAL '30 days',
      "updatedAt" = NOW()
    WHERE "userId" = user_id 
      AND (tier != 'premium' OR status != 'active');
  END IF;
END $$;

-- Step 5: Verify the fix
SELECT 
  u.email,
  u."subscriptionTier",
  CASE 
    WHEN u.password IS NOT NULL AND LENGTH(u.password) > 20 THEN '✅ Password set'
    ELSE '❌ No password'
  END as password_status,
  COUNT(s.id) FILTER (WHERE s.status = 'active' AND s.tier = 'premium') as active_premium_subs,
  u.name
FROM "User" u
LEFT JOIN "Subscription" s ON s."userId" = u.id
WHERE u.email = 'premium@test.com'
GROUP BY u.id, u.email, u."subscriptionTier", u.password, u.name;

-- Expected result:
-- email: premium@test.com
-- subscriptionTier: premium
-- password_status: ✅ Password set
-- active_premium_subs: 1
-- name: Premium Test User

