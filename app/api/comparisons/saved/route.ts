/**
 * API Route: Get Saved Comparisons
 * GET: Retrieve user's saved comparisons
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSavedComparisons } from '@/lib/saved-comparisons';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await getSavedComparisons(limit, offset);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API] Error fetching saved comparisons:', error);
    return NextResponse.json(
      { comparisons: [], total: 0, error: error?.message || 'Failed to fetch saved comparisons' },
      { status: 500 }
    );
  }
}


