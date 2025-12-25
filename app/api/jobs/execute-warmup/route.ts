/**
 * POST /api/jobs/execute-warmup
 * 
 * Executes warmup job: generates forecasts and writes to cache
 * Secured with WARMUP_SECRET header
 * 
 * This endpoint performs the heavy compute work for warmup.
 * It should NOT be called directly from user requests.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrBuildComparison } from '@/lib/getOrBuild';
import { predictTrend } from '@/lib/prediction-engine-enhanced';
import { getCache } from '@/lib/cache';
import { 
  forecastKey, 
  warmupStatusKey, 
  warmupErrorKey,
  warmupStartedAtKey,
  warmupFinishedAtKey,
  type WarmupKeyParams
} from '@/lib/forecast/cacheKeys';
import { fromSlug } from '@/lib/slug';
import { validateTopic } from '@/lib/validateTermsServer';
import type { ForecastBundleSummary } from '@/lib/insights/contracts/forecast-bundle-summary';
import { PREDICTION_ENGINE_VERSION } from '@/lib/insights/contracts/versions';
import { stableHash } from '@/lib/cache/hash';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

function isValidTopic(
  r: ReturnType<typeof validateTopic>,
): r is { ok: true; term: string } {
  return r.ok;
}

/**
 * Generate forecast for a term
 */
async function generateForecast(
  term: string,
  series: Array<{ date: string; [key: string]: number }>,
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
    console.error(`[ExecuteWarmup] Error generating forecast for ${term}:`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify secret - no defaults
    const secret = request.headers.get('X-Warmup-Secret');
    const expectedSecret = process.env.WARMUP_SECRET;
    
    if (!expectedSecret) {
      console.error('[ExecuteWarmup] WARMUP_SECRET environment variable is not set');
      return NextResponse.json(
        { ok: false, status: 'failed', error: 'Warmup service is not configured' },
        { status: 503 }
      );
    }
    
    if (secret !== expectedSecret) {
      return NextResponse.json(
        { ok: false, status: 'failed', error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { slug, tf, geo, dataHash } = body;

    if (!slug || !tf || !geo || !dataHash) {
      return NextResponse.json(
        { ok: false, status: 'failed', error: 'Missing required fields: slug, tf, geo, dataHash' },
        { status: 400 }
      );
    }

    const cache = getCache();
    const keyParams: WarmupKeyParams = { slug, tf, geo, dataHash };

    // Step 1: Set warmup status to "running" and startedAt
    const statusKey = warmupStatusKey(keyParams);
    const startedAtKey = warmupStartedAtKey(keyParams);
    const now = new Date().toISOString();
    
    await Promise.all([
      cache.set(statusKey, 'running', 15 * 60), // 15 min TTL
      cache.set(startedAtKey, now, 15 * 60),
    ]);

    console.log(`[ExecuteWarmup] Starting warmup for ${slug} (dataHash: ${dataHash})`);

    try {
      // Step 2: Load comparison row
      const raw = fromSlug(slug);
      const checked = raw.map(validateTopic);
      const valid = checked.filter(isValidTopic);
      
      if (valid.length !== 2) {
        throw new Error('Invalid slug format');
      }

      const terms = valid.map((c) => c.term);
      const termA = terms[0];
      const termB = terms[1];

      const row = await getOrBuildComparison({
        slug,
        terms,
        timeframe: tf,
        geo,
      });

      if (!row || !Array.isArray(row.series) || row.series.length === 0) {
        throw new Error('No comparison data available');
      }

      const series = row.series as Array<{ date: string; [key: string]: number }>;
      const category = row.category || 'general';

      // Step 3: Generate forecasts for both terms
      const [forecastA, forecastB] = await Promise.all([
        generateForecast(termA, series, category, 'termA'),
        generateForecast(termB, series, category, 'termB'),
      ]);

      if (!forecastA || !forecastB) {
        throw new Error(`Failed to generate forecasts (termA: ${!!forecastA}, termB: ${!!forecastB})`);
      }

      // Step 4: Write forecasts to cache using canonical keys
      const keyA = forecastKey({ slug, term: termA, tf, geo, dataHash });
      const keyB = forecastKey({ slug, term: termB, tf, geo, dataHash });

      await Promise.all([
        cache.set(keyA, forecastA, 24 * 60 * 60, 7 * 24 * 60 * 60), // 24h fresh, 7d stale
        cache.set(keyB, forecastB, 24 * 60 * 60, 7 * 24 * 60 * 60),
      ]);

      // Step 5: Verify write succeeded by reading keys back once
      const [verifyA, verifyB] = await Promise.all([
        cache.get(keyA),
        cache.get(keyB),
      ]);

      if (!verifyA || !verifyB) {
        throw new Error(`Forecast cache write verification failed (termA: ${!!verifyA}, termB: ${!!verifyB})`);
      }

      console.log(`[ExecuteWarmup] ✅ Forecasts cached successfully for ${slug}`);

      // Step 6: Set warmup status to "ready" and finishedAt, clear error
      const finishedAtKey = warmupFinishedAtKey(keyParams);
      const errorKey = warmupErrorKey(keyParams);
      const finishedAt = new Date().toISOString();

      await Promise.all([
        cache.set(statusKey, 'ready', 7 * 24 * 60 * 60), // 7 days TTL
        cache.set(finishedAtKey, finishedAt, 7 * 24 * 60 * 60),
        cache.delete(errorKey), // Clear any previous errors
      ]);

      // Step 7: Return success
      return NextResponse.json({
        ok: true,
        status: 'ready',
        slug,
        dataHash,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[ExecuteWarmup] ❌ Failed for ${slug}:`, errorMessage);

      // On error: set status to "failed" and store error
      const errorKey = warmupErrorKey(keyParams);
      
      await Promise.all([
        cache.set(statusKey, 'failed', 10 * 60), // 10 min TTL
        cache.set(errorKey, errorMessage, 10 * 60),
      ]);

      return NextResponse.json({
        ok: false,
        status: 'failed',
        error: errorMessage,
        slug,
        dataHash,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[ExecuteWarmup] Unexpected error:', error);
    return NextResponse.json(
      { 
        ok: false, 
        status: 'failed', 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

