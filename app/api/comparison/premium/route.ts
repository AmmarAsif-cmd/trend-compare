/**
 * GET /api/comparison/premium
 * 
 * Returns premium insights:
 * - InsightsPack (if available)
 * - Forecast bundle (if cached)
 * - AI insights (if cached)
 * - needsWarmup flag
 * 
 * Requirements:
 * - Premium access required (server-side enforcement)
 * - Rate limited
 * - Never blocks on AI generation (only reads cached)
 * - Triggers background warmup if needsWarmup is true
 * 
 * Query Parameters:
 * - slug: Canonical slug (e.g., "amazon-vs-costco")
 * - OR termA + termB: Individual terms (backward compatible)
 * - tf OR timeframe: Timeframe (default: "12m")
 * - geo: Geographic region (default: "")
 * 
 * Test Commands:
 *   # Using slug:
 *   curl -i "http://localhost:3000/api/comparison/premium?slug=amazon-vs-costco&tf=12m"
 * 
 *   # Using termA + termB (backward compatible):
 *   curl -i "http://localhost:3000/api/comparison/premium?termA=amazon&termB=costco&timeframe=12m"
 */

import { NextRequest, NextResponse } from 'next/server';
import { canAccessPremium } from '@/lib/user-auth-helpers';
import { getInsightsPack, type GetInsightsPackInput } from '@/lib/insights/generate';
import { getOrBuildComparison } from '@/lib/getOrBuild';
import { runIntelligentComparison } from '@/lib/intelligent-comparison';
import { fromSlug, toCanonicalSlug } from '@/lib/slug';
import { validateTopic } from '@/lib/validateTermsServer';
import { generateSignals } from '@/lib/insights/generate';
import { generateInterpretations } from '@/lib/insights/generate';
import { generateDecisionGuidance } from '@/lib/insights/generate';
import { getCache } from '@/lib/cache';
import { createCacheKey } from '@/lib/cache/hash';
import { 
  forecastKey, 
  warmupStatusKey, 
  warmupErrorKey,
  warmupStartedAtKey,
  warmupFinishedAtKey,
  type WarmupKeyParams
} from '@/lib/forecast/cacheKeys';
import { getOrComputeForecastPack } from '@/lib/forecasting/forecast-pack';

export const dynamic = 'force-dynamic';

// Rate limiting: 20 requests per minute per user
const RATE_LIMIT = 20;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

// Simple in-memory rate limiter (can be replaced with Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(userId);
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

function isValidTopic(
  r: ReturnType<typeof validateTopic>,
): r is { ok: true; term: string } {
  return r.ok;
}

/**
 * Trigger warmup execution (sets queued status and calls execute-warmup endpoint)
 */
async function triggerWarmup(slug: string, dataHash: string, timeframe: string, geo: string): Promise<boolean> {
  const warmupSecret = process.env.WARMUP_SECRET;
  
  // No default fallback - warmup requires explicit secret
  if (!warmupSecret) {
    console.warn('[Premium] WARMUP_SECRET not set, skipping warmup trigger');
    return false;
  }

  const cache = getCache();
  const keyParams: WarmupKeyParams = { slug, tf: timeframe, geo, dataHash };
  const statusKey = warmupStatusKey(keyParams);

  // Check if warmup already triggered (prevent duplicate jobs)
  const existingStatus = await cache.get<string>(statusKey);
  if (existingStatus && existingStatus !== 'failed') {
    // Already queued or running
    return true;
  }

  // Set warmup status to "queued" (TTL 15m) if not already set
  await cache.set(statusKey, 'queued', 15 * 60);

  // Call execute-warmup endpoint (async, but compute happens in that endpoint runtime)
  fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/jobs/execute-warmup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Warmup-Secret': warmupSecret,
    },
    body: JSON.stringify({ slug, tf: timeframe, geo, dataHash }),
  }).catch(error => {
    console.error('[Premium] Failed to trigger warmup execution:', error);
  });

  return true;
}

/**
 * Get dev-only diagnostic headers
 */
function getDiagnosticHeaders(): Record<string, string> {
  const isDev = process.env.NODE_ENV === 'development';
  const debugEnabled = process.env.DEBUG_API_HEADERS === 'true';
  
  if (isDev || debugEnabled) {
    return {
      'X-API-Route': 'comparison-premium',
      'X-App': 'trendarc',
    };
  }
  
  return {};
}

