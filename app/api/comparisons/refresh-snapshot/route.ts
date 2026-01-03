/**
 * API Route: Refresh snapshot for a comparison
 * Generates a snapshot on-demand for comparisons that don't have one yet
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
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    let { slug, timeframe = '12m', geo = '' } = body;

    if (!slug) {
      return NextResponse.json(
        { error: 'Missing required parameter: slug' },
        { status: 400 }
      );
    }

    // Normalize slug to canonical format (same as compare page)
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

    // Use canonical slug for consistency
    slug = canonical;

    // Fetch comparison data
    const row = await getOrBuildComparison({
      slug,
      terms: [],
      timeframe,
      geo,
    });

    if (!row || !row.series || row.series.length === 0) {
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
      console.error('[RefreshSnapshot] Error getting intelligent comparison:', error);
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
      null // No previous snapshot for refresh
    );

    // Save snapshot (use canonical slug for consistency)
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
        winner: winner, // Use computed winner
        winnerScore: Math.max(termAScore, termBScore),
        loserScore: Math.min(termAScore, termBScore),
        category: intelligentComparison.category.category,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Snapshot generated successfully',
    });
  } catch (error: any) {
    console.error('[RefreshSnapshot] Error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh snapshot', details: error?.message },
      { status: 500 }
    );
  }
}

