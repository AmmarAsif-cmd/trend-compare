import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/user-auth-helpers';
import { getTrialStatus } from '@/lib/trial-system';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const trialStatus = await getTrialStatus(user.id);

    return NextResponse.json(trialStatus);
  } catch (error: any) {
    console.error('[Trial Status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get trial status' },
      { status: 500 }
    );
  }
}