export async function GET(request: NextRequest) {
  // Get diagnostic headers (dev-only)
  const diagnosticHeaders = getDiagnosticHeaders();
  
  try {
    // Check premium access (server-side enforcement)
    const hasPremium = await canAccessPremium();
    if (!hasPremium) {
      return NextResponse.json(
        { error: 'Premium subscription required' },
        { 
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...diagnosticHeaders,
          },
        }
      );
    }

    // Get user ID for rate limiting
    const { getCurrentUser } = await import('@/lib/user-auth-helpers');
    const user = await getCurrentUser();
    if (!user || !(user as any).id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...diagnosticHeaders,
          },
        }
      );
    }

    const userId = (user as any).id;

    // Rate limiting
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...diagnosticHeaders,
          },
        }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Support both query styles: slug OR (termA + termB)
    let slug = searchParams.get('slug');
    let terms: string[] = [];
    let canonical: string | null = null;
    
    if (slug) {
      // Style 1: Using slug
      const raw = fromSlug(slug);
      const checked = raw.map(validateTopic);
      const valid = checked.filter(isValidTopic);
      
      if (valid.length !== checked.length) {
        return NextResponse.json(
          { error: 'Invalid terms in slug' },
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...diagnosticHeaders,
            },
          }
        );
      }
      
      terms = valid.map((c) => c.term);
      canonical = toCanonicalSlug(terms);
      
      if (!canonical || canonical !== slug) {
        return NextResponse.json(
          { error: 'Invalid slug format' },
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...diagnosticHeaders,
            },
          }
        );
      }
    } else {
      // Style 2: Using termA + termB (backward compatible)
      const termA = searchParams.get('termA');
      const termB = searchParams.get('termB');
      
      if (!termA || !termB) {
        return NextResponse.json(
          { error: 'Either slug parameter or both termA and termB parameters are required' },
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...diagnosticHeaders,
            },
          }
        );
      }
      
      // Validate both terms
      const checkedA = validateTopic(termA);
      const checkedB = validateTopic(termB);
      
      if (!checkedA.ok || !checkedB.ok) {
        const invalidTerms: string[] = [];
        if (!checkedA.ok) invalidTerms.push(`termA: ${checkedA.reason || 'invalid'}`);
        if (!checkedB.ok) invalidTerms.push(`termB: ${checkedB.reason || 'invalid'}`);
        
        return NextResponse.json(
          { error: `Invalid terms: ${invalidTerms.join(', ')}` },
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...diagnosticHeaders,
            },
          }
        );
      }
      
      terms = [checkedA.term, checkedB.term];
      canonical = toCanonicalSlug(terms);
      
      if (!canonical) {
        return NextResponse.json(
          { error: 'Failed to generate canonical slug from terms' },
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...diagnosticHeaders,
            },
          }
        );
      }
      
      slug = canonical; // Use canonical slug for consistency
    }
    
    // Support both tf and timeframe query parameters
    const timeframe = searchParams.get('tf') || searchParams.get('timeframe') || '12m';
    const geo = searchParams.get('geo') || '';

    // Get comparison data
    const row = await getOrBuildComparison({
      slug: canonical,
      terms,
      timeframe,
      geo,
    });

    if (!row) {
      return NextResponse.json(
        { error: 'Comparison not found' },
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...diagnosticHeaders,
          },
        }
      );
    }

    const actualTerms = row.terms as string[];
    const series = row.series as Array<{ date: string; [key: string]: number }>;
    
    if (!Array.isArray(series) || series.length === 0) {
      return NextResponse.json(
        { error: 'No data available' },
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...diagnosticHeaders,
          },
        }
      );
    }

    // Get or build InsightsPack (only reads cached AI, never generates)
    try {
      // Get intelligent comparison for accurate scores (lightweight, cached)
      let intelligentComparison: any = null;
      try {
        intelligentComparison = await runIntelligentComparison(
          actualTerms,
          series,
          {
            enableYouTube: !!process.env.YOUTUBE_API_KEY,
            enableTMDB: !!process.env.TMDB_API_KEY,
            enableBestBuy: !!process.env.BESTBUY_API_KEY,
            enableSpotify: !!process.env.SPOTIFY_CLIENT_ID,
            enableSteam: !!process.env.STEAM_API_KEY,
            cachedCategory: row.category || null,
          }
        );
      } catch (error) {
        console.warn('[Premium] Intelligent comparison failed, using defaults:', error);
      }

      const scores = intelligentComparison ? {
        termA: intelligentComparison.scores.termA,
        termB: intelligentComparison.scores.termB,
      } : {
        termA: { overall: 50, breakdown: { searchInterest: 50, socialBuzz: 50, authority: 50, momentum: 50 }, confidence: 50, sources: [], explanation: '' },
        termB: { overall: 50, breakdown: { searchInterest: 50, socialBuzz: 50, authority: 50, momentum: 50 }, confidence: 50, sources: [], explanation: '' },
      };

      // Generate signals and interpretations (deterministic, fast)
      const signals = generateSignals({
        termA: actualTerms[0],
        termB: actualTerms[1],
        timeframe,
        series,
        scores,
        dataSource: 'google-trends',
        lastUpdatedAt: row.updatedAt.toISOString(),
      });

      const interpretations = generateInterpretations({
        termA: actualTerms[0],
        termB: actualTerms[1],
        signals,
        scores: {
          termA: { overall: scores.termA.overall, breakdown: scores.termA.breakdown },
          termB: { overall: scores.termB.overall, breakdown: scores.termB.breakdown },
        },
        seriesLength: series.length,
        dataSource: 'google-trends',
        lastUpdatedAt: row.updatedAt.toISOString(),
      });

      const decisionGuidance = generateDecisionGuidance({
        termA: actualTerms[0],
        termB: actualTerms[1],
        signals,
        interpretations,
        scores: {
          termA: { overall: scores.termA.overall, breakdown: { momentum: scores.termA.breakdown.momentum } },
          termB: { overall: scores.termB.overall, breakdown: { momentum: scores.termB.breakdown.momentum } },
        },
        dataSource: 'google-trends',
        lastUpdatedAt: row.updatedAt.toISOString(),
      });

      // Get InsightsPack first to get dataHash
      // This will convert Signal[] to SignalsSummary internally
      const result = await getInsightsPack({
        slug: canonical,
        termA: actualTerms[0],
        termB: actualTerms[1],
        timeframe,
        geo,
        category: row.category || undefined,
        series,
        signals,
        interpretations,
        scores: {
          termA: {
            overall: scores.termA.overall,
            breakdown: {
              momentum: scores.termA.breakdown?.momentum || 50,
            },
          },
          termB: {
            overall: scores.termB.overall,
            breakdown: {
              momentum: scores.termB.breakdown?.momentum || 50,
            },
          },
        },
        decisionGuidance,
        // Forecasts will be loaded using canonical keys below
        forecasts: undefined,
        peaks: undefined, // TODO: Load from cache if available
        aiInsights: undefined, // Will load below
        dataSource: 'google-trends',
        lastUpdatedAt: row.updatedAt.toISOString(),
      });

      // Load cached forecasts and AI insights using canonical cache keys
      const cache = getCache();
      const dataHash = result.pack.dataHash;
      const keyParams: WarmupKeyParams = { slug: canonical, tf: timeframe, geo, dataHash };
      
      // Build forecast keys using canonical helper
      const forecastKeyA = forecastKey({ slug: canonical, term: actualTerms[0], tf: timeframe, geo, dataHash });
      const forecastKeyB = forecastKey({ slug: canonical, term: actualTerms[1], tf: timeframe, geo, dataHash });
      const aiInsightsKey = createCacheKey('ai-insights', canonical, timeframe);
      
      // Get new forecast pack (with proper time-series forecasting)
      // This runs in parallel with cache reads for better performance
      const forecastPackPromise = getOrComputeForecastPack(
        row.id,
        actualTerms[0],
        actualTerms[1],
        series,
        timeframe,
        28, // 4 weeks default
        row.category || 'general' // Use category from database for TrendArc Score calculation
      ).catch(error => {
        console.error('[Premium] Error computing forecast pack:', error);
        return null;
      });
      
      // Read forecasts and AI insights from cache
      const [cachedForecastA, cachedForecastB, cachedAIInsights, forecastPack] = await Promise.all([
        cache.get(forecastKeyA),
        cache.get(forecastKeyB),
        cache.get(aiInsightsKey),
        forecastPackPromise,
      ]);

      // Determine forecast availability
      // Forecasts are required, AI insights are optional
      const hasForecasts = !!(cachedForecastA && cachedForecastB);
      const hasAIInsights = !!cachedAIInsights;

      // Read warmup status from cache
      const statusKey = warmupStatusKey(keyParams);
      const cachedStatus = await cache.get<string>(statusKey);

      // Determine warmup status and trigger if needed
      let warmupStatus: 'needs_warmup' | 'queued' | 'running' | 'ready' | 'failed' = 'needs_warmup';
      let warmupTriggered = false;

      if (hasForecasts) {
        // Forecasts are ready
        warmupStatus = 'ready';
      } else if (cachedStatus) {
        // Use cached status
        warmupStatus = cachedStatus as any;
        warmupTriggered = true;
      } else {
        // No forecasts and no status - trigger warmup
        warmupStatus = 'queued';
        warmupTriggered = true;
        await triggerWarmup(canonical, dataHash, timeframe, geo);
      }

      // Determine needsWarmup
      const needsWarmup = !hasForecasts;

      // Load debug information if DEBUG_API_HEADERS is enabled
      let debugInfo: any = undefined;
      if (process.env.DEBUG_API_HEADERS === 'true') {
        const errorKey = warmupErrorKey(keyParams);
        const startedAtKey = warmupStartedAtKey(keyParams);
        const finishedAtKey = warmupFinishedAtKey(keyParams);
        
        const [warmupError, warmupStartedAt, warmupFinishedAt] = await Promise.all([
          cache.get<string>(errorKey),
          cache.get<string>(startedAtKey),
          cache.get<string>(finishedAtKey),
        ]);

        debugInfo = {
          warmupStatusKey: statusKey,
          forecastKeys: {
            termAKey: forecastKeyA,
            termBKey: forecastKeyB,
          },
          warmupStartedAt: warmupStartedAt || null,
          warmupFinishedAt: warmupFinishedAt || null,
          warmupError: warmupError || null,
        };
      }

      // Update insightsPack with cached forecasts and AI insights
      // Prefer new forecast pack if available, otherwise fall back to old forecasts
      const insightsPackWithForecasts = {
        ...result.pack,
        forecasts: forecastPack ? {
          termA: {
            points: forecastPack.termA.points,
            model: forecastPack.termA.model,
            confidence: forecastPack.termA.confidenceScore,
            metrics: forecastPack.termA.metrics,
            qualityFlags: forecastPack.termA.qualityFlags,
          },
          termB: {
            points: forecastPack.termB.points,
            model: forecastPack.termB.model,
            confidence: forecastPack.termB.confidenceScore,
            metrics: forecastPack.termB.metrics,
            qualityFlags: forecastPack.termB.qualityFlags,
          },
        } : {
          termA: cachedForecastA || undefined,
          termB: cachedForecastB || undefined,
        },
        aiInsights: cachedAIInsights || undefined,
      };

      // Check if insightsPack was loaded from cache
      const insightsPackCacheKey = createCacheKey('insights-pack', canonical, dataHash);
      const cachedInsightsPack = await cache.get(insightsPackCacheKey);
      const isCached = !!cachedInsightsPack;

      // Determine needsWarmup (forecasts are required, AI is optional)
      const needsWarmup = !hasForecasts;

      // Build enhanced response
      // Use insightsPack.signals as single source of truth (mirror to top-level for convenience)
      const response: any = {
        isPremium: true,
        cached: isCached,
        forecastAvailable: hasForecasts || !!forecastPack,
        warmupStatus,
        warmupTriggered,
        signals: insightsPackWithForecasts.signals, // Mirror from insightsPack.signals (single source of truth)
        insightsPack: insightsPackWithForecasts,
        needsWarmup,
      };

      // Add forecast pack if available
      if (forecastPack) {
        response.forecastPack = {
          termA: forecastPack.termA,
          termB: forecastPack.termB,
          headToHead: forecastPack.headToHead,
          computedAt: forecastPack.computedAt,
          horizon: forecastPack.horizon,
        };
      }

      // Add debugging info when DEBUG_API_HEADERS is enabled
      if (debugInfo) {
        response.debug = debugInfo;
      }

      return NextResponse.json(response, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800',
          ...diagnosticHeaders,
        },
      });
    } catch (error) {
      console.error('[Premium] Error getting InsightsPack:', error);
      return NextResponse.json(
        { error: 'Failed to load premium insights' },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...diagnosticHeaders,
          },
        }
      );
    }
  } catch (error) {
    console.error('[Comparison Premium] Error:', error);
    // Final catch-all: always return JSON, never HTML
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...diagnosticHeaders,
        },
      }
    );
  }
}

