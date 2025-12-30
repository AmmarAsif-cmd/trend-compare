/**
 * GET /api/comparison/core
 * 
 * Returns immediate data for fast render:
 * - Basic comparison data (series, terms, stats)
 * - Core metrics
 * - Fast, cacheable endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrBuildComparison } from '@/lib/getOrBuild';
import { fromSlug, toCanonicalSlug } from '@/lib/slug';
import { validateTopic } from '@/lib/validateTermsServer';
import { smoothSeries } from '@/lib/series';
import type { SeriesPoint } from '@/lib/trends';

export const dynamic = 'force-dynamic';
export const revalidate = 600; // 10 minutes

function isValidTopic(
  r: ReturnType<typeof validateTopic>,
): r is { ok: true; term: string } {
  return r.ok;
}

export async function GET(request: NextRequest) {
  try {
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

    // Get core comparison data
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
    const rawSeries = row.series as SeriesPoint[];
    
    // Ensure series is an array
    if (!Array.isArray(rawSeries) || rawSeries.length === 0) {
      return NextResponse.json(
        { error: 'No data available' },
        { status: 404 }
      );
    }

    // Smooth series
    const series = smoothSeries(rawSeries, 4);

    // Calculate basic stats
    const keyA = actualTerms[0];
    const keyB = actualTerms[1];
    
    const valuesA = series.map(p => Number(p[keyA] || 0)).filter(v => isFinite(v));
    const valuesB = series.map(p => Number(p[keyB] || 0)).filter(v => isFinite(v));
    
    const totalA = valuesA.reduce((a, b) => a + b, 0);
    const totalB = valuesB.reduce((a, b) => a + b, 0);
    const total = totalA + totalB;
    
    const aShare = total > 0 ? (totalA / total) * 100 : 50;
    const bShare = total > 0 ? (totalB / total) * 100 : 50;

    // Return core data
    return NextResponse.json({
      slug: canonical,
      terms: actualTerms,
      timeframe,
      geo,
      series,
      stats: {
        termA: {
          total: totalA,
          share: aShare,
          average: valuesA.length > 0 ? totalA / valuesA.length : 0,
        },
        termB: {
          total: totalB,
          share: bShare,
          average: valuesB.length > 0 ? totalB / valuesB.length : 0,
        },
      },
      category: row.category || null,
      viewCount: row.viewCount || 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('[Comparison Core] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

