-- Manual Migration: Add Prediction Tracking Tables
-- Run this SQL directly in your database
-- This won't affect existing tables

-- Create Prediction table
CREATE TABLE IF NOT EXISTS "Prediction" (
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

-- Create indexes for Prediction table
CREATE INDEX IF NOT EXISTS "Prediction_slug_term_idx" ON "Prediction"("slug", "term");
CREATE INDEX IF NOT EXISTS "Prediction_forecastDate_idx" ON "Prediction"("forecastDate");
CREATE INDEX IF NOT EXISTS "Prediction_verified_idx" ON "Prediction"("verified");
CREATE INDEX IF NOT EXISTS "Prediction_predictedDate_idx" ON "Prediction"("predictedDate");

-- Create PredictionStats table
CREATE TABLE IF NOT EXISTS "PredictionStats" (
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

-- Verify tables were created
SELECT 'Prediction table created successfully' AS status;
SELECT 'PredictionStats table created successfully' AS status;


