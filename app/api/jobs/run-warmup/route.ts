/**
 * POST /api/jobs/run-warmup
 * 
 * Executes a single warmup job from the queue
 * Secured with WARMUP_SECRET
 * 
 * Picks one queued job (FIFO), marks it as running,
 * executes forecast generation, and marks it as ready/failed
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getOrBuildComparison } from '@/lib/getOrBuild';
import { runIntelligentComparison } from '@/lib/intelligent-comparison';
import { predictTrend } from '@/lib/prediction-engine-enhanced';
import { getCache } from '@/lib/cache';
import { forecastKey, warmupErrorKey, warmupDebugIdKey } from '@/lib/forecast/cacheKeys';
import { computeDataHash } from '@/lib/forecast/dataHash';
import type { ForecastBundleSummary } from '@/lib/insights/contracts/forecast-bundle-summary';
import { PREDICTION_ENGINE_VERSION } from '@/lib/insights/contracts/versions';
import { stableHash } from '@/lib/cache/hash';
import { fromSlug } from '@/lib/slug';
import { validateTopic } from '@/lib/validateTermsServer';
import type { SeriesPoint } from '@/lib/trends';

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
    console.error(`[RunWarmup] Error generating forecast for ${term}:`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify secret
    const secret = request.headers.get('X-Warmup-Secret');
    const expectedSecret = process.env.WARMUP_SECRET;
    
    if (!expectedSecret) {
      console.error('[RunWarmup] WARMUP_SECRET environment variable is not set');
      return NextResponse.json(
        { error: 'Warmup service is not configured' },
        { status: 503 }
      );
    }
    
    if (secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Pick one queued job (FIFO - oldest first)
    const job = await prisma.warmupJob.findFirst({
      where: {
        status: 'queued',
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (!job) {
      return NextResponse.json({
        success: true,
        message: 'No queued jobs',
        processed: 0,
      });
    }

    // Mark as running
    await prisma.warmupJob.update({
      where: { id: job.id },
      data: {
        status: 'running',
        startedAt: new Date(),
        attempts: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    console.log(`[RunWarmup] Processing job ${job.id} for ${job.slug} (debugId: ${job.debugId})`);

    try {
      // Parse slug to get terms
      const raw = fromSlug(job.slug);
      const checked = raw.map(validateTopic);
      const valid = checked.filter(isValidTopic);
      
      if (valid.length !== 2) {
        throw new Error('Invalid slug format');
      }

      const terms = valid.map((c) => c.term);
      const termA = terms[0];
      const termB = terms[1];

      // Get comparison data
      const row = await getOrBuildComparison({
        slug: job.slug,
        terms,
        timeframe: job.timeframe,
        geo: job.geo,
      });

      if (!row || !Array.isArray(row.series) || row.series.length === 0) {
        throw new Error('No comparison data available');
      }

      const series = row.series as Array<{ date: string; [key: string]: number }>;
      const category = row.category || 'general';

      // Generate forecasts for both terms
      const [forecastA, forecastB] = await Promise.all([
        generateForecast(termA, series, category, 'termA'),
        generateForecast(termB, series, category, 'termB'),
      ]);

      if (!forecastA || !forecastB) {
        throw new Error(`Failed to generate forecasts (termA: ${!!forecastA}, termB: ${!!forecastB})`);
      }

      // Write forecasts to cache using canonical keys
      const cache = getCache();
      const keyA = forecastKey(job.slug, termA, job.timeframe, job.geo, job.dataHash);
      const keyB = forecastKey(job.slug, termB, job.timeframe, job.geo, job.dataHash);

      await Promise.all([
        cache.set(keyA, forecastA, 24 * 60 * 60, 7 * 24 * 60 * 60), // 24h fresh, 7d stale
        cache.set(keyB, forecastB, 24 * 60 * 60, 7 * 24 * 60 * 60),
      ]);

      // Verify forecasts were written (read back once)
      const [verifyA, verifyB] = await Promise.all([
        cache.get(keyA),
        cache.get(keyB),
      ]);

      if (!verifyA || !verifyB) {
        throw new Error(`Forecasts not found in cache after write (termA: ${!!verifyA}, termB: ${!!verifyB})`);
      }

      // Store debug ID in cache for debugging
      const debugIdKey = warmupDebugIdKey(job.slug, job.timeframe, job.geo, job.dataHash);
      await cache.set(debugIdKey, job.debugId, 24 * 60 * 60);

      // Mark as ready
      await prisma.warmupJob.update({
        where: { id: job.id },
        data: {
          status: 'ready',
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log(`[RunWarmup] ✅ Successfully completed job ${job.id} for ${job.slug}`);

      return NextResponse.json({
        success: true,
        message: 'Warmup job completed',
        jobId: job.id,
        slug: job.slug,
        debugId: job.debugId,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[RunWarmup] ❌ Job ${job.id} failed:`, errorMessage);

      // Store error in cache
      const errorKey = warmupErrorKey(job.slug, job.timeframe, job.geo, job.dataHash);
      await getCache().set(errorKey, errorMessage, 10 * 60); // 10 min TTL

      // Mark as failed
      await prisma.warmupJob.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          lastError: errorMessage.substring(0, 500), // Limit error message length
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: false,
        message: 'Warmup job failed',
        jobId: job.id,
        slug: job.slug,
        error: errorMessage,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[RunWarmup] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

