# 🚨 FIX: User Table Does Not Exist

## The Problem

Error: `The table 'public.User' does not exist in the current database.`

This means the database migration hasn't been run yet.

## ✅ Solution: Run Database Migration

### Step 1: Open Your Database Console

You need to run SQL commands in your database. Use one of these:

- **pgAdmin** (if using PostgreSQL locally)
- **Supabase Dashboard** (if using Supabase) → SQL Editor
- **Neon Console** (if using Neon) → SQL Editor
- **DBeaver** or any database client
- **psql** command line (if installed)

### Step 2: Run Migration SQL

**Copy the SQL from this file:** `prisma/migrations/manual_add_user_subscription.sql`

Or run this SQL directly:

```sql
-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Create Subscription table
CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "stripeProductId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "trialStart" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- Create regular indexes for performance
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_subscriptionTier_idx" ON "User"("subscriptionTier");
CREATE INDEX IF NOT EXISTS "User_stripeCustomerId_idx" ON "User"("stripeCustomerId");
CREATE INDEX IF NOT EXISTS "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX IF NOT EXISTS "Subscription_stripeSubscriptionId_idx" ON "Subscription"("stripeSubscriptionId");

-- Add foreign key constraint
ALTER TABLE "Subscription" 
ADD CONSTRAINT "Subscription_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### Step 3: Run Saved Comparisons Migration (Optional but Recommended)

After the User/Subscription migration works, also run:

```sql
-- Create SavedComparison table
CREATE TABLE IF NOT EXISTS "SavedComparison" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "termA" TEXT NOT NULL,
    "termB" TEXT NOT NULL,
    "category" TEXT,
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedComparison_pkey" PRIMARY KEY ("id")
);

-- Create ComparisonHistory table
CREATE TABLE IF NOT EXISTS "ComparisonHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "termA" TEXT NOT NULL,
    "termB" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL DEFAULT '12m',
    "geo" TEXT NOT NULL DEFAULT '',
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComparisonHistory_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for SavedComparison
CREATE UNIQUE INDEX IF NOT EXISTS "SavedComparison_user_slug_unique" ON "SavedComparison"("userId", "slug");

-- Create indexes
CREATE INDEX IF NOT EXISTS "SavedComparison_userId_idx" ON "SavedComparison"("userId");
CREATE INDEX IF NOT EXISTS "SavedComparison_slug_idx" ON "SavedComparison"("slug");
CREATE INDEX IF NOT EXISTS "SavedComparison_createdAt_idx" ON "SavedComparison"("createdAt");

CREATE INDEX IF NOT EXISTS "ComparisonHistory_userId_idx" ON "ComparisonHistory"("userId");
CREATE INDEX IF NOT EXISTS "ComparisonHistory_userId_viewedAt_idx" ON "ComparisonHistory"("userId", "viewedAt");
CREATE INDEX IF NOT EXISTS "ComparisonHistory_slug_idx" ON "ComparisonHistory"("slug");
CREATE INDEX IF NOT EXISTS "ComparisonHistory_viewedAt_idx" ON "ComparisonHistory"("viewedAt");

-- Add foreign key constraints
ALTER TABLE "SavedComparison" 
ADD CONSTRAINT "SavedComparison_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ComparisonHistory" 
ADD CONSTRAINT "ComparisonHistory_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### Step 4: Verify Tables Created

Run this SQL to verify:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('User', 'Subscription', 'SavedComparison', 'ComparisonHistory');
```

You should see all 4 tables listed.

### Step 5: Generate Prisma Client

After migration, run this in **Command Prompt** (not PowerShell):

```bash
npx prisma generate
```

### Step 6: Restart Server

Restart your development server.

### Step 7: Test Again

1. Visit: `http://localhost:3000/signup`
2. Try creating an account
3. Should work now! ✅

---

## How to Run SQL

### If using Supabase:
1. Go to Supabase Dashboard
2. Click "SQL Editor" in left sidebar
3. Paste the SQL above
4. Click "Run"

### If using Neon:
1. Go to Neon Console
2. Click "SQL Editor"
3. Paste the SQL above
4. Click "Run"

### If using pgAdmin (PostgreSQL):
1. Open pgAdmin
2. Connect to your database
3. Right-click on database → Query Tool
4. Paste SQL
5. Click Execute (F5)

### If using DBeaver:
1. Connect to database
2. Right-click on database → SQL Editor → New SQL Script
3. Paste SQL
4. Click Execute (Ctrl+Enter)

---

## Quick Copy-Paste SQL

**Full migration SQL (copy this entire block):**

```sql
-- ============================================
-- USER AND SUBSCRIPTION TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "stripeProductId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "trialStart" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_subscriptionTier_idx" ON "User"("subscriptionTier");
CREATE INDEX IF NOT EXISTS "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Subscription_userId_fkey') THEN
        ALTER TABLE "Subscription" 
        ADD CONSTRAINT "Subscription_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================
-- SAVED COMPARISONS AND HISTORY TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS "SavedComparison" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "termA" TEXT NOT NULL,
    "termB" TEXT NOT NULL,
    "category" TEXT,
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SavedComparison_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ComparisonHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "termA" TEXT NOT NULL,
    "termB" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL DEFAULT '12m',
    "geo" TEXT NOT NULL DEFAULT '',
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ComparisonHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SavedComparison_user_slug_unique" ON "SavedComparison"("userId", "slug");
CREATE INDEX IF NOT EXISTS "SavedComparison_userId_idx" ON "SavedComparison"("userId");
CREATE INDEX IF NOT EXISTS "SavedComparison_slug_idx" ON "SavedComparison"("slug");
CREATE INDEX IF NOT EXISTS "SavedComparison_createdAt_idx" ON "SavedComparison"("createdAt");
CREATE INDEX IF NOT EXISTS "ComparisonHistory_userId_idx" ON "ComparisonHistory"("userId");
CREATE INDEX IF NOT EXISTS "ComparisonHistory_userId_viewedAt_idx" ON "ComparisonHistory"("userId", "viewedAt");
CREATE INDEX IF NOT EXISTS "ComparisonHistory_slug_idx" ON "ComparisonHistory"("slug");
CREATE INDEX IF NOT EXISTS "ComparisonHistory_viewedAt_idx" ON "ComparisonHistory"("viewedAt");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SavedComparison_userId_fkey') THEN
        ALTER TABLE "SavedComparison" 
        ADD CONSTRAINT "SavedComparison_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ComparisonHistory_userId_fkey') THEN
        ALTER TABLE "ComparisonHistory" 
        ADD CONSTRAINT "ComparisonHistory_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
```

**Copy the entire SQL block above and run it in your database console.**

---

## After Running Migration

1. ✅ Run: `npx prisma generate` (in Command Prompt)
2. ✅ Restart your development server
3. ✅ Try signup again at `/signup`

The error should be gone! 🎉


