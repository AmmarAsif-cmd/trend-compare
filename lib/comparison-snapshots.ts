/**
 * Comparison Snapshots
 * 
 * Store and retrieve comparison snapshots for "since last check" functionality
 */

import { prisma } from './db';
import { getCurrentUser } from './user-auth-helpers';
import type { ComparisonSnapshot } from './comparison-metrics';

/**
 * Save a comparison snapshot
 */
export async function saveComparisonSnapshot(
  slug: string,
  termA: string,
  termB: string,
  timeframe: string,
  geo: string,
  metrics: {
    marginPoints: number;
    confidence: number;
    volatility: number;
    agreementIndex: number;
    winner: string;
    winnerScore: number;
    loserScore: number;
    category?: string | null;
  }
): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user) return; // Only save for logged-in users
    
    const userId = (user as any).id;
    if (!userId) return;
    
    // Check if snapshot already exists for this user/slug/timeframe/geo combination
    const existing = await prisma.comparisonSnapshot.findFirst({
      where: {
        userId,
        slug,
        timeframe,
        geo: geo || '',
      },
      orderBy: { computedAt: 'desc' },
    });
    
    // Only create new snapshot if it's been more than 1 hour since last snapshot
    // or if metrics have changed significantly
    if (existing) {
      const timeDiff = Date.now() - existing.computedAt.getTime();
      const oneHour = 60 * 60 * 1000;
      
      const significantChange = 
        Math.abs(existing.marginPoints - metrics.marginPoints) > 2 ||
        Math.abs(existing.confidence - metrics.confidence) > 5 ||
        Math.abs(existing.agreementIndex - metrics.agreementIndex) > 10;
      
      if (timeDiff < oneHour && !significantChange) {
        // Update existing snapshot instead of creating duplicate
        await prisma.comparisonSnapshot.update({
          where: { id: existing.id },
          data: {
            marginPoints: metrics.marginPoints,
            confidence: metrics.confidence,
            volatility: metrics.volatility,
            agreementIndex: metrics.agreementIndex,
            winner: metrics.winner,
            winnerScore: metrics.winnerScore,
            loserScore: metrics.loserScore,
            category: metrics.category,
            computedAt: new Date(),
          },
        });
        return;
      }
    }
    
    // Create new snapshot
    await prisma.comparisonSnapshot.create({
      data: {
        userId,
        slug,
        termA,
        termB,
        timeframe,
        geo: geo || '',
        marginPoints: metrics.marginPoints,
        confidence: metrics.confidence,
        volatility: metrics.volatility,
        agreementIndex: metrics.agreementIndex,
        winner: metrics.winner,
        winnerScore: metrics.winnerScore,
        loserScore: metrics.loserScore,
        category: metrics.category,
      },
    });
  } catch (error) {
    // Don't fail the request if snapshot saving fails
    console.error('[ComparisonSnapshot] Error saving snapshot:', error);
  }
}

/**
 * Get the most recent snapshot for a comparison
 */
export async function getLatestSnapshot(
  slug: string,
  timeframe: string,
  geo: string
): Promise<ComparisonSnapshot | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;
    
    const userId = (user as any).id;
    if (!userId) return null;
    
    const snapshot = await prisma.comparisonSnapshot.findFirst({
      where: {
        userId,
        slug,
        timeframe,
        geo: geo || '',
      },
      orderBy: { computedAt: 'desc' },
    });
    
    if (!snapshot) return null;
    
    return {
      id: snapshot.id,
      userId: snapshot.userId,
      slug: snapshot.slug,
      termA: snapshot.termA,
      termB: snapshot.termB,
      timeframe: snapshot.timeframe,
      geo: snapshot.geo,
      computedAt: snapshot.computedAt,
      marginPoints: snapshot.marginPoints,
      confidence: snapshot.confidence,
      volatility: snapshot.volatility,
      agreementIndex: snapshot.agreementIndex,
      winner: snapshot.winner,
      winnerScore: snapshot.winnerScore,
      loserScore: snapshot.loserScore,
      category: snapshot.category,
    };
  } catch (error) {
    console.error('[ComparisonSnapshot] Error getting snapshot:', error);
    return null;
  }
}

/**
 * Get snapshot history for a comparison (for evolution view)
 */
export async function getSnapshotHistory(
  slug: string,
  timeframe: string,
  geo: string,
  limit: number = 20
): Promise<ComparisonSnapshot[]> {
  try {
    const user = await getCurrentUser();
    if (!user) return [];
    
    const userId = (user as any).id;
    if (!userId) return [];
    
    const snapshots = await prisma.comparisonSnapshot.findMany({
      where: {
        userId,
        slug,
        timeframe,
        geo: geo || '',
      },
      orderBy: { computedAt: 'desc' },
      take: limit,
    });
    
    return snapshots.map(s => ({
      id: s.id,
      userId: s.userId,
      slug: s.slug,
      termA: s.termA,
      termB: s.termB,
      timeframe: s.timeframe,
      geo: s.geo,
      computedAt: s.computedAt,
      marginPoints: s.marginPoints,
      confidence: s.confidence,
      volatility: s.volatility,
      agreementIndex: s.agreementIndex,
      winner: s.winner,
      winnerScore: s.winnerScore,
      loserScore: s.loserScore,
      category: s.category,
    }));
  } catch (error) {
    console.error('[ComparisonSnapshot] Error getting history:', error);
    return [];
  }
}

