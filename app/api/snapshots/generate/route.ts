/**
 * API Route: Generate Snapshot
 * POST /api/snapshots/generate?slug=...
 * 
 * Generates a snapshot server-side if missing
 * Fetches comparison signals, builds snapshot, saves and returns it
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/user-auth-helpers';
import { getOrBuildComparison } from '@/lib/getOrBuild';
import { runIntelligentComparison } from '@/lib/intelligent-comparison';
import { computeComparisonMetrics } from '@/lib/comparison-metrics';
import { saveComparisonSnapshot } from '@/lib/comparison-snapshots';
import { fromSlug, toCanonicalSlug } from '@/lib/slug';
import { validateTopic } from '@/lib/validateTermsServer';

function isValidTopic(
  r: ReturnType<typeof validateTopic>,
): r is { ok: true; term: string } {
  return r.ok;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('[SnapshotGenerate] 📸 Starting snapshot generation');
    
    const user = await getCurrentUser();
    if (!user) {
      console.log('[SnapshotGenerate] ❌ No user session found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = (user as any).id;
    if (!userId) {
      console.error('[SnapshotGenerate] ❌ User session missing id');
      return NextResponse.json(
        { error: 'Invalid user session' },
        { status: 401 }
      );
    }

    // Get slug from query params or body
    const { searchParams } = new URL(request.url);
    let slug = searchParams.get('slug');
    
    if (!slug) {
      try {
        const body = await request.json();
        slug = body.slug;
      } catch {
        // Body not JSON or missing
      }
    }

    if (!slug) {
      return NextResponse.json(
        { error: 'Missing required parameter: slug' },
        { status: 400 }
      );
    }

    const timeframe = searchParams.get('timeframe') || searchParams.get('tf') || '12m';
    const geo = searchParams.get('geo') || '';

    // Normalize slug to canonical format
    const raw = fromSlug(slug);
    const checked = raw.map(validateTopic);
    const valid = checked.filter(isValidTopic);
    
    if (valid.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid slug format' },
        { status: 400 }
      );
    }

    const slugTerms = valid.map((c) => c.term);
    const canonical = toCanonicalSlug(slugTerms);
    
    if (!canonical) {
      return NextResponse.json(
        { error: 'Invalid slug format' },
        { status: 400 }
      );
    }

    slug = canonical;

    console.log('[SnapshotGenerate] 📸 Generating snapshot for:', { slug, timeframe, geo, userId });

    // Fetch comparison data
    const row = await getOrBuildComparison({
      slug,
      terms: [],
      timeframe,
      geo,
    });

    if (!row || !row.series || row.series.length === 0) {
      console.log('[SnapshotGenerate] ❌ Comparison not found or has no data');
      return NextResponse.json(
        { error: 'Comparison not found or has no data' },
        { status: 404 }
      );
    }

    const terms = row.terms as string[];
    if (terms.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid comparison - must have exactly 2 terms' },
        { status: 400 }
      );
    }

    const series = row.series as Array<{ date: string; [key: string]: any }>;

    // Get intelligent comparison data
    let intelligentComparison;
    try {
      intelligentComparison = await runIntelligentComparison(
        terms,
        series,
        {
          enableYouTube: !!process.env.YOUTUBE_API_KEY,
          enableTMDB: !!process.env.TMDB_API_KEY,
          enableBestBuy: !!process.env.BESTBUY_API_KEY,
          enableSpotify: !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET),
          enableSteam: true,
          cachedCategory: row.category,
        }
      );
    } catch (error) {
      console.error('[SnapshotGenerate] ❌ Error getting intelligent comparison:', error);
      return NextResponse.json(
        { error: 'Failed to generate comparison data' },
        { status: 500 }
      );
    }

    // Compute metrics
    const termAScore = intelligentComparison.scores.termA.overall;
    const termBScore = intelligentComparison.scores.termB.overall;
    const winner = termAScore >= termBScore ? terms[0] : terms[1];
    const loser = winner === terms[0] ? terms[1] : terms[0];

    const metrics = computeComparisonMetrics(
      series,
      terms[0],
      terms[1],
      {
        winner,
        loser,
        winnerScore: Math.max(termAScore, termBScore),
        loserScore: Math.min(termAScore, termBScore),
        margin: intelligentComparison.verdict.margin,
        confidence: intelligentComparison.verdict.confidence,
      },
      intelligentComparison.scores.termA.breakdown,
      intelligentComparison.scores.termB.breakdown,
      null // No previous snapshot for generate
    );

    // Save snapshot
    await saveComparisonSnapshot(
      canonical,
      terms[0],
      terms[1],
      timeframe,
      geo,
      {
        marginPoints: metrics.marginPoints,
        confidence: metrics.confidence,
        volatility: metrics.volatility,
        agreementIndex: metrics.agreementIndex,
        winner: winner,
        winnerScore: Math.max(termAScore, termBScore),
        loserScore: Math.min(termAScore, termBScore),
        category: intelligentComparison.category.category,
      }
    );

    const duration = Date.now() - startTime;
    console.log('[SnapshotGenerate] ✅ Snapshot generated successfully in', duration, 'ms');

    return NextResponse.json({
      success: true,
      message: 'Snapshot generated successfully',
      snapshot: {
        slug: canonical,
        winner,
        marginPoints: metrics.marginPoints,
        confidence: metrics.confidence,
        computedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[SnapshotGenerate] ❌ Error in', duration, 'ms:', {
      error: error?.message || error,
      stack: error?.stack,
    });
    return NextResponse.json(
      { error: 'Failed to generate snapshot', details: error?.message },
      { status: 500 }
    );
  }
}

