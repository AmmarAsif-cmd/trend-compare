import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, canAccessPremium } from '@/lib/user-auth-helpers';
import googleTrends from 'google-trends-api';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const isPremium = await canAccessPremium();

    if (!isPremium) {
      return NextResponse.json(
        { error: 'Premium subscription required to export data' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'Missing comparison slug' },
        { status: 400 }
      );
    }

    // Parse slug to get terms
    const parts = slug.split('-vs-');
    if (parts.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid comparison slug format' },
        { status: 400 }
      );
    }

    const [termA, termB] = parts;

    // Fetch trend data from Google Trends
    const timeframe = searchParams.get('tf') || '12m';
    const geo = searchParams.get('geo') || '';

    let trendsTime = 'today 12-m';
    if (timeframe === '7d') trendsTime = 'now 7-d';
    else if (timeframe === '30d') trendsTime = 'today 1-m';
    else if (timeframe === '12m') trendsTime = 'today 12-m';
    else if (timeframe === '5y') trendsTime = 'today 5-y';
    else if (timeframe === 'all') trendsTime = 'all';

    const trendsResult = await googleTrends.interestOverTime({
      keyword: [termA.replace(/-/g, ' '), termB.replace(/-/g, ' ')],
      startTime: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      geo: geo || '',
      granularTimeResolution: true,
    });

    const parsed = JSON.parse(trendsResult);
    const timelines = parsed.default?.timelineData || [];

    // Transform data for export
    const series = timelines.map((item: any) => {
      const date = item.formattedTime;
      const values = item.value || [];

      return {
        date,
        [termA]: values[0] || 0,
        [termB]: values[1] || 0,
      };
    });

    return NextResponse.json({
      termA,
      termB,
      timeframe,
      geo: geo || 'Worldwide',
      series,
      exportedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Export] Error:', error);
    return NextResponse.json(
      { error: 'Failed to export data', details: error.message },
      { status: 500 }
    );
  }
}
