/**
 * API Route: Check if comparison is saved
 * GET /api/comparisons/saved/[slug]: Check if a specific comparison is saved
 */

import { NextRequest, NextResponse } from 'next/server';
import { isComparisonSaved } from '@/lib/saved-comparisons';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    if (!slug) {
      return NextResponse.json(
        { saved: false, error: 'Missing slug parameter' },
        { status: 400 }
      );
    }

    const saved = await isComparisonSaved(slug);

    return NextResponse.json({ saved });
  } catch (error: any) {
    console.error('[API] Error checking if saved:', error);
    return NextResponse.json(
      { saved: false, error: error?.message || 'Failed to check saved status' },
      { status: 500 }
    );
  }
}


