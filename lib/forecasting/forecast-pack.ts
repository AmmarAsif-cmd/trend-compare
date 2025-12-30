/**
 * Forecast Pack Builder
 * 
 * Orchestrates forecasting for both terms, computes head-to-head analytics,
 * and packages results for API consumption.
 */

import { prisma } from '@/lib/db';
import { forecast, type ForecastResult, type TimeSeriesPoint } from './core';
import { computeHeadToHeadForecast, type HeadToHeadForecast } from './head-to-head';
import { createHash } from 'crypto';
import { calculateTrendArcScoreTimeSeries, type TrendArcScoreTimeSeries } from '@/lib/trendarc-score-time-series';
import type { ComparisonCategory } from '@/lib/trendarc-score';

export interface ForecastPack {
  termA: ForecastResult;
  termB: ForecastResult;
  headToHead: HeadToHeadForecast;
  computedAt: string; // ISO 8601
  dataHash: string;
  horizon: number;
}

/**
 * Create hash of series data for cache invalidation
 */
function hashSeriesData(series: TimeSeriesPoint[]): string {
  const dataStr = JSON.stringify(series.map(p => ({ date: p.date, value: p.value })));
  return createHash('sha256').update(dataStr).digest('hex').substring(0, 16);
}

/**
 * Convert series format from comparison data to TimeSeriesPoint[]
 * Uses TrendArc Score (multi-source combined data) instead of raw Google Trends
 * This provides more accurate forecasts using the same data shown in the main chart
 */
function convertToTimeSeries(
  series: Array<{ date: string; [key: string]: number }>,
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
        value: Number(point[termKey] || 0),
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

    // Load forecast points for both terms
    const [pointsA, pointsB] = await Promise.all([
      prisma.forecastPoint.findMany({
        where: {
          forecastRunId: forecastRun.id,
          term: 'termA',
        },
        orderBy: { date: 'asc' },
      }),
      prisma.forecastPoint.findMany({
        where: {
          forecastRunId: forecastRun.id,
          term: 'termB',
        },
        orderBy: { date: 'asc' },
      }),
    ]);

    // Reconstruct ForecastResult objects
    const termA: ForecastResult = {
      points: pointsA.map(p => ({
        date: p.date.toISOString().split('T')[0],
        value: p.value,
        lower80: p.lower80,
        upper80: p.upper80,
        lower95: p.lower95,
        upper95: p.upper95,
      })),
      model: forecastRun.modelTermA as 'ets' | 'arima' | 'naive',
      metrics: forecastRun.metricsA as any,
      confidenceScore: forecastRun.confidenceScoreA,
      qualityFlags: forecastRun.qualityFlagsA as any,
    };

    const termB: ForecastResult = {
      points: pointsB.map(p => ({
        date: p.date.toISOString().split('T')[0],
        value: p.value,
        lower80: p.lower80,
        upper80: p.upper80,
        lower95: p.lower95,
        upper95: p.upper95,
      })),
      model: forecastRun.modelTermB as 'ets' | 'arima' | 'naive',
      metrics: forecastRun.metricsB as any,
      confidenceScore: forecastRun.confidenceScoreB,
      qualityFlags: forecastRun.qualityFlagsB as any,
    };

    const headToHead: HeadToHeadForecast = {
      winnerProbability: forecastRun.winnerProbability || 50,
      expectedMarginPoints: forecastRun.expectedMargin || 0,
      leadChangeRisk: (forecastRun.leadChangeRisk as 'low' | 'medium' | 'high') || 'medium',
      currentMargin: 0, // Will be computed from actual data
      forecastHorizon: horizon,
    };

    return {
      termA,
      termB,
      headToHead,
      computedAt: forecastRun.computedAt.toISOString(),
      dataHash,
      horizon,
    };
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
        modelTermA: forecastPack.termA.model,
        modelTermB: forecastPack.termB.model,
        confidenceScoreA: forecastPack.termA.confidenceScore,
        confidenceScoreB: forecastPack.termB.confidenceScore,
        metricsA: forecastPack.termA.metrics,
        metricsB: forecastPack.termB.metrics,
        qualityFlagsA: forecastPack.termA.qualityFlags,
        qualityFlagsB: forecastPack.termB.qualityFlags,
        winnerProbability: forecastPack.headToHead.winnerProbability,
        expectedMargin: forecastPack.headToHead.expectedMarginPoints,
        leadChangeRisk: forecastPack.headToHead.leadChangeRisk,
      },
      update: {
        modelTermA: forecastPack.termA.model,
        modelTermB: forecastPack.termB.model,
        confidenceScoreA: forecastPack.termA.confidenceScore,
        confidenceScoreB: forecastPack.termB.confidenceScore,
        metricsA: forecastPack.termA.metrics,
        metricsB: forecastPack.termB.metrics,
        qualityFlagsA: forecastPack.termA.qualityFlags,
        qualityFlagsB: forecastPack.termB.qualityFlags,
        winnerProbability: forecastPack.headToHead.winnerProbability,
        expectedMargin: forecastPack.headToHead.expectedMarginPoints,
        leadChangeRisk: forecastPack.headToHead.leadChangeRisk,
        computedAt: new Date(),
      },
    });

    // Save forecast points (delete old ones first for idempotency)
    await prisma.forecastPoint.deleteMany({
      where: { forecastRunId: forecastRun.id },
    });

    // Insert new points
    const pointsToInsert = [
      ...forecastPack.termA.points.map(p => ({
        forecastRunId: forecastRun.id,
        term: 'termA',
        date: new Date(p.date),
        value: p.value,
        lower80: p.lower80,
        upper80: p.upper80,
        lower95: p.lower95,
        upper95: p.upper95,
      })),
      ...forecastPack.termB.points.map(p => ({
        forecastRunId: forecastRun.id,
        term: 'termB',
        date: new Date(p.date),
        value: p.value,
        lower80: p.lower80,
        upper80: p.upper80,
        lower95: p.lower95,
        upper95: p.upper95,
      })),
    ];

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
  series: Array<{ date: string; [key: string]: number }>,
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

    // Try to load from cache
    const cached = await loadCachedForecast(comparisonId, timeframe, horizon, dataHash);
    if (cached) {
      console.log('[ForecastPack] Using cached forecast');
      return cached;
    }

    console.log('[ForecastPack] Computing new forecast');

    // Compute forecasts for both terms in parallel
    const [forecastA, forecastB] = await Promise.all([
      forecast(seriesA, horizon),
      forecast(seriesB, horizon),
    ]);

    // Get current values for head-to-head analysis
    const currentValueA = seriesA[seriesA.length - 1]?.value || 0;
    const currentValueB = seriesB[seriesB.length - 1]?.value || 0;

    // Compute head-to-head analytics
    const headToHead = computeHeadToHeadForecast(
      forecastA,
      forecastB,
      currentValueA,
      currentValueB
    );

    const forecastPack: ForecastPack = {
      termA: forecastA,
      termB: forecastB,
      headToHead,
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

