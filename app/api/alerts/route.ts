/**
 * API Route: Trend Alerts
 * GET: Get user's alerts
 * POST: Create a new alert
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/user-auth-helpers';
import { createTrendAlert, getUserAlerts } from '@/lib/trend-alerts';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in' },
        { status: 401 }
      );
    }

    const userId = (user as any).id;
    const alerts = await getUserAlerts(userId);

    return NextResponse.json({ alerts });
  } catch (error: any) {
    console.error('[API Alerts] Error fetching alerts:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { slug, termA, termB, alertType, threshold, changePercent, frequency } = body;

    if (!slug || !termA || !termB || !alertType) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, termA, termB, alertType' },
        { status: 400 }
      );
    }

    const userId = (user as any).id;
    const alert = await createTrendAlert({
      userId,
      slug,
      termA,
      termB,
      alertType,
      threshold,
      changePercent,
      frequency,
    });

    return NextResponse.json({ alert }, { status: 201 });
  } catch (error: any) {
    console.error('[API Alerts] Error creating alert:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create alert' },
      { status: 500 }
    );
  }
}

