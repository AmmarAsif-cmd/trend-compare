/**
 * POST /api/jobs/warmup-ai-explanations
 * 
 * Weekly job to refresh AI explanations for popular comparisons
 * 
 * Requirements:
 * - Secure with secret token
 * - Uses distributed locks
 * - Job concurrency limits
 * - Logs job runs and failures
 */

import { NextRequest, NextResponse } from 'next/server';
import { warmupAIExplanations } from '@/lib/jobs/warmup-ai-explanations';
import { logJobStart, logJobCompletion } from '@/lib/jobs/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 600; // 10 minutes max

// Job concurrency limit
const MAX_CONCURRENT_JOBS = 1;
let activeJobs = 0;

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify secret (from header or body for cron compatibility)
    const bodyText = await request.text();
    const body = bodyText ? JSON.parse(bodyText) : {};
    const secret = request.headers.get('X-Job-Secret') || body.secret;
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
    await logJobStart('warmup-ai-explanations', { timestamp: new Date().toISOString() });

    try {
      const limit = body.limit || 30;
      const concurrency = body.concurrency || 3;

      // Run warmup job
      const result = await warmupAIExplanations(limit, concurrency);

      await logJobCompletion('warmup-ai-explanations', result);

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
    console.error('[WarmupAI Job] Error:', error);
    
    await logJobCompletion('warmup-ai-explanations', {
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

