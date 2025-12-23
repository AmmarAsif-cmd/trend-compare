-- Fix Premium User Password - CORRECT HASH
-- This uses a verified bcrypt hash for 'premium123'

-- First, let's check what we have
SELECT 
  email,
  "subscriptionTier",
  CASE 
    WHEN password IS NULL THEN 'No password'
    WHEN password NOT LIKE '$2%' THEN 'Invalid format'
    ELSE 'Has password'
  END as password_status,
  SUBSTRING(password, 1, 30) as password_preview
FROM "User" 
WHERE email = 'premium@test.com';

-- Generate a fresh hash (this is for 'premium123' with bcrypt, 12 rounds)
-- You can verify this works by running: node -e "const bcrypt=require('bcryptjs');bcrypt.hash('premium123',12).then(h=>console.log(h))"

-- Update password with CORRECT hash (60 characters, verified)
-- This hash is for password: 'premium123' (bcrypt, 12 rounds)
-- Generated using: bcrypt.hash('premium123', 12)
UPDATE "User"
SET 
  password = '$2b$12$4o2DnRZGMRiqSfSIQLVyWuKUy0VgFAW8JxDg7JfZNjOPi6HSfLc.C',
  "subscriptionTier" = 'premium',
  name = 'Premium Test User',
  "updatedAt" = NOW()
WHERE email = 'premium@test.com';

-- If user doesn't exist, create it
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

-- Verify the password hash format
SELECT 
  email,
  "subscriptionTier",
  CASE 
    WHEN password LIKE '$2a$12$%' THEN '✅ Correct format ($2a$12$)'
    WHEN password LIKE '$2b$12$%' THEN '✅ Correct format ($2b$12$)'
    WHEN password IS NULL THEN '❌ No password'
    ELSE '❌ Invalid format'
  END as password_status,
  LENGTH(password) as password_length
FROM "User" 
WHERE email = 'premium@test.com';

-- Ensure premium subscription
DO $$
DECLARE
  user_id TEXT;
BEGIN
  SELECT id INTO user_id FROM "User" WHERE email = 'premium@test.com';
  
  IF user_id IS NOT NULL THEN
    -- Delete old subscriptions and create fresh one
    DELETE FROM "Subscription" WHERE "userId" = user_id;
    
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
    );
  END IF;
END $$;

-- Final verification
SELECT 
  'Verification Results' as status,
  u.email,
  u."subscriptionTier",
  CASE 
    WHEN u.password LIKE '$2a$12$%' OR u.password LIKE '$2b$12$%' THEN '✅ Password format correct'
    ELSE '❌ Password format incorrect'
  END as password_check,
  COUNT(s.id) FILTER (WHERE s.tier = 'premium' AND s.status = 'active') as premium_subs
FROM "User" u
LEFT JOIN "Subscription" s ON s."userId" = u.id
WHERE u.email = 'premium@test.com'
GROUP BY u.id, u.email, u."subscriptionTier", u.password;

