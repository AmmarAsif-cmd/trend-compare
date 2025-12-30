/**
 * Warmup Job: On-Demand Warmup
 * 
 * Triggered when premium endpoint returns needsWarmup=true
 * Generates missing forecasts and AI insights for a specific comparison
 */

import { getOrBuildComparison } from '@/lib/getOrBuild';
import { runIntelligentComparison } from '@/lib/intelligent-comparison';
import { getCache } from '@/lib/cache';
import { predictTrend } from '@/lib/prediction-engine-enhanced';
import { generateSignals } from '@/lib/insights/generate';
import { generateInterpretations } from '@/lib/insights/generate';
import { getMeaningExplanation } from '@/lib/ai/insights/meaning-explanation';
import { getPeakExplanations } from '@/lib/ai/insights/peak-explanation';
import { detectPeaksWithEvents } from '@/lib/peak-event-detector';
import type { ForecastBundleSummary } from '@/lib/insights/contracts/forecast-bundle-summary';
import type { AIInsights } from '@/lib/insights/contracts/ai-insights';
import { PREDICTION_ENGINE_VERSION, PROMPT_VERSION } from '@/lib/insights/contracts/versions';
import { stableHash, createCacheKey } from '@/lib/cache/hash';
import { forecastKey, warmupStatusKey, warmupLockKey, type WarmupKeyParams } from '@/lib/forecast/cacheKeys';

export interface OnDemandWarmupResult {
  success: boolean;
  forecastsGenerated: boolean;
  aiInsightsGenerated: boolean;
  errors: string[];
  duration: number;
}

/**
 * Generate forecast for a term (same as warmup-forecasts.ts)
 */
