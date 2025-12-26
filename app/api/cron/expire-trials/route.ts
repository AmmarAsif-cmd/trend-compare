import { NextRequest, NextResponse } from 'next/server';
import { expireTrials } from '@/lib/trial-system';

/**
 * Cron job endpoint to convert expired trials to premium
 * Set up in Vercel: Configure a cron job to hit this endpoint daily
 *
 * Vercel Cron Config (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/expire-trials",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const convertedCount = await expireTrials();

    return NextResponse.json({
      success: true,
      message: `Converted ${convertedCount} trial users to premium`,
      convertedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Cron] Error expiring trials:', error);
    return NextResponse.json(
      { error: 'Failed to expire trials', details: error.message },
      { status: 500 }
    );
  }
}

// Allow GET requests without authentication in development
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
