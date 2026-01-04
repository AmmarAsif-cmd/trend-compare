/**
 * Warmup Job: Refresh Forecasts
 * 
 * Nightly job to refresh forecasts for popular comparisons (last 7 days)
 * Uses distributed locking and concurrency limits
 */

import { prisma } from '@/lib/db';
import { getOrBuildComparison } from '@/lib/getOrBuild';
import { predictTrend } from '@/lib/prediction-engine-enhanced';
import { getCache } from '@/lib/cache';
import { runIntelligentComparison } from '@/lib/intelligent-comparison';
import type { ForecastBundleSummary } from '@/lib/insights/contracts/forecast-bundle-summary';
import type { SeriesPoint } from '@/lib/trends';
import { PREDICTION_ENGINE_VERSION } from '@/lib/insights/contracts/versions';
import { stableHash } from '@/lib/cache/hash';
import { forecastKey, warmupStatusKey, warmupLockKey, type WarmupKeyParams } from '@/lib/forecast/cacheKeys';
import { computeDataHash } from '@/lib/forecast/dataHash';

export interface WarmupForecastJobResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
  duration: number;
}

/**
 * Get popular comparisons from last 7 days
 */
async function getPopularComparisons(limit: number = 50): Promise<Array<{
  slug: string;
  termA: string;
  termB: string;
  timeframe: string;
  geo: string;
  category: string | null;
}>> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const comparisons = await prisma.comparison.findMany({
    where: {
      OR: [
        { createdAt: { gte: since } },
        { lastVisited: { gte: since } },
        { viewCount: { gt: 0 } },
      ],
    },
    select: {
      slug: true,
      terms: true,
      timeframe: true,
      geo: true,
      category: true,
      viewCount: true,
      lastVisited: true,
    },
    orderBy: [
      { viewCount: 'desc' },
      { lastVisited: 'desc' },
      { createdAt: 'desc' },
    ],
    take: limit,
  });

  return comparisons
    .map(c => {
      const terms = Array.isArray(c.terms) ? c.terms as string[] : [];
      if (terms.length < 2) return null;
      return {
        slug: c.slug,
        termA: terms[0],
        termB: terms[1],
        timeframe: c.timeframe,
        geo: c.geo,
        category: c.category,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);
}

/**
 * Generate forecast for a term
 */
async function generateForecast(
  term: string,
  series: Array<{ date: string; [key: string]: number | string }>,
  category: string = 'general',
  termLabel: 'termA' | 'termB' = 'termA'
): Promise<ForecastBundleSummary | null> {
  try {
    // Extract term values from series
    const termKey = Object.keys(series[0] || {}).find(
      k => k !== 'date' && k.toLowerCase() === term.toLowerCase()
    ) || Object.keys(series[0] || {}).find(k => k !== 'date');

    if (!termKey) return null;

    // Convert series to SeriesPoint format for predictTrend
    const seriesPoints = series.map(p => ({
      date: p.date,
      [term]: Number(p[termKey] || 0),
    }));

    const values = seriesPoints
      .map(p => Number(p[term] || 0))
      .filter(v => isFinite(v) && v >= 0);

    if (values.length < 7) return null; // Need minimum data

    // Generate predictions
    const prediction = await predictTrend({
      series: seriesPoints as any,
      term,
      category: category as any,
      useTrendArcScore: true,
    });

    if (!prediction) return null;

    // Build forecast bundle
    const forecastHash = stableHash({
      term,
      series: values.slice(-20), // Last 20 points for hash
      version: PREDICTION_ENGINE_VERSION,
    });

    // Build 14-day and 30-day forecasts from predictions
    const predictions14 = prediction.predictions.slice(0, 14);
    const predictions30 = prediction.predictions.slice(0, 30);
    
    const avg14 = predictions14.length > 0
      ? predictions14.reduce((sum, p) => sum + p.value, 0) / predictions14.length
      : 50;
    const avg30 = predictions30.length > 0
      ? predictions30.reduce((sum, p) => sum + p.value, 0) / predictions30.length
      : 50;

    const conf14 = predictions14.length > 0
      ? predictions14.reduce((sum, p) => sum + p.confidence, 0) / predictions14.length
      : prediction.confidence;
    const conf30 = predictions30.length > 0
      ? predictions30.reduce((sum, p) => sum + p.confidence, 0) / predictions30.length
      : prediction.confidence;

    // Build key points with confidence intervals
    const buildKeyPoints = (preds: typeof prediction.predictions, lower: number[], upper: number[]) => {
      return preds.slice(0, 5).map((p, i) => ({
        date: p.date,
        value: p.value,
        lowerBound: lower[i] || Math.max(0, p.value - 5),
        upperBound: upper[i] || Math.min(100, p.value + 5),
        confidence: p.confidence,
      }));
    };

    const warnings: Array<'low_confidence' | 'insufficient_data' | 'high_volatility' | 'anomaly_detected' | 'data_quality_concern'> = [];
    if (prediction.confidence < 70) warnings.push('low_confidence');
    if (values.length < 14) warnings.push('insufficient_data');
    if (prediction.metrics.volatility > 0.5) warnings.push('high_volatility');
    if (prediction.metrics.dataQuality < 60) warnings.push('data_quality_concern');

    const forecast: ForecastBundleSummary = {
      id: `forecast-${term}-${forecastHash}`,
      term: termLabel,
      direction: prediction.trend as any,
      forecast14Day: {
        averageValue: avg14,
        confidence: conf14,
        keyPoints: buildKeyPoints(predictions14, prediction.confidenceInterval.lower.slice(0, 5), prediction.confidenceInterval.upper.slice(0, 5)),
        warnings: warnings.length > 0 ? warnings : undefined,
      },
      forecast30Day: {
        averageValue: avg30,
        confidence: conf30,
        keyPoints: buildKeyPoints(predictions30, prediction.confidenceInterval.lower.slice(0, 5), prediction.confidenceInterval.upper.slice(0, 5)),
        warnings: warnings.length > 0 ? warnings : undefined,
      },
      overallConfidence: prediction.confidence,
      warnings: warnings.length > 0 ? warnings : undefined,
      forecastHash,
      generatedAt: new Date().toISOString(),
      dataFreshness: {
        lastUpdatedAt: new Date().toISOString(),
        source: 'prediction-engine',
      },
      predictionEngineVersion: PREDICTION_ENGINE_VERSION,
    };

    return forecast;
  } catch (error) {
    console.error(`[WarmupForecasts] Error generating forecast for ${term}:`, error);
    return null;
  }
}

/**
 * Warmup forecasts for popular comparisons
 */
export async function warmupForecasts(
  limit: number = 50,
  concurrency: number = 5
): Promise<WarmupForecastJobResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let processed = 0;
  let failed = 0;

  try {
    // Get popular comparisons
    const comparisons = await getPopularComparisons(limit);
    console.log(`[WarmupForecasts] Found ${comparisons.length} popular comparisons`);

    // Process with concurrency limit
    const cache = getCache();
    const lockKey = 'warmup:forecasts:lock';
    const lockSeconds = 60 * 60; // 1 hour max job duration

    // Acquire distributed lock
    const redisStore = (cache as any).redisStore;
    if (redisStore && redisStore.isAvailable()) {
      const lockAcquired = await redisStore.acquireLock(lockKey, lockSeconds);
      if (!lockAcquired) {
        return {
          success: false,
          processed: 0,
          failed: 0,
          errors: ['Another warmup job is already running'],
          duration: Date.now() - startTime,
        };
      }
    }

    try {
      // Process comparisons in batches
      for (let i = 0; i < comparisons.length; i += concurrency) {
        const batch = comparisons.slice(i, i + concurrency);
        
        await Promise.all(
          batch.map(async (comp) => {
            try {
              // Get comparison data
              const row = await getOrBuildComparison({
                slug: comp.slug,
                terms: [comp.termA, comp.termB],
                timeframe: comp.timeframe,
                geo: comp.geo,
              });

              if (!row || !Array.isArray(row.series) || row.series.length === 0) {
                failed++;
                errors.push(`No data for ${comp.slug}`);
                return;
              }

              // Compute dataHash for this comparison
              const dataHash = computeDataHash(
                row.series as SeriesPoint[],
                comp.timeframe,
                comp.termA,
                comp.termB
              );

              // Set warmup status to "running"
              const keyParams: WarmupKeyParams = { slug: comp.slug, tf: comp.timeframe, geo: comp.geo, dataHash };
              const statusKey = warmupStatusKey(keyParams);
              await cache.set(statusKey, 'running', 30 * 60); // 30 min TTL

              try {
                // Generate forecasts for both terms
                const [forecastA, forecastB] = await Promise.all([
                  generateForecast(comp.termA, row.series as any[], comp.category || 'general', 'termA'),
                  generateForecast(comp.termB, row.series as any[], comp.category || 'general', 'termB'),
                ]);

                // Cache forecasts using canonical keys
                if (forecastA) {
                  const keyA = forecastKey({ slug: comp.slug, term: comp.termA, tf: comp.timeframe, geo: comp.geo, dataHash });
                  await cache.set(keyA, forecastA, 24 * 60 * 60, 7 * 24 * 60 * 60); // 24h fresh, 7d stale
                }

                if (forecastB) {
                  const keyB = forecastKey({ slug: comp.slug, term: comp.termB, tf: comp.timeframe, geo: comp.geo, dataHash });
                  await cache.set(keyB, forecastB, 24 * 60 * 60, 7 * 24 * 60 * 60); // 24h fresh, 7d stale
                }

                // Update warmup status to "ready" on success
                if (forecastA && forecastB) {
                  await cache.set(statusKey, 'ready', 7 * 24 * 60 * 60); // 7 days TTL
                } else {
                  // Partial success - keep as queued for retry
                  await cache.set(statusKey, 'queued', 5 * 60); // 5 min TTL
                }

                processed++;
                console.log(`[WarmupForecasts] ✅ Processed ${comp.slug}`);
              } catch (error) {
                // Update warmup status to "failed"
                const errorMessage = error instanceof Error ? error.message : String(error);
                await cache.set(statusKey, { 
                  status: 'failed', 
                  failedAt: new Date().toISOString(),
                  error: errorMessage.substring(0, 200),
                }, 10 * 60); // 10 min TTL
                throw error; // Re-throw to be caught by outer catch
              }
            } catch (error) {
              failed++;
              const errorMsg = error instanceof Error ? error.message : String(error);
              errors.push(`${comp.slug}: ${errorMsg}`);
              console.error(`[WarmupForecasts] ❌ Failed ${comp.slug}:`, error);
            }
          })
        );
      }
    } finally {
      // Release lock
      if (redisStore && redisStore.isAvailable()) {
        await redisStore.releaseLock(lockKey);
      }
    }

    return {
      success: true,
      processed,
      failed,
      errors: errors.slice(0, 10), // Limit error messages
      duration: Date.now() - startTime,
    };
  } catch (error) {
    console.error('[WarmupForecasts] Job failed:', error);
    return {
      success: false,
      processed,
      failed,
      errors: [error instanceof Error ? error.message : String(error)],
      duration: Date.now() - startTime,
    };
  }
}

