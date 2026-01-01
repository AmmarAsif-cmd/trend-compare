/**
 * API Route: Save/Unsave Comparison
 * POST: Save a comparison
 * DELETE: Unsave a comparison
 */

import { NextRequest, NextResponse } from 'next/server';
import { saveComparison, unsaveComparison } from '@/lib/saved-comparisons';
import { getOrBuildComparison } from '@/lib/getOrBuild';
import { runIntelligentComparison } from '@/lib/intelligent-comparison';
import { computeComparisonMetrics } from '@/lib/comparison-metrics';
import { saveComparisonSnapshot } from '@/lib/comparison-snapshots';

/**
 * Generate snapshot for a saved comparison (non-blocking)
 * This runs in the background and doesn't block the save response
 */
async function generateSnapshotForSavedComparison(
  slug: string,
  termA: string,
  termB: string
) {
  try {
    console.log('[API Save] 🔄 Generating snapshot for saved comparison:', slug);
    
    // Fetch comparison data
    const row = await getOrBuildComparison({
      slug,
      terms: [],
      timeframe: '12m',
      geo: '',
    });

    if (!row || !row.series || row.series.length === 0) {
      console.warn('[API Save] ⚠️ No comparison data found for snapshot:', slug);
      return;
    }

    const terms = row.terms as string[];
    if (terms.length !== 2) {
      console.warn('[API Save] ⚠️ Invalid terms for snapshot:', slug);
      return;
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
      console.warn('[API Save] ⚠️ Error getting intelligent comparison for snapshot:', error);
      return;
    }

    // Compute metrics
    const termAScore = intelligentComparison.scores.termA.overall;
    const termBScore = intelligentComparison.scores.termB.overall;
    const winner = termAScore >= termBScore ? terms[0] : terms[1];

    const metrics = computeComparisonMetrics(
      series,
      terms[0],
      terms[1],
      {
        winner,
        loser: winner === terms[0] ? terms[1] : terms[0],
        winnerScore: Math.max(termAScore, termBScore),
        loserScore: Math.min(termAScore, termBScore),
        margin: intelligentComparison.verdict.margin,
        confidence: intelligentComparison.verdict.confidence,
      },
      intelligentComparison.scores.termA.breakdown,
      intelligentComparison.scores.termB.breakdown,
      null
    );

    // Save snapshot
    await saveComparisonSnapshot(
      slug,
      terms[0],
      terms[1],
      '12m',
      '',
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

    console.log('[API Save] ✅ Snapshot generated successfully for:', slug);
  } catch (error) {
    // Don't fail the save if snapshot generation fails
    console.warn('[API Save] ⚠️ Error generating snapshot (non-critical):', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (jsonError: any) {
      console.error('[API Save] Failed to parse request body:', jsonError);
      return NextResponse.json(
        { success: false, message: 'Invalid request body. Expected JSON.' },
        { status: 400 }
      );
    }

    const { slug, termA, termB, category, notes, tags } = body;

    console.log('[API Save] Request received:', { slug, termA, termB, category });

    if (!slug || !termA || !termB) {
      console.warn('[API Save] Missing required fields:', { slug, termA, termB });
      return NextResponse.json(
        { success: false, message: 'Missing required fields: slug, termA, termB' },
        { status: 400 }
      );
    }

    const result = await saveComparison(slug, termA, termB, category, notes, tags);

    console.log('[API Save] Result:', JSON.stringify(result, null, 2));

    if (!result.success) {
      const statusCode = result.message?.includes('logged in') ? 401 : 400;
      const errorResponse = { 
        success: false, 
        message: result.message || 'Failed to save comparison',
      };
      console.log('[API Save] Returning error response:', JSON.stringify(errorResponse, null, 2));
      return NextResponse.json(errorResponse, { 
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Generate snapshot in the background (don't await - fire and forget)
    // This ensures snapshots are created immediately when saving, but doesn't block the response
    generateSnapshotForSavedComparison(slug, termA, termB).catch(error => {
      console.warn('[API Save] Snapshot generation failed (non-critical):', error);
    });

    const successResponse = { 
      success: true, 
      message: result.message || 'Comparison saved', 
      id: result.id,
    };
    console.log('[API Save] Returning success response:', JSON.stringify(successResponse, null, 2));
    return NextResponse.json(successResponse, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('[API Save] Error saving comparison:', {
      error: error?.message || error,
      stack: error?.stack,
      code: error?.code,
      name: error?.name,
    });
    
    // Always return valid JSON, even on error
    return NextResponse.json(
      { 
        success: false, 
        message: error?.message || 'Failed to save comparison',
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const slug = body.slug || request.nextUrl.searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameter: slug' },
        { status: 400 }
      );
    }

    const result = await unsaveComparison(slug);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API] Error unsaving comparison:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to unsave comparison' },
      { status: 500 }
    );
  }
}