async function generateForecast(
  term: string,
  series: Array<{ date: string; [key: string]: number | string }>,
  category: string = 'general',
  termLabel: 'termA' | 'termB' = 'termA'
): Promise<ForecastBundleSummary | null> {
  try {
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

    if (values.length < 7) return null;

    const prediction = await predictTrend({
      series: seriesPoints as any,
      term,
      category: category as any,
      useTrendArcScore: true,
    });

    if (!prediction) return null;

    const forecastHash = stableHash({
      term,
      series: values.slice(-20),
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
    console.error(`[OnDemandWarmup] Error generating forecast for ${term}:`, error);
    return null;
  }
}

/**
 * On-demand warmup for a specific comparison
 */
export async function warmupOnDemand(
  slug: string,
  termA: string,
  termB: string,
  timeframe: string,
  geo: string,
  dataHash: string
): Promise<OnDemandWarmupResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let forecastsGenerated = false;
  let aiInsightsGenerated = false;

  try {
    // Acquire distributed lock for this specific comparison
    const cache = getCache();
    const keyParams: WarmupKeyParams = { slug, tf: timeframe, geo, dataHash };
    const lockKey = warmupLockKey(keyParams);
    const statusKey = warmupStatusKey(keyParams);
    const lockSeconds = 30 * 60; // 30 minutes max

    // Set warmup status to "running"
    await cache.set(statusKey, 'running', 30 * 60); // 30 min TTL

    const redisStore = (cache as any).redisStore;
    if (redisStore && redisStore.isAvailable()) {
      const lockAcquired = await redisStore.acquireLock(lockKey, lockSeconds);
      if (!lockAcquired) {
        // Update status to indicate another job is running
        await cache.set(statusKey, { 
          status: 'running', 
          startedAt: new Date().toISOString(),
          note: 'Another warmup job is already in progress'
        }, 30 * 60);
        return {
          success: false,
          forecastsGenerated: false,
          aiInsightsGenerated: false,
          errors: ['Warmup already in progress for this comparison'],
          duration: Date.now() - startTime,
        };
      }
    }

    try {
      // Get comparison data
      const row = await getOrBuildComparison({
        slug,
        terms: [termA, termB],
        timeframe,
        geo,
      });

      if (!row || !Array.isArray(row.series) || row.series.length === 0) {
        return {
          success: false,
          forecastsGenerated: false,
          aiInsightsGenerated: false,
          errors: ['No comparison data available'],
          duration: Date.now() - startTime,
        };
      }

      const series = row.series as Array<{ date: string; [key: string]: number | string }>;
      const category = row.category || 'general';

      // Get intelligent comparison for scores
      const intelligentComparison = await runIntelligentComparison(
        [termA, termB],
        series,
        {
          enableYouTube: !!process.env.YOUTUBE_API_KEY,
          enableTMDB: !!process.env.TMDB_API_KEY,
          enableBestBuy: !!process.env.BESTBUY_API_KEY,
          enableSpotify: !!process.env.SPOTIFY_CLIENT_ID,
          enableSteam: !!process.env.STEAM_API_KEY,
          cachedCategory: category || null,
        }
      ).catch(() => null);

      const scores = intelligentComparison ? {
        termA: intelligentComparison.scores.termA,
        termB: intelligentComparison.scores.termB,
      } : {
        termA: { overall: 50, breakdown: { searchInterest: 50, socialBuzz: 50, authority: 50, momentum: 50 }, confidence: 50, sources: [], explanation: '' },
        termB: { overall: 50, breakdown: { searchInterest: 50, socialBuzz: 50, authority: 50, momentum: 50 }, confidence: 50, sources: [], explanation: '' },
      };

      // Generate forecasts
      const [forecastA, forecastB] = await Promise.all([
        generateForecast(termA, series, category, 'termA'),
        generateForecast(termB, series, category, 'termB'),
      ]);

      // Store forecasts using canonical cache keys
      if (forecastA) {
        const keyA = forecastKey({ slug, term: termA, tf: timeframe, geo, dataHash });
        await cache.set(keyA, forecastA, 24 * 60 * 60, 7 * 24 * 60 * 60); // 24h fresh, 7d stale
        forecastsGenerated = true;
        console.log(`[OnDemandWarmup] ✅ Cached forecast for ${termA} (key: ${keyA})`);
      }
      if (forecastB) {
        const keyB = forecastKey({ slug, term: termB, tf: timeframe, geo, dataHash });
        await cache.set(keyB, forecastB, 24 * 60 * 60, 7 * 24 * 60 * 60); // 24h fresh, 7d stale
        forecastsGenerated = true;
        console.log(`[OnDemandWarmup] ✅ Cached forecast for ${termB} (key: ${keyB})`);
      }
      
      if (forecastsGenerated) {
        console.log(`[OnDemandWarmup] ✅ Generated forecasts for ${slug}`);
      }

      // Generate AI insights
      const signals = generateSignals({
        termA,
        termB,
        timeframe,
        series,
        scores,
        dataSource: 'google-trends',
        lastUpdatedAt: row.updatedAt.toISOString(),
      });

      const interpretations = generateInterpretations({
        termA,
        termB,
        signals,
        scores: {
          termA: { overall: scores.termA.overall, breakdown: scores.termA.breakdown },
          termB: { overall: scores.termB.overall, breakdown: scores.termB.breakdown },
        },
        seriesLength: series.length,
        dataSource: 'google-trends',
        lastUpdatedAt: row.updatedAt.toISOString(),
      });

      const peakEvents = await detectPeaksWithEvents(series as any[], [termA, termB], 20).catch(() => []);

      const topPeaksA = peakEvents
        .filter(p => p.term === termA)
        .slice(0, 3)
        .map((p, idx) => ({
          id: `${termA}-${p.date}-${idx}`,
          term: 'termA' as const,
          type: 'spike' as any,
          peakDate: p.date,
          magnitude: p.value,
          duration: 1,
          classification: 'significant' as any,
          startDate: p.date,
          endDate: p.date,
          context: p.event?.title || '',
          peakHash: stableHash({ term: termA, date: p.date, magnitude: p.value }),
          generatedAt: new Date().toISOString(),
          dataFreshness: {
            lastUpdatedAt: new Date().toISOString(),
            source: 'peak-detector',
          },
        }));

      // Generate AI insights (on-demand warmup can use AI, but should be rate-limited)
      // For now, we'll generate meaning explanation but skip peak explanations
      // to avoid excessive AI calls
      const meaningExplanation = await getMeaningExplanation({
        termA,
        termB,
        interpretations,
        category: category || undefined,
      }).catch(error => {
        console.error('[OnDemandWarmup] Failed to generate meaning explanation:', error);
        return null;
      });

      // Skip peak explanations to reduce AI costs (can be added later if needed)
      const peakExplanations = null;

      if (meaningExplanation || peakExplanations) {
        const aiInsights: AIInsights = {
          id: `ai-insights-${slug}-${stableHash({ termA, termB, slug })}`,
          meaningExplanation: meaningExplanation ? {
            text: meaningExplanation.summary,
            confidence: meaningExplanation.confidence,
            generatedAt: meaningExplanation.generatedAt,
            promptVersion: PROMPT_VERSION,
          } : undefined,
          peakExplanations: undefined, // Skip for on-demand warmup
          generatedAt: new Date().toISOString(),
          dataFreshness: {
            lastUpdatedAt: new Date().toISOString(),
            source: 'ai-insights',
          },
          aiInsightsHash: stableHash({
            meaning: meaningExplanation?.summary,
            peaks: undefined,
          }),
        };

        const key = createCacheKey('ai-insights', slug, timeframe);
        await cache.set(key, aiInsights, 7 * 24 * 60 * 60, 30 * 24 * 60 * 60);
        aiInsightsGenerated = true;
        console.log(`[OnDemandWarmup] ✅ Generated AI insights for ${slug}`);
      }

      // Update warmup status to "ready" on success
      // Forecasts are required, AI insights are optional
      const hasAllForecasts = forecastA && forecastB;
      
      if (hasAllForecasts) {
        // Forecasts complete - mark as ready (AI is optional)
        await cache.set(statusKey, 'ready', 7 * 24 * 60 * 60); // 7 days TTL
        console.log(`[OnDemandWarmup] ✅ Warmup completed successfully for ${slug} (forecasts ready, AI: ${aiInsightsGenerated ? 'generated' : 'optional'})`);
      } else {
        // Partial success - keep status as "queued" for retry
        await cache.set(statusKey, 'queued', 5 * 60); // 5 min TTL for retry
        console.log(`[OnDemandWarmup] ⚠️ Partial completion for ${slug} (forecasts: ${forecastsGenerated}, AI: ${aiInsightsGenerated})`);
      }

      return {
        success: true,
        forecastsGenerated,
        aiInsightsGenerated,
        errors: [],
        duration: Date.now() - startTime,
      };
    } finally {
      // Release lock
      if (redisStore && redisStore.isAvailable()) {
        await redisStore.releaseLock(lockKey);
      }
    }
  } catch (error) {
    console.error('[OnDemandWarmup] Job failed:', error);
    
    // Update warmup status to "failed"
    const cache = getCache();
    const keyParams: WarmupKeyParams = { slug, tf: timeframe, geo, dataHash };
    const statusKey = warmupStatusKey(keyParams);
    const errorMessage = error instanceof Error ? error.message : String(error);
    await cache.set(statusKey, 'failed', 10 * 60); // 10 min TTL for error state
    
    return {
      success: false,
      forecastsGenerated,
      aiInsightsGenerated,
      errors: [errorMessage],
      duration: Date.now() - startTime,
    };
  }
}

