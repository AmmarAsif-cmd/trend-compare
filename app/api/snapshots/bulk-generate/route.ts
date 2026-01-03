/**
 * API Route: Bulk Generate Snapshots
 * POST /api/snapshots/bulk-generate
 * 
 * Generates snapshots for all tracked comparisons that don't have one yet
 * Useful for backfilling existing tracked items
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/user-auth-helpers';
import { getSavedComparisons } from '@/lib/saved-comparisons';
import { prisma } from '@/lib/db';
import { getOrBuildComparison } from '@/lib/getOrBuild';
import { runIntelligentComparison } from '@/lib/intelligent-comparison';
import { computeComparisonMetrics } from '@/lib/comparison-metrics';
import { saveComparisonSnapshot } from '@/lib/comparison-snapshots';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = (user as any).id;
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid user session' },
        { status: 401 }
      );
    }

    console.log('[BulkGenerate] 📸 Starting bulk snapshot generation for user:', userId);

    // Get all saved comparisons
    const savedResult = await getSavedComparisons(100, 0);
    const comparisons = savedResult.comparisons;

    console.log('[BulkGenerate] Found', comparisons.length, 'tracked comparisons');

    const results = {
      total: comparisons.length,
      generated: 0,
      skipped: 0,
      errors: 0,
      details: [] as Array<{ slug: string; status: 'generated' | 'skipped' | 'error'; error?: string }>,
    };

    for (const comp of comparisons) {
      try {
        // Check if snapshot already exists
        const existing = await prisma.comparisonSnapshot.findFirst({
          where: {
            userId,
            slug: comp.slug,
          },
          orderBy: { computedAt: 'desc' },
        });

        if (existing) {
          console.log('[BulkGenerate] ⏭️  Snapshot already exists for:', comp.slug);
          results.skipped++;
          results.details.push({ slug: comp.slug, status: 'skipped' });
          continue;
        }

        console.log('[BulkGenerate] 🔄 Generating snapshot for:', comp.slug);

        // Fetch comparison data
        const row = await getOrBuildComparison({
          slug: comp.slug,
          terms: [],
          timeframe: '12m',
          geo: '',
        });

        if (!row || !row.series || row.series.length === 0) {
          console.log('[BulkGenerate] ⚠️  No data for:', comp.slug);
          results.errors++;
          results.details.push({ slug: comp.slug, status: 'error', error: 'No comparison data' });
          continue;
        }

        const terms = row.terms as string[];
        if (terms.length !== 2) {
          results.errors++;
          results.details.push({ slug: comp.slug, status: 'error', error: 'Invalid terms' });
          continue;
        }

        const series = row.series as Array<{ date: string; [key: string]: any }>;

        // Get intelligent comparison
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
          console.error('[BulkGenerate] ❌ Error getting intelligent comparison for', comp.slug, ':', error);
          results.errors++;
          results.details.push({ slug: comp.slug, status: 'error', error: 'Intelligent comparison failed' });
          continue;
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
          null
        );

        // Save snapshot
        await saveComparisonSnapshot(
          comp.slug,
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

        console.log('[BulkGenerate] ✅ Generated snapshot for:', comp.slug);
        results.generated++;
        results.details.push({ slug: comp.slug, status: 'generated' });
      } catch (error: any) {
        console.error('[BulkGenerate] ❌ Error processing', comp.slug, ':', error);
        results.errors++;
        results.details.push({ slug: comp.slug, status: 'error', error: error?.message || 'Unknown error' });
      }
    }

    console.log('[BulkGenerate] ✅ Completed:', results);

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error('[BulkGenerate] ❌ Fatal error:', error);
    return NextResponse.json(
      { error: 'Failed to bulk generate snapshots', details: error?.message },
      { status: 500 }
    );
  }
}

