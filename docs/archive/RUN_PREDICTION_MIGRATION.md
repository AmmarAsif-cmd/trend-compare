# 🚀 Run Prediction Tracking Migration

## Quick Setup

Since your database has drift (missing migration files), we'll add the Prediction tables manually using SQL.

## Option 1: Run SQL Directly (Recommended)

1. **Connect to your database** (using your database client or psql)
2. **Run the SQL file**:
   ```sql
   -- Copy and paste the contents of:
   prisma/migrations/add_prediction_tracking_manual.sql
   ```

Or use psql:
```bash
psql "your-database-connection-string" -f prisma/migrations/add_prediction_tracking_manual.sql
```

## Option 2: Use Prisma Studio (If Available)

1. Open Prisma Studio:
   ```bash
   npx prisma studio
   ```
2. Go to the SQL Editor
3. Paste the SQL from `prisma/migrations/add_prediction_tracking_manual.sql`
4. Execute

## Option 3: Accept Data Loss (Only if harvest tables aren't needed)

If the harvest-related tables (ApiConfig, AutomatedRun, HarvestItem, etc.) aren't needed, you can use:

```bash
npx prisma db push --accept-data-loss
```

⚠️ **WARNING**: This will drop those tables and their data!

## After Running Migration

1. **Regenerate Prisma Client**:
   ```bash
   npx prisma generate
   ```

2. **Verify tables exist**:
   ```bash
   npx prisma studio
   ```
   Check that `Prediction` and `PredictionStats` tables appear.

## What This Migration Adds

- ✅ `Prediction` table - Stores individual predictions
- ✅ `PredictionStats` table - Stores aggregated statistics
- ✅ All necessary indexes for performance

## Next Steps

Once the tables are created, the prediction tracking system will automatically:
- Save all predictions to the database
- Verify predictions against actual data
- Display accuracy statistics to users


