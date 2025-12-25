/**
 * API Route: Get verified predictions for a comparison
 * Returns predictions that have been verified against actual data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedPredictions } from '@/lib/prediction-tracking-enhanced';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');
    const term = searchParams.get('term') || undefined;

    if (!slug) {
      return NextResponse.json(
        { error: 'Missing required parameter: slug' },
        { status: 400 }
      );
    }

    const predictions = await getVerifiedPredictions(slug, term);

    return NextResponse.json({
      success: true,
      predictions,
      count: predictions.length,
    });
  } catch (error: any) {
    console.error('[API] Error fetching verified predictions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verified predictions', details: error?.message },
      { status: 500 }
    );
  }
}


