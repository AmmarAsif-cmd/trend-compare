/**
 * API Route: Individual Alert Operations
 * PATCH: Update alert status
 * DELETE: Delete alert
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/user-auth-helpers';
import { updateAlertStatus, deleteAlert } from '@/lib/trend-alerts';
import { canAccessPremium } from '@/lib/user-auth-helpers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in' },
        { status: 401 }
      );
    }

    const isPremium = await canAccessPremium();
    if (!isPremium) {
      return NextResponse.json(
        { error: 'Premium subscription required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['active', 'paused', 'deleted'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: active, paused, or deleted' },
        { status: 400 }
      );
    }

    const userId = (user as any).id;
    await updateAlertStatus(id, userId, status);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API Alerts] Error updating alert:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update alert' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in' },
        { status: 401 }
      );
    }

    const isPremium = await canAccessPremium();
    if (!isPremium) {
      return NextResponse.json(
        { error: 'Premium subscription required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const userId = (user as any).id;
    await deleteAlert(id, userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API Alerts] Error deleting alert:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete alert' },
      { status: 500 }
    );
  }
}

