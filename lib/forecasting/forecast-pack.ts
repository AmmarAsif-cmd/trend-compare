/**
 * Forecast Pack Builder
 * 
 * Uses gap-based forecasting for comparisons.
 * Forecasts the GAP (difference) between two trend indices instead of
 * forecasting each series independently.
 */

import { prisma } from '@/lib/db';
import { createHash } from 'crypto';
import { calculateTrendArcScoreTimeSeries, type TrendArcScoreTimeSeries } from '@/lib/trendarc-score-time-series';
import type { ComparisonCategory } from '@/lib/category-resolver';
import type { SeriesPoint } from '@/lib/trends';
import { forecastGap, getGapForecastInsights, type GapForecastResult } from './gap-forecaster';
import type { TimeSeriesPoint, ForecastResult } from './core';
import type { HeadToHeadForecast } from './head-to-head';

export interface ForecastPack {
  // Gap-based forecast (new approach)
  gapForecast: GapForecastResult;
  gapInsights: {
    expectedMarginInHorizon: number;
    leadChangeRisk: number;
    confidenceLabel: 'low' | 'medium' | 'high';
    confidenceScore: number;
  };
  // Legacy fields (deprecated, kept for backward compatibility)
  // These will be computed from gap forecast if needed
  termA?: any; // Deprecated
  termB?: any; // Deprecated
  headToHead?: any; // Deprecated
  computedAt: string; // ISO 8601
  dataHash: string;
  horizon: number;
}

/**
 * Create hash of series data for cache invalidation
 */
function hashSeriesData(series: SeriesPoint[]): string {
  const dataStr = JSON.stringify(series.map(p => ({ date: p.date, value: (p as any)[Object.keys(p).find(k => k !== 'date') || ''] || 0 })));
  return createHash('sha256').update(dataStr).digest('hex').substring(0, 16);
}

/**
 * Convert series format from comparison data to TimeSeriesPoint[]
 * Uses TrendArc Score (multi-source combined data) instead of raw Google Trends
 * This provides more accurate forecasts using the same data shown in the main chart
 */
