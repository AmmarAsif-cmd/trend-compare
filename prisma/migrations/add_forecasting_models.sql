-- Migration: Add forecasting models
-- Created: 2024-01-01
-- Description: Adds ForecastRun, ForecastPoint, ForecastEvaluation, and ForecastTrustStats models

-- Add forecastRuns relation to Comparison
-- (Already handled by Prisma schema update)

-- Create ForecastRun table
CREATE TABLE IF NOT EXISTS "ForecastRun" (
    "id" TEXT NOT NULL,
    "comparisonId" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "horizon" INTEGER NOT NULL DEFAULT 28,
    "dataHash" TEXT NOT NULL,
    "modelTermA" TEXT NOT NULL,
    "modelTermB" TEXT NOT NULL,
    "confidenceScoreA" INTEGER NOT NULL,
    "confidenceScoreB" INTEGER NOT NULL,
    "metricsA" JSONB NOT NULL,
    "metricsB" JSONB NOT NULL,
    "qualityFlagsA" JSONB NOT NULL,
    "qualityFlagsB" JSONB NOT NULL,
    "winnerProbability" DOUBLE PRECISION,
    "expectedMargin" DOUBLE PRECISION,
    "leadChangeRisk" TEXT,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluatedAt" TIMESTAMP(3),

    CONSTRAINT "ForecastRun_pkey" PRIMARY KEY ("id")
);

-- Create ForecastPoint table
CREATE TABLE IF NOT EXISTS "ForecastPoint" (
    "id" TEXT NOT NULL,
    "forecastRunId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "lower80" DOUBLE PRECISION NOT NULL,
    "upper80" DOUBLE PRECISION NOT NULL,
    "lower95" DOUBLE PRECISION NOT NULL,
    "upper95" DOUBLE PRECISION NOT NULL,
    "actualValue" DOUBLE PRECISION,

    CONSTRAINT "ForecastPoint_pkey" PRIMARY KEY ("id")
);

-- Create ForecastEvaluation table
CREATE TABLE IF NOT EXISTS "ForecastEvaluation" (
    "id" TEXT NOT NULL,
    "forecastRunId" TEXT NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "winnerCorrect" BOOLEAN,
    "directionCorrectA" BOOLEAN,
    "directionCorrectB" BOOLEAN,
    "intervalHitRate80" DOUBLE PRECISION,
    "intervalHitRate95" DOUBLE PRECISION,
    "mae" DOUBLE PRECISION,
    "mape" DOUBLE PRECISION,
    "evaluatedPoints" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ForecastEvaluation_pkey" PRIMARY KEY ("id")
);

-- Create ForecastTrustStats table
CREATE TABLE IF NOT EXISTS "ForecastTrustStats" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "totalEvaluated" INTEGER NOT NULL DEFAULT 0,
    "winnerAccuracyPercent" DOUBLE PRECISION,
    "intervalCoveragePercent" DOUBLE PRECISION,
    "last90DaysAccuracy" DOUBLE PRECISION,
    "sampleSize" INTEGER NOT NULL DEFAULT 0,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForecastTrustStats_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "ForecastRun_comparisonId_idx" ON "ForecastRun"("comparisonId");
CREATE INDEX IF NOT EXISTS "ForecastRun_computedAt_idx" ON "ForecastRun"("computedAt");
CREATE INDEX IF NOT EXISTS "ForecastRun_evaluatedAt_idx" ON "ForecastRun"("evaluatedAt");

CREATE INDEX IF NOT EXISTS "ForecastPoint_forecastRunId_idx" ON "ForecastPoint"("forecastRunId");
CREATE INDEX IF NOT EXISTS "ForecastPoint_date_idx" ON "ForecastPoint"("date");

CREATE INDEX IF NOT EXISTS "ForecastEvaluation_forecastRunId_idx" ON "ForecastEvaluation"("forecastRunId");
CREATE INDEX IF NOT EXISTS "ForecastEvaluation_evaluatedAt_idx" ON "ForecastEvaluation"("evaluatedAt");

CREATE INDEX IF NOT EXISTS "ForecastTrustStats_period_idx" ON "ForecastTrustStats"("period");

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "forecast_run_unique" ON "ForecastRun"("comparisonId", "timeframe", "horizon", "dataHash");
CREATE UNIQUE INDEX IF NOT EXISTS "forecast_point_unique" ON "ForecastPoint"("forecastRunId", "term", "date");
CREATE UNIQUE INDEX IF NOT EXISTS "forecast_evaluation_unique" ON "ForecastEvaluation"("forecastRunId");
CREATE UNIQUE INDEX IF NOT EXISTS "ForecastTrustStats_period_key" ON "ForecastTrustStats"("period");

-- Add foreign key constraints
ALTER TABLE "ForecastRun" ADD CONSTRAINT "ForecastRun_comparisonId_fkey" FOREIGN KEY ("comparisonId") REFERENCES "Comparison"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ForecastPoint" ADD CONSTRAINT "ForecastPoint_forecastRunId_fkey" FOREIGN KEY ("forecastRunId") REFERENCES "ForecastRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ForecastEvaluation" ADD CONSTRAINT "ForecastEvaluation_forecastRunId_fkey" FOREIGN KEY ("forecastRunId") REFERENCES "ForecastRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;


