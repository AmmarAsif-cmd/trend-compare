# Debug Prediction Tracking

## Issue
Predictions aren't being saved to the database even though tables exist.

## Debugging Steps

### 1. Check if Prisma Client is Updated
```bash
npx prisma generate
```

### 2. Run Test Script
```bash
npx tsx test-prediction-save.ts
```

This will:
- Verify Prisma can access the Prediction table
- Try to save a test prediction
- Verify it was saved
- Clean up test data

### 3. Check Server Logs

When you visit a comparison page, look for these log messages:

**If predictions are generated:**
```
[Predictions] ✅ Using X data points for predictions
[Predictions] 💾 Saving 30 predictions for termA (slug: ...)
[PredictionTracking] ✅ Saved prediction: { id: ..., slug: ..., term: ... }
```

**If predictions fail:**
```
[Predictions] ⚠️ No predictions to save for termA: { hasPredictions: false, ... }
[PredictionTracking] ❌ Failed to save prediction: { error: ..., code: ... }
```

### 4. Common Issues

#### Issue: Predictions not generating
**Symptoms:** No `[Predictions] ✅ Using X data points` log
**Fix:** Check if `getMaxHistoricalData()` is working and returning data

#### Issue: Empty slug
**Symptoms:** `[Predictions] ⚠️ Cannot save prediction: slug is empty`
**Fix:** Check if `canonical` variable is set correctly

#### Issue: Prisma model not found
**Symptoms:** `PrismaClientValidationError: Unknown arg 'prediction'`
**Fix:** Run `npx prisma generate`

#### Issue: Database connection
**Symptoms:** `P1001: Can't reach database server`
**Fix:** Check DATABASE_URL in .env

### 5. Manual Database Check

Query the database directly:
```sql
SELECT COUNT(*) FROM "Prediction";
SELECT * FROM "Prediction" ORDER BY "createdAt" DESC LIMIT 10;
```

### 6. Enable Prisma Query Logging

The Prisma client is already configured to log queries in development. Check your console for SQL queries when predictions are saved.

## Next Steps

1. Run the test script first
2. Check server logs when visiting a comparison page
3. Share the error messages you see


