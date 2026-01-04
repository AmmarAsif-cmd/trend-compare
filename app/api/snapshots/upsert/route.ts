/**
 * API Route: Upsert Comparison Snapshot
 * POST /api/snapshots/upsert
 * 
 * Creates or updates a comparison snapshot for the logged-in user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/user-auth-helpers';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Authentication check
    const user = await getCurrentUser();
    if (!user) {
      console.log('[SnapshotUpsert] ❌ No user session found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = (user as any).id;
    if (!userId) {
      console.error('[SnapshotUpsert] ❌ User session missing id:', user);
      return NextResponse.json(
        { error: 'Invalid user session' },
        { status: 401 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (jsonError: any) {
      console.error('[SnapshotUpsert] ❌ Failed to parse request body:', jsonError);
      return NextResponse.json(
        { error: 'Invalid request body. Expected JSON.' },
        { status: 400 }
      );
    }

    const {
      comparisonSlug,
      termA,
      termB,
      timeframe = '12m',
      region = '',
      computedAt,
      winner,
      marginPoints,
      confidence,
      trendDirection,
      agreementIndex,
      volatility,
      winnerScore,
      loserScore,
      category,
    } = body;

    // Validate required fields
    if (!comparisonSlug || !termA || !termB || winner === undefined || marginPoints === undefined || confidence === undefined) {
      console.warn('[SnapshotUpsert] ❌ Missing required fields:', {
        hasSlug: !!comparisonSlug,
        hasTermA: !!termA,
        hasTermB: !!termB,
        hasWinner: winner !== undefined,
        hasMarginPoints: marginPoints !== undefined,
        hasConfidence: confidence !== undefined,
      });
      return NextResponse.json(
        { error: 'Missing required fields: comparisonSlug, termA, termB, winner, marginPoints, confidence' },
        { status: 400 }
      );
    }

    // Validate numeric values
    if (typeof marginPoints !== 'number' || isNaN(marginPoints)) {
      return NextResponse.json(
        { error: 'marginPoints must be a number' },
        { status: 400 }
      );
    }
    if (typeof confidence !== 'number' || isNaN(confidence) || confidence < 0 || confidence > 100) {
      return NextResponse.json(
        { error: 'confidence must be a number between 0 and 100' },
        { status: 400 }
      );
    }

    console.log('[SnapshotUpsert] 📸 Upserting snapshot:', {
      userId,
      comparisonSlug,
      termA,
      termB,
      timeframe,
      region,
      winner,
      marginPoints,
      confidence,
    });

    // Prepare snapshot data
    const snapshotData = {
      userId,
      slug: comparisonSlug,
      termA,
      termB,
      timeframe,
      geo: region || '',
      winner,
      marginPoints,
      confidence,
      volatility: typeof volatility === 'number' ? volatility : 0,
      agreementIndex: typeof agreementIndex === 'number' ? agreementIndex : 0,
      winnerScore: typeof winnerScore === 'number' ? winnerScore : 50,
      loserScore: typeof loserScore === 'number' ? loserScore : 50,
      category: category || null,
      computedAt: computedAt ? new Date(computedAt) : new Date(),
    };

    // Upsert snapshot (find existing by userId + slug + timeframe + geo, or create new)
    // Note: The schema has a composite index on userId, slug, timeframe, geo but no unique constraint
    // So we use findFirst + upsert pattern
    
    const existing = await prisma.comparisonSnapshot.findFirst({
      where: {
        userId,
        slug: comparisonSlug,
        timeframe,
        geo: region || '',
      },
      orderBy: { computedAt: 'desc' },
    });

    let snapshot;
    if (existing) {
      // Update existing snapshot
      snapshot = await prisma.comparisonSnapshot.update({
        where: { id: existing.id },
        data: snapshotData,
      });
      console.log('[SnapshotUpsert] ✅ Updated existing snapshot:', snapshot.id);
    } else {
      // Create new snapshot
      snapshot = await prisma.comparisonSnapshot.create({
        data: snapshotData,
      });
      console.log('[SnapshotUpsert] ✅ Created new snapshot:', snapshot.id);
    }

    const duration = Date.now() - startTime;
    console.log('[SnapshotUpsert] ✅ Success in', duration, 'ms');

    return NextResponse.json({
      success: true,
      snapshot: {
        id: snapshot.id,
        slug: snapshot.slug,
        termA: snapshot.termA,
        termB: snapshot.termB,
        winner: snapshot.winner,
        marginPoints: snapshot.marginPoints,
        confidence: snapshot.confidence,
        computedAt: snapshot.computedAt,
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[SnapshotUpsert] ❌ Error in', duration, 'ms:', {
      error: error?.message || error,
      stack: error?.stack,
      code: error?.code,
      meta: error?.meta,
    });
    
    return NextResponse.json(
      { error: 'Failed to upsert snapshot', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

