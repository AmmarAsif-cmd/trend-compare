/**
 * POST /api/comparison/warmup
 * 
 * On-demand background job to warmup AI insights and forecasts
 * Secured with secret header
 * 
 * Requirements:
 * - Secure with secret token
 * - Uses distributed locks
 * - Never blocks user requests
 * - Logs job runs and failures
 */

import { NextRequest, NextResponse } from 'next/server';
import { warmupOnDemand } from '@/lib/jobs/warmup-on-demand';
import { logJobStart, logJobCompletion } from '@/lib/jobs/logger';
import { getOrBuildComparison } from '@/lib/getOrBuild';
import { fromSlug } from '@/lib/slug';
import { validateTopic } from '@/lib/validateTermsServer';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

function isValidTopic(
  r: ReturnType<typeof validateTopic>,
): r is { ok: true; term: string } {
  return r.ok;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify secret - no default fallback
    const secret = request.headers.get('X-Warmup-Secret');
    const expectedSecret = process.env.WARMUP_SECRET;
    
    if (!expectedSecret) {
      console.error('[Warmup] WARMUP_SECRET environment variable is not set');
      return NextResponse.json(
        { error: 'Warmup service is not configured' },
        { status: 503 }
      );
    }
    
    if (secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { slug, dataHash } = body;

    if (!slug || !dataHash) {
      return NextResponse.json(
        { error: 'Missing slug or dataHash' },
        { status: 400 }
      );
    }

    // Parse slug to get terms
    const raw = fromSlug(slug);
    const checked = raw.map(validateTopic);
    const valid = checked.filter(isValidTopic);
    
    if (valid.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid slug format' },
        { status: 400 }
      );
    }

    const terms = valid.map((c) => c.term);
    const termA = terms[0];
    const termB = terms[1];

    // Get comparison to determine timeframe and geo
    const row = await getOrBuildComparison({
      slug,
      terms,
      timeframe: '12m', // Default, can be passed in body
      geo: '', // Default, can be passed in body
    });

    if (!row) {
      return NextResponse.json(
        { error: 'Comparison not found' },
        { status: 404 }
      );
    }

    const timeframe = body.timeframe || row.timeframe || '12m';
    const geo = body.geo || row.geo || '';

    await logJobStart('warmup-on-demand', { slug, dataHash, timeframe, geo, timestamp: new Date().toISOString() });

    // Run warmup job (async, fire-and-forget)
    // Don't await - return immediately
    warmupOnDemand(slug, termA, termB, timeframe, geo, dataHash)
      .then(result => {
        logJobCompletion('warmup-on-demand', {
          success: result.success,
          duration: result.duration,
          errors: result.errors,
          processed: result.forecastsGenerated || result.aiInsightsGenerated ? 1 : 0,
        });
      })
      .catch(error => {
        console.error('[Warmup] Background job error:', error);
        logJobCompletion('warmup-on-demand', {
          success: false,
          duration: Date.now() - startTime,
          errors: [error instanceof Error ? error.message : String(error)],
        });
      });

    // Return immediately (job runs in background)
    return NextResponse.json({
      success: true,
      message: 'Warmup job queued',
      slug,
      dataHash,
    });
  } catch (error) {
    console.error('[Warmup] Error:', error);
    
    await logJobCompletion('warmup-on-demand', {
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

