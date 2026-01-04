/**
 * API Route: Record Comparison View (History)
 * POST: Record a comparison view in user's history
 * GET: Get user's comparison history
 */

import { NextRequest, NextResponse } from 'next/server';
import { recordComparisonView, getComparisonHistory, getMostViewedComparisons } from '@/lib/comparison-history';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, termA, termB, timeframe, geo } = body;

    if (!slug || !termA || !termB) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: slug, termA, termB' },
        { status: 400 }
      );
    }

    await recordComparisonView(slug, termA, termB, timeframe || '12m', geo || '');

    return NextResponse.json({ success: true, message: 'View recorded' });
  } catch (error: any) {
    console.error('[API] Error recording comparison view:', error);
    // Don't fail the request - history tracking is non-critical
    return NextResponse.json({ success: false, message: 'Failed to record view' });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const type = searchParams.get('type') || 'recent'; // 'recent' | 'most-viewed'

    if (type === 'most-viewed') {
      const mostViewed = await getMostViewedComparisons(limit);
      return NextResponse.json({ history: mostViewed, total: mostViewed.length });
    }

    const result = await getComparisonHistory(limit, offset);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API] Error fetching comparison history:', error);
    return NextResponse.json(
      { history: [], total: 0, error: error?.message || 'Failed to fetch history' },
      { status: 500 }
    );
  }
}


