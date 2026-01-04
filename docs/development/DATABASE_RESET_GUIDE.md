# 🔄 Database Reset & Migration Guide

## Current Situation

Your database has tables that exist but aren't in your local Prisma schema, and there are migrations applied to the database that are missing from your local migrations directory.

**Missing Migrations:**
- `20251106023553_add_harvest_tables`
- `20251127184000_add_harvest_keyword_suggestion`
- `20251213002426_add_keyword_category_and_comparison_category`

**New Schema Changes:**
- Added `TrendAlert` model (for premium email alerts)

---

## ⚠️ Important: Data Loss Warning

**Resetting the database will DELETE ALL DATA.** This includes:
- All users and accounts
- All saved comparisons
- All comparison history
- All subscriptions
- All predictions
- All alerts
- Everything else

**Only proceed if:**
- This is a development database
- You have backups of important data
- You're okay losing all current data

---

## Option 1: Reset Database (Recommended for Development)

If this is a development database and you're okay losing data:

### Step 1: Create Baseline Migration

```bash
# This will create a migration that matches your current schema
npx prisma migrate dev --name baseline_schema --create-only
```

### Step 2: Reset Database

```bash
# This will drop all tables and recreate them
npx prisma migrate reset
```

### Step 3: Apply Migrations

```bash
# This will apply all migrations including the new TrendAlert
npx prisma migrate deploy
```

---

## Option 2: Create Baseline Migration (Preserves Data)

If you want to preserve existing data:

### Step 1: Mark Existing Migrations as Applied

```bash
# This tells Prisma that existing migrations are already applied
npx prisma migrate resolve --applied 20251106023553_add_harvest_tables
npx prisma migrate resolve --applied 20251127184000_add_harvest_keyword_suggestion
npx prisma migrate resolve --applied 20251213002426_add_keyword_category_and_comparison_category
```

### Step 2: Create Migration for TrendAlert

```bash
# Create a new migration for the TrendAlert model
npx prisma migrate dev --name add_trend_alert_model
```

### Step 3: Apply Migration

```bash
# Apply the new migration
npx prisma migrate deploy
```

---

## Option 3: Manual SQL Migration (If Prisma Commands Fail)

If PowerShell execution policy blocks Prisma commands:

### Step 1: Run SQL Migration

1. Open your database console (Supabase/Neon/pgAdmin)
2. Open `prisma/migrations/add_trend_alert_model.sql`
3. Copy and run the SQL in your database

### Step 2: Mark as Applied

```bash
# Mark the migration as applied (if you can run this)
npx prisma migrate resolve --applied add_trend_alert_model
```

### Step 3: Generate Prisma Client

```bash
# Regenerate Prisma client to include TrendAlert
npx prisma generate
```

---

## Recommended Approach for Your Situation

Since you have a development database and want to sync everything:

### Quick Reset (Fastest, Loses Data)

```bash
# 1. Reset database (drops all tables)
npx prisma migrate reset

# 2. This will prompt you - type "y" to confirm

# 3. Prisma will automatically:
#    - Drop all tables
#    - Create all tables from schema
#    - Apply all migrations
#    - Generate Prisma client
```

### If PowerShell Blocks Commands

1. **Use Command Prompt (cmd) instead of PowerShell:**
   ```cmd
   cd C:\Users\User\Desktop\Project\trned-compare-cursor\trend-compare
   npx prisma migrate reset
   ```

2. **Or run SQL directly:**
   - Open `prisma/migrations/add_trend_alert_model.sql`
   - Run it in your database console
   - Then run `npx prisma generate` (if possible)

---

## After Reset/Migration

1. **Verify Schema:**
   ```bash
   npx prisma db pull  # Pulls current DB schema
   npx prisma format   # Formats schema file
   ```

2. **Test Connection:**
   ```bash
   npx prisma studio   # Opens Prisma Studio to view data
   ```

3. **Recreate Test Users:**
   - Run your test user creation scripts again
   - Or use the SQL migrations for test users

---

## Files Created

- ✅ `prisma/migrations/add_trend_alert_model.sql` - SQL migration for TrendAlert
- ✅ `DATABASE_RESET_GUIDE.md` - This guide

---

## Next Steps After Reset

1. ✅ Database schema synced
2. ⏳ Create test users (premium and free)
3. ⏳ Test premium features
4. ⏳ Continue implementing premium features

---

**Need Help?** If you encounter issues, check:
- Database connection string in `.env`
- Prisma client is generated (`npx prisma generate`)
- All environment variables are set

