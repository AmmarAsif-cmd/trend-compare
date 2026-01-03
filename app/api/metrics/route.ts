/**
 * Performance Metrics Endpoint
 * Internal endpoint to view performance metrics (dev + prod safe)
 */

import { NextRequest, NextResponse } from 'next/server';
import { metricsCollector } from '@/lib/performance/metrics';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Optional: Add authentication check for production
  const authHeader = request.headers.get('authorization');
  const metricsSecret = process.env.METRICS_SECRET;

  if (metricsSecret && authHeader !== `Bearer ${metricsSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Get cache stats
  const { getStats } = await import('@/lib/cache');
  const cacheStats = getStats();

  return NextResponse.json({
    cache: cacheStats,
    note: 'Request-level metrics are logged to console. Check server logs for detailed metrics.',
  }, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

