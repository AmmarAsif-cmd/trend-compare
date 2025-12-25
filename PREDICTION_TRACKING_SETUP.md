# Prediction Tracking System Setup

## Overview
The prediction tracking system monitors forecast accuracy and displays verified statistics to users, building trust in our prediction model.

## Database Schema

Two new models have been added to `prisma/schema.prisma`:

1. **Prediction** - Stores individual predictions with their results
2. **PredictionStats** - Aggregated statistics for display

## Features

### ✅ Completed

1. **Prediction Storage**
   - All predictions are automatically saved to the database
   - Includes: predicted value, confidence, method, forecast date
   
2. **Prediction Verification**
   - Automatically verifies past predictions against actual data
   - Calculates accuracy percentage for each prediction
   - Runs in background when comparison pages are loaded

3. **Maximum Historical Data**
   - Always uses 5 years of historical data for predictions (if available)
   - Independent of user's selected timeframe
   - Falls back to 12 months if 5 years not available

4. **Prediction Accuracy Badge**
   - Shows average accuracy when 10+ predictions are verified
   - Displays confidence boost for users

5. **Clear UI**
   - Shows "Forecast for the next 30 days"
   - Displays amount of historical data analyzed
   - Lists statistical methods used

## Migration Required

Run the following migration to add the new tables:

```bash
npx prisma migrate dev --name add_prediction_tracking
```

Or manually add the SQL:

```sql
-- Create Prediction table
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "predictedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "forecastDate" TIMESTAMP(3) NOT NULL,
    "predictedValue" DOUBLE PRECISION NOT NULL,
    "actualValue" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Prediction_slug_term_idx" ON "Prediction"("slug", "term");
CREATE INDEX "Prediction_forecastDate_idx" ON "Prediction"("forecastDate");
CREATE INDEX "Prediction_verified_idx" ON "Prediction"("verified");
CREATE INDEX "Prediction_predictedDate_idx" ON "Prediction"("predictedDate");

-- Create PredictionStats table
CREATE TABLE "PredictionStats" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "totalPredictions" INTEGER NOT NULL DEFAULT 0,
    "verifiedPredictions" INTEGER NOT NULL DEFAULT 0,
    "averageAccuracy" DOUBLE PRECISION,
    "accuracyByMethod" JSONB,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PredictionStats_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PredictionStats_period_key" UNIQUE ("period")
);
```

## How It Works

1. **When a prediction is made:**
   - Saved to database with forecast date (future date)
   - `verified = false`, `actualValue = null`

2. **When comparison page loads:**
   - System fetches maximum historical data (5 years)
   - Verifies any predictions that should have actual data now (past forecast dates)
   - Updates accuracy scores

3. **Accuracy calculation:**
   - `error = |predictedValue - actualValue|`
   - `percentageError = (error / actualValue) * 100`
   - `accuracy = max(0, 100 - percentageError)`

4. **Display:**
   - After 10+ verified predictions, badge appears
   - Shows average accuracy across all verified predictions
   - Updates automatically as more predictions are verified

## API Endpoint

`GET /api/predictions/stats` - Returns aggregated prediction statistics

## Future Enhancements

- [ ] Show prediction accuracy over time (trend chart)
- [ ] Compare accuracy by method
- [ ] Prediction confidence intervals verification
- [ ] Export prediction data for analysis
- [ ] Alert system for high-accuracy predictions


