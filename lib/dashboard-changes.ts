/**
 * Dashboard Changes
 * Functions to get changed comparisons for dashboard widget
 */

import { prisma } from './db';
import { getCurrentUser } from './user-auth-helpers';
import { getSnapshotHistory } from './comparison-snapshots';

export interface DashboardChange {
  slug: string;
  termA: string;
  termB: string;
  marginChange: number;
  confidenceChange: number;
  alertTriggered: boolean;
  lastChecked: Date;
}

/**
 * Get top changed comparisons since last check
 */
export async function getTopChangedComparisons(
  limit: number = 5,
  filter: 'tracked' | 'saved' | 'all' = 'all'
): Promise<DashboardChange[]> {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const userId = (user as any).id;
    if (!userId) return [];

    // Get user's saved comparisons or tracked items
    let slugs: string[] = [];
    
    if (filter === 'saved' || filter === 'all') {
      const saved = await prisma.savedComparison.findMany({
        where: { userId },
        select: { slug: true },
      });
      slugs.push(...saved.map(s => s.slug));
    }

    if (filter === 'tracked' || filter === 'all') {
      // Get unique slugs from comparison history (tracked items)
      const history = await prisma.comparisonHistory.findMany({
        where: { userId },
        select: { slug: true },
        distinct: ['slug'],
      });
      slugs.push(...history.map(h => h.slug));
    }

    // Remove duplicates
    slugs = [...new Set(slugs)];

    if (slugs.length === 0) return [];

    // Get latest and previous snapshots for each slug
    const changes: DashboardChange[] = [];

    for (const slug of slugs) {
      // Get latest snapshot
      const latestSnapshot = await prisma.comparisonSnapshot.findFirst({
        where: {
          userId,
          slug,
        },
        orderBy: { computedAt: 'desc' },
      });

      if (!latestSnapshot) continue;

      // Get previous snapshot
      const previousSnapshot = await prisma.comparisonSnapshot.findFirst({
        where: {
          userId,
          slug,
          computedAt: {
            lt: latestSnapshot.computedAt,
          },
        },
        orderBy: { computedAt: 'desc' },
      });

      if (!previousSnapshot) {
        // Only one snapshot, no change to compare
        continue;
      }

      const marginChange = latestSnapshot.marginPoints - previousSnapshot.marginPoints;
      const confidenceChange = latestSnapshot.confidence - previousSnapshot.confidence;

      // Only include if there's a significant change
      if (Math.abs(marginChange) > 0.1 || Math.abs(confidenceChange) > 0.1) {
        // Check if alert was triggered (simplified - check if change exceeds threshold)
        const alertTriggered = Math.abs(marginChange) > 5 || Math.abs(confidenceChange) > 10;

        changes.push({
          slug,
          termA: latestSnapshot.termA,
          termB: latestSnapshot.termB,
          marginChange,
          confidenceChange,
          alertTriggered,
          lastChecked: latestSnapshot.computedAt,
        });
      }
    }

    // Sort by absolute change magnitude and return top N
    return changes
      .sort((a, b) => {
        const aMagnitude = Math.abs(a.marginChange) + Math.abs(a.confidenceChange);
        const bMagnitude = Math.abs(b.marginChange) + Math.abs(b.confidenceChange);
        return bMagnitude - aMagnitude;
      })
      .slice(0, limit);
  } catch (error) {
    console.error('[DashboardChanges] Error getting changes:', error);
    return [];
  }
}

/**
 * Get insight evolution for a single comparison
 */
export async function getInsightEvolution(
  slug: string,
  timeframe: string,
  geo: string
): Promise<Array<{
  date: Date;
  winner: string;
  margin: number;
  confidence: number;
  agreementIndex: number;
}>> {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const userId = (user as any).id;
    if (!userId) return [];

    const snapshots = await getSnapshotHistory(slug, timeframe, geo, 20);

    return snapshots.map(s => ({
      date: s.computedAt,
      winner: s.winner,
      margin: s.marginPoints,
      confidence: s.confidence,
      agreementIndex: s.agreementIndex,
    }));
  } catch (error) {
    console.error('[DashboardChanges] Error getting evolution:', error);
    return [];
  }
}

