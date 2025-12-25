/**
 * GET /api/comparison/deepdive
 * 
 * Returns heavy metrics and breakdown tables:
 * - Multi-source breakdown
 * - Geographic breakdown
 * - Detailed statistics
 * - Performance metrics
 * 
 * Requirements:
 * - Rate limited
 * - Can be expensive to compute
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrBuildComparison } from '@/lib/getOrBuild';
import { runIntelligentComparison } from '@/lib/intelligent-comparison';
import { getGeographicBreakdown } from '@/lib/getGeographicData';
import { fromSlug, toCanonicalSlug } from '@/lib/slug';
import { validateTopic } from '@/lib/validateTermsServer';
import { smoothSeries } from '@/lib/series';

export const dynamic = 'force-dynamic';

// Rate limiting: 10 requests per minute per user
const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

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

export async function GET(request: NextRequest) {
  try {
    // Get user ID for rate limiting
    const { getCurrentUser } = await import('@/lib/user-auth-helpers');
    const user = await getCurrentUser();
    const userId = user ? (user as any).id : 'anonymous';

    // Rate limiting
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const timeframe = searchParams.get('tf') || '12m';
    const geo = searchParams.get('geo') || '';

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter required' },
        { status: 400 }
      );
    }

    // Validate and normalize slug
    const raw = fromSlug(slug);
    const checked = raw.map(validateTopic);
    const valid = checked.filter(isValidTopic);
    
    if (valid.length !== checked.length) {
      return NextResponse.json(
        { error: 'Invalid terms in slug' },
        { status: 400 }
      );
    }

    const terms = valid.map((c) => c.term);
    const canonical = toCanonicalSlug(terms);
    
    if (!canonical || canonical !== slug) {
      return NextResponse.json(
        { error: 'Invalid slug format' },
        { status: 400 }
      );
    }

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
        { status: 404 }
      );
    }

    const actualTerms = row.terms as string[];
    const rawSeries = row.series as Array<{ date: string; [key: string]: number }>;
    
    if (!Array.isArray(rawSeries) || rawSeries.length === 0) {
      return NextResponse.json(
        { error: 'No data available' },
        { status: 404 }
      );
    }

    const series = smoothSeries(rawSeries, 4);

    // Run intelligent comparison (expensive operation)
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
      console.error('[DeepDive] Intelligent comparison failed:', error);
      // Continue with basic data
    }

    // Get geographic breakdown
    const geographicData = await getGeographicBreakdown(
      actualTerms[0],
      actualTerms[1],
      series
    );

    // Build breakdown tables
    const breakdown = intelligentComparison ? {
      scores: {
        termA: intelligentComparison.scores.termA,
        termB: intelligentComparison.scores.termB,
      },
      sources: intelligentComparison.performance?.sourcesQueried || ['Google Trends'],
      category: intelligentComparison.category?.category || row.category || 'general',
    } : null;

    return NextResponse.json({
      breakdown,
      geographic: geographicData,
      performance: intelligentComparison?.performance || null,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('[Comparison DeepDive] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

