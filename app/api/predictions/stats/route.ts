import { NextResponse } from 'next/server';
import { getPredictionStats } from '@/lib/prediction-tracking-enhanced';

export async function GET() {
  try {
    const stats = await getPredictionStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('[API] Error fetching prediction stats:', error);
    return NextResponse.json({
      totalPredictions: 0,
      verifiedPredictions: 0,
      averageAccuracy: 0,
      accuracyByMethod: {},
    });
  }
}

