/**
 * GET /api/forecast/trust-stats
 * 
 * Returns aggregated trust statistics for forecasts
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const stats = await prisma.forecastTrustStats.findUnique({
      where: { period: 'alltime' },
    });

    if (!stats) {
      return NextResponse.json({
        totalEvaluated: 0,
        winnerAccuracyPercent: null,
        intervalCoveragePercent: null,
        last90DaysAccuracy: null,
        sampleSize: 0,
      });
    }

    return NextResponse.json({
      totalEvaluated: stats.totalEvaluated,
      winnerAccuracyPercent: stats.winnerAccuracyPercent,
      intervalCoveragePercent: stats.intervalCoveragePercent,
      last90DaysAccuracy: stats.last90DaysAccuracy,
      sampleSize: stats.sampleSize,
    });
  } catch (error) {
    console.error('[TrustStats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load trust stats' },
      { status: 500 }
    );
  }
}