function convertToTimeSeries(
  series: SeriesPoint[],
  term: string,
  category: ComparisonCategory = 'general'
): TimeSeriesPoint[] {
  if (!series || series.length === 0) return [];

  // Use TrendArc Score time-series instead of raw Google Trends
  // This combines Google Trends + momentum + category weights (same as main chart)
  const trendArcScores = calculateTrendArcScoreTimeSeries(series as any, term, category);

  if (trendArcScores.length === 0) {
    console.warn(`[ForecastPack] TrendArc Score calculation returned empty for term "${term}", falling back to raw Google Trends`);
    
    // Fallback to raw Google Trends if TrendArc Score fails
    const firstPoint = series[0];
    if (!firstPoint || typeof firstPoint !== 'object') return [];

    const availableKeys = Object.keys(firstPoint).filter(k => k !== 'date');
    const normalizeKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, '');

    const termKey = availableKeys.find(k => {
      const keyNormalized = normalizeKey(k);
      const termNormalized = normalizeKey(term);
      return (
        k.toLowerCase() === term.toLowerCase() ||
        keyNormalized === termNormalized ||
        k.toLowerCase().replace(/\s+/g, '-') === term.toLowerCase() ||
        k.toLowerCase().replace(/-/g, ' ') === term.toLowerCase()
      );
    }) || availableKeys[0];

    if (!termKey) {
      console.warn(`[ForecastPack] No matching key found for term "${term}" in series. Available keys:`, availableKeys);
      return [];
    }

    const timeSeries = series
      .map(point => ({
        date: String(point.date),
        value: Number((point[termKey] as number | string) || 0),
      }))
      .filter(point => isFinite(point.value) && point.value >= 0)
      .sort((a, b) => a.date.localeCompare(b.date));

    return timeSeries;
  }

  // Convert TrendArc Score time-series to TimeSeriesPoint[]
  const timeSeries = trendArcScores
    .map(score => ({
      date: String(score.date),
      value: score.score, // Use TrendArc Score (0-100) instead of raw Google Trends
    }))
    .filter(point => isFinite(point.value) && point.value >= 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Log for debugging
  if (timeSeries.length > 0) {
    const values = timeSeries.map(p => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    console.log(`[ForecastPack] Using TrendArc Score time-series for "${term}" (category: ${category}):`, {
      length: timeSeries.length,
      min: min.toFixed(2),
      max: max.toFixed(2),
      avg: avg.toFixed(2),
      firstValue: timeSeries[0].value.toFixed(2),
      lastValue: timeSeries[timeSeries.length - 1].value.toFixed(2),
      note: 'Multi-source combined data (Google Trends + momentum + category weights)',
    });
  }

  return timeSeries;
}

/**
 * Load forecast from database cache
 */
async function loadCachedForecast(
  comparisonId: string,
  timeframe: string,
  horizon: number,
  dataHash: string
): Promise<ForecastPack | null> {
  try {
    const forecastRun = await prisma.forecastRun.findUnique({
      where: {
        forecast_run_unique: {
          comparisonId,
          timeframe,
          horizon,
          dataHash,
        },
      },
      include: {
        forecastPoints: {
          where: {
            term: 'termA',
          },
          orderBy: {
            date: 'asc',
          },
        },
      },
    });

    if (!forecastRun) {
      return null;
    }

    // Check if forecast is still fresh (within 24 hours)
    const ageHours = (Date.now() - forecastRun.computedAt.getTime()) / (1000 * 60 * 60);
    if (ageHours > 24) {
      return null; // Stale, recompute
    }

    // Old cached forecasts don't have gap forecast data
    // Return null to force recomputation with new gap-based approach
    console.log('[ForecastPack] Old format cached forecast found, forcing recomputation with gap-based approach');
    return null;
  } catch (error) {
    console.error('[ForecastPack] Error loading cached forecast:', error);
    return null;
  }
}

/**
 * Save forecast to database cache
 */
async function saveForecastToCache(
  comparisonId: string,
  timeframe: string,
  horizon: number,
  dataHash: string,
  forecastPack: ForecastPack
): Promise<void> {
  try {
    // Use upsert to handle concurrent requests
    const forecastRun = await prisma.forecastRun.upsert({
      where: {
        forecast_run_unique: {
          comparisonId,
          timeframe,
          horizon,
          dataHash,
        },
      },
      create: {
        comparisonId,
        timeframe,
        horizon,
        dataHash,
        // Use gap forecast data
        modelTermA: forecastPack.gapForecast.gapForecast.modelUsed,
        modelTermB: 'gap', // Indicate this is a gap forecast
        confidenceScoreA: forecastPack.gapInsights.confidenceScore,
        confidenceScoreB: 0, // Not used for gap forecasts
        metricsA: forecastPack.gapForecast.gapForecast.diagnostics as any,
        metricsB: {} as any,
        qualityFlagsA: {} as any,
        qualityFlagsB: {} as any,
        winnerProbability: forecastPack.gapInsights.leadChangeRisk,
        expectedMargin: forecastPack.gapInsights.expectedMarginInHorizon,
        leadChangeRisk: forecastPack.gapInsights.leadChangeRisk >= 50 ? 'high' : forecastPack.gapInsights.leadChangeRisk >= 30 ? 'medium' : 'low',
      },
      update: {
        modelTermA: forecastPack.gapForecast.gapForecast.modelUsed,
        modelTermB: 'gap',
        confidenceScoreA: forecastPack.gapInsights.confidenceScore,
        confidenceScoreB: 0,
        metricsA: forecastPack.gapForecast.gapForecast.diagnostics as any,
        metricsB: {} as any,
        qualityFlagsA: {} as any,
        qualityFlagsB: {} as any,
        winnerProbability: forecastPack.gapInsights.leadChangeRisk,
        expectedMargin: forecastPack.gapInsights.expectedMarginInHorizon,
        leadChangeRisk: forecastPack.gapInsights.leadChangeRisk >= 50 ? 'high' : forecastPack.gapInsights.leadChangeRisk >= 30 ? 'medium' : 'low',
        computedAt: new Date(),
      },
    });

    // Save forecast points (delete old ones first for idempotency)
    await prisma.forecastPoint.deleteMany({
      where: { forecastRunId: forecastRun.id },
    });

    // Note: Cache structure needs migration for gap-based forecasts
    // For now, skip saving points if using new gap forecast structure
    // TODO: Update database schema to support gap forecasts
    if (!forecastPack.gapForecast) {
      return; // Old structure, skip for now
    }

    // Insert gap forecast points (stored as termA for now, term field can indicate gap)
    // TODO: Update schema to properly store gap forecasts
    const pointsToInsert: any[] = []; // Skip for now until schema is updated

    // Insert in batches to avoid too many parameters
    const batchSize = 100;
    for (let i = 0; i < pointsToInsert.length; i += batchSize) {
      await prisma.forecastPoint.createMany({
        data: pointsToInsert.slice(i, i + batchSize),
      });
    }
  } catch (error) {
    console.error('[ForecastPack] Error saving forecast to cache:', error);
    // Don't throw - caching is best effort
  }
}

/**
 * Main function: Get or compute forecast pack
 */
export async function getOrComputeForecastPack(
  comparisonId: string,
  termA: string,
  termB: string,
  series: SeriesPoint[],
  timeframe: string,
  horizon: number = 28,
  category: ComparisonCategory = 'general'
): Promise<ForecastPack | null> {
  try {
    // Convert series to TimeSeriesPoint format using TrendArc Score (multi-source combined data)
    const seriesA = convertToTimeSeries(series, termA, category);
    const seriesB = convertToTimeSeries(series, termB, category);

    if (seriesA.length < 7 || seriesB.length < 7) {
      console.log('[ForecastPack] Insufficient data for forecasting');
      return null;
    }

    // Create data hash for cache key
    const combinedSeries = [
      ...seriesA.map(p => ({ date: p.date, term: 'A', value: p.value })),
      ...seriesB.map(p => ({ date: p.date, term: 'B', value: p.value })),
    ];
    const dataHash = hashSeriesData(combinedSeries as any);

    // Skip cache for now (gap-based forecasting is new structure)
    // TODO: Re-enable caching once schema is updated
    // const cached = await loadCachedForecast(comparisonId, timeframe, horizon, dataHash);
    // if (cached) {
    //   console.log('[ForecastPack] Using cached forecast');
    //   return cached;
    // }

    console.log('[ForecastPack] Computing gap-based forecast');

    // Extract value arrays for gap forecasting
    const valuesA = seriesA.map(p => p.value);
    const valuesB = seriesB.map(p => p.value);

    // Forecast the gap (termA - termB)
    const gapForecast = forecastGap(valuesA, valuesB, horizon);

    // Get insights from gap forecast
    const gapInsights = getGapForecastInsights(gapForecast, horizon);

    const forecastPack: ForecastPack = {
      gapForecast,
      gapInsights,
      computedAt: new Date().toISOString(),
      dataHash,
      horizon,
    };

    // Save to cache (async, don't wait)
    saveForecastToCache(comparisonId, timeframe, horizon, dataHash, forecastPack).catch(
      error => console.error('[ForecastPack] Failed to cache forecast:', error)
    );

    return forecastPack;
  } catch (error) {
    console.error('[ForecastPack] Error computing forecast:', error);
    return null;
  }
}

