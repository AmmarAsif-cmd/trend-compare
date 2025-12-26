import { NextRequest, NextResponse } from 'next/server';
import { checkAnonymousLimit, getClientIP } from '@/lib/anonymous-limits';

export async function GET(request: NextRequest) {
  try {
    const ipAddress = getClientIP(request);
    const limitStatus = await checkAnonymousLimit(ipAddress);

    return NextResponse.json(limitStatus);
  } catch (error: any) {
    console.error('[Anonymous Status] Error:', error);
    return NextResponse.json(
      {
        allowed: true,
        remaining: 5,
        total: 0,
        limit: 5,
      },
      { status: 200 } // Return success even on error
    );
  }
}

export const dynamic = 'force-dynamic';
