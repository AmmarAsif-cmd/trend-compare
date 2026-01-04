/**
 * POST /api/jobs/warmup-forecasts
 * 
 * Nightly job to refresh forecasts for popular comparisons (last 7 days)
 * 
 * Requirements:
 * - Secure with secret token
 * - Uses distributed locks
 * - Job concurrency limits
 * - Logs job runs and failures
 */

import { NextRequest, NextResponse } from 'next/server';
import { warmupForecasts } from '@/lib/jobs/warmup-forecasts';
import { logJobStart, logJobCompletion } from '@/lib/jobs/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

// Job concurrency limit
const MAX_CONCURRENT_JOBS = 1;
let activeJobs = 0;

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify secret (from header or body for cron compatibility)
    const secret = request.headers.get('X-Job-Secret') || (await request.json().catch(() => ({}))).secret;
    const expectedSecret = process.env.JOB_SECRET || 'default-job-secret-change-in-production';
    
    if (secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check concurrency limit
    if (activeJobs >= MAX_CONCURRENT_JOBS) {
      return NextResponse.json(
        { error: 'Job concurrency limit reached. Another job is already running.' },
        { status: 429 }
      );
    }

    activeJobs++;
    await logJobStart('warmup-forecasts', { timestamp: new Date().toISOString() });

    try {
      // Parse body (may have been consumed for secret check)
      let body: any = {};
      try {
        const bodyText = await request.text();
        body = bodyText ? JSON.parse(bodyText) : {};
      } catch {
        // Body already parsed or empty
      }
      
      const limit = body.limit || 50;
      const concurrency = body.concurrency || 5;

      // Run warmup job
      const result = await warmupForecasts(limit, concurrency);

      await logJobCompletion('warmup-forecasts', result);

      return NextResponse.json({
        success: result.success,
        processed: result.processed,
        failed: result.failed,
        errors: result.errors,
        duration: result.duration,
      });
    } finally {
      activeJobs--;
    }
  } catch (error) {
    activeJobs--;
    console.error('[WarmupForecasts Job] Error:', error);
    
    await logJobCompletion('warmup-forecasts', {
      success: false,
      duration: Date.now() - startTime,
      errors: [error instanceof Error ? error.message : String(error)],
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

