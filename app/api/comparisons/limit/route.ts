/**
 * API Route: Check Comparison Limit
 * GET: Get current user's daily comparison limit status
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkComparisonLimit, getLimitStatusMessage } from '@/lib/daily-limit';

export async function GET(request: NextRequest) {
  try {
    const limitCheck = await checkComparisonLimit();
    const statusMessage = await getLimitStatusMessage();

    return NextResponse.json({
      allowed: limitCheck.allowed,
      remaining: limitCheck.remaining,
      limit: limitCheck.limit,
      count: limitCheck.count,
      message: statusMessage.message,
      showUpgrade: statusMessage.showUpgrade,
    });
  } catch (error: any) {
    console.error('[API Limit] Error checking limit:', error);
    return NextResponse.json(
      {
        allowed: true, // Fail open
        remaining: 50,
        limit: 50,
        count: 0,
        message: 'Unlimited comparisons',
        showUpgrade: false,
      },
      { status: 500 }
    );
  }
}

