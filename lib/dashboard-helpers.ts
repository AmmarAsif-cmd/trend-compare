/**
 * Dashboard Helper Functions
 * Utilities for dashboard data enrichment
 */

import { prisma } from './db';
import { getCurrentUser } from './user-auth-helpers';
import { getUserAlerts } from './trend-alerts';

/**
 * Get active alerts count for current user
 */
export async function getActiveAlertsCount(): Promise<number> {
  try {
    const user = await getCurrentUser();
    if (!user) return 0;

    const userId = (user as any).id;
    if (!userId) return 0;

    const alerts = await getUserAlerts(userId);
    return alerts.length;
  } catch (error) {
    console.error('[DashboardHelpers] Error getting active alerts count:', error);
    return 0;
  }
}

/**
 * Get triggered alerts count (last 7 days)
 */
export async function getTriggeredAlertsCount(): Promise<number> {
  try {
    const user = await getCurrentUser();
    if (!user) return 0;

    const userId = (user as any).id;
    if (!userId) return 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const count = await prisma.trendAlert.count({
      where: {
        userId,
        status: 'active',
        lastTriggered: { gte: sevenDaysAgo },
      },
    });

    return count;
  } catch (error) {
    console.error('[DashboardHelpers] Error getting triggered alerts count:', error);
    return 0;
  }
}

/**
 * Get recently changed comparisons count (last 7 days)
 */
export async function getRecentlyChangedCount(): Promise<number> {
  try {
    const user = await getCurrentUser();
    if (!user) return 0;

    const userId = (user as any).id;
    if (!userId) return 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Count snapshots created in last 7 days that have a previous snapshot
    const recentSnapshots = await prisma.comparisonSnapshot.findMany({
      where: {
        userId,
        computedAt: { gte: sevenDaysAgo },
      },
      select: {
        slug: true,
        computedAt: true,
      },
      distinct: ['slug'],
    });

    // For each slug, check if there's a previous snapshot (indicating change)
    let changedCount = 0;
    for (const snapshot of recentSnapshots) {
      const previousSnapshot = await prisma.comparisonSnapshot.findFirst({
        where: {
          userId,
          slug: snapshot.slug,
          computedAt: { lt: snapshot.computedAt },
        },
        orderBy: { computedAt: 'desc' },
      });

      if (previousSnapshot) {
        changedCount++;
      }
    }

    return changedCount;
  } catch (error) {
    console.error('[DashboardHelpers] Error getting recently changed count:', error);
    return 0;
  }
}

/**
 * Get high volatility comparisons count
 */
export async function getHighVolatilityCount(): Promise<number> {
  try {
    const user = await getCurrentUser();
    if (!user) return 0;

    const userId = (user as any).id;
    if (!userId) return 0;

    // Get latest snapshots for all user's tracked comparisons
    const savedComparisons = await prisma.savedComparison.findMany({
      where: { userId },
      select: { slug: true },
    });

    const slugs = savedComparisons.map(c => c.slug);
    if (slugs.length === 0) return 0;

    // Get latest snapshots
    const snapshots = await Promise.all(
      slugs.map(slug =>
        prisma.comparisonSnapshot.findFirst({
          where: { userId, slug },
          orderBy: { computedAt: 'desc' },
        })
      )
    );

    // Count high volatility (volatility > 50)
    return snapshots.filter(s => s && s.volatility > 50).length;
  } catch (error) {
    console.error('[DashboardHelpers] Error getting high volatility count:', error);
    return 0;
  }
}

/**
 * Get confidence drops count (comparisons with declining confidence)
 */
export async function getConfidenceDropsCount(): Promise<number> {
  try {
    const user = await getCurrentUser();
    if (!user) return 0;

    const userId = (user as any).id;
    if (!userId) return 0;

    const savedComparisons = await prisma.savedComparison.findMany({
      where: { userId },
      select: { slug: true },
    });

    const slugs = savedComparisons.map(c => c.slug);
    if (slugs.length === 0) return 0;

    let dropsCount = 0;

    for (const slug of slugs) {
      const latest = await prisma.comparisonSnapshot.findFirst({
        where: { userId, slug },
        orderBy: { computedAt: 'desc' },
      });

      if (!latest) continue;

      const previous = await prisma.comparisonSnapshot.findFirst({
        where: {
          userId,
          slug,
          computedAt: { lt: latest.computedAt },
        },
        orderBy: { computedAt: 'desc' },
      });

      if (previous && latest.confidence < previous.confidence && (previous.confidence - latest.confidence) > 5) {
        dropsCount++;
      }
    }

    return dropsCount;
  } catch (error) {
    console.error('[DashboardHelpers] Error getting confidence drops count:', error);
    return 0;
  }
}

/**
 * Get priority feed items (comparisons needing attention)
 */
export interface PriorityFeedItem {
  slug: string;
  termA: string;
  termB: string;
  changeType: 'gap_change' | 'leader_flip' | 'volatility_increase' | 'confidence_drop';
  changeSummary: string;
  severity: 'high' | 'medium' | 'low';
  lastChecked: Date;
}

export async function getPriorityFeedItems(limit: number = 6): Promise<PriorityFeedItem[]> {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const userId = (user as any).id;
    if (!userId) return [];

    const savedComparisons = await prisma.savedComparison.findMany({
      where: { userId },
      select: { slug: true, termA: true, termB: true },
    });

    const items: PriorityFeedItem[] = [];

    for (const comp of savedComparisons) {
      const latest = await prisma.comparisonSnapshot.findFirst({
        where: { userId, slug: comp.slug },
        orderBy: { computedAt: 'desc' },
      });

      if (!latest) continue;

      const previous = await prisma.comparisonSnapshot.findFirst({
        where: {
          userId,
          slug: comp.slug,
          computedAt: { lt: latest.computedAt },
        },
        orderBy: { computedAt: 'desc' },
      });

      if (!previous) continue;

      // Check for significant changes
      const marginChange = latest.marginPoints - previous.marginPoints;
      const confidenceChange = latest.confidence - previous.confidence;
      const volatilityChange = latest.volatility - previous.volatility;
      const leaderChanged = latest.winner !== previous.winner;

      if (leaderChanged) {
        items.push({
          slug: comp.slug,
          termA: comp.termA,
          termB: comp.termB,
          changeType: 'leader_flip',
          changeSummary: `Leader changed from ${previous.winner} to ${latest.winner}`,
          severity: 'high',
          lastChecked: latest.computedAt,
        });
      } else if (Math.abs(marginChange) > 5) {
        items.push({
          slug: comp.slug,
          termA: comp.termA,
          termB: comp.termB,
          changeType: 'gap_change',
          changeSummary: `Gap ${marginChange > 0 ? 'widened' : 'narrowed'} by ${Math.abs(marginChange).toFixed(1)} points`,
          severity: Math.abs(marginChange) > 10 ? 'high' : 'medium',
          lastChecked: latest.computedAt,
        });
      } else if (volatilityChange > 20) {
        items.push({
          slug: comp.slug,
          termA: comp.termA,
          termB: comp.termB,
          changeType: 'volatility_increase',
          changeSummary: `Volatility increased by ${volatilityChange.toFixed(1)}%`,
          severity: volatilityChange > 30 ? 'high' : 'medium',
          lastChecked: latest.computedAt,
        });
      } else if (confidenceChange < -10) {
        items.push({
          slug: comp.slug,
          termA: comp.termA,
          termB: comp.termB,
          changeType: 'confidence_drop',
          changeSummary: `Confidence dropped by ${Math.abs(confidenceChange).toFixed(1)}%`,
          severity: confidenceChange < -20 ? 'high' : 'medium',
          lastChecked: latest.computedAt,
        });
      }
    }

    // Sort by severity and recency, return top N
    return items
      .sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        if (severityOrder[b.severity] !== severityOrder[a.severity]) {
          return severityOrder[b.severity] - severityOrder[a.severity];
        }
        return b.lastChecked.getTime() - a.lastChecked.getTime();
      })
      .slice(0, limit);
  } catch (error) {
    console.error('[DashboardHelpers] Error getting priority feed items:', error);
    return [];
  }
}

/**
 * Get category-level insights (rule-based)
 */
export interface CategoryInsight {
  category: string;
  summary: string;
  type: 'volatility' | 'stability' | 'trend';
}

export async function getCategoryInsights(): Promise<CategoryInsight[]> {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const userId = (user as any).id;
    if (!userId) return [];

    const savedComparisons = await prisma.savedComparison.findMany({
      where: { userId },
      select: { slug: true, category: true },
    });

    // Group by category
    const byCategory = new Map<string, string[]>();
    for (const comp of savedComparisons) {
      const category = comp.category || 'general';
      if (!byCategory.has(category)) {
        byCategory.set(category, []);
      }
      byCategory.get(category)!.push(comp.slug);
    }

    const insights: CategoryInsight[] = [];

    for (const [category, slugs] of byCategory.entries()) {
      if (slugs.length < 2) continue; // Need at least 2 for meaningful insights

      // Get latest snapshots for this category
      const snapshots = await Promise.all(
        slugs.map(slug =>
          prisma.comparisonSnapshot.findFirst({
            where: { userId, slug },
            orderBy: { computedAt: 'desc' },
          })
        )
      );

      const validSnapshots = snapshots.filter(s => s !== null);
      if (validSnapshots.length < 2) continue;

      const avgVolatility = validSnapshots.reduce((sum, s) => sum + (s?.volatility || 0), 0) / validSnapshots.length;
      const highVolatilityCount = validSnapshots.filter(s => s && s.volatility > 50).length;

      if (highVolatilityCount >= validSnapshots.length * 0.5) {
        insights.push({
          category: category.charAt(0).toUpperCase() + category.slice(1),
          summary: `${category.charAt(0).toUpperCase() + category.slice(1)} trends show higher volatility this week`,
          type: 'volatility',
        });
      } else if (avgVolatility < 30) {
        insights.push({
          category: category.charAt(0).toUpperCase() + category.slice(1),
          summary: `${category.charAt(0).toUpperCase() + category.slice(1)}-related comparisons are stabilizing`,
          type: 'stability',
        });
      }
    }

    return insights.slice(0, 3); // Max 3 insights
  } catch (error) {
    console.error('[DashboardHelpers] Error getting category insights:', error);
    return [];
  }
}

/**
 * Get recent exports (PDF/CSV)
 */
export interface ExportItem {
  id: string;
  slug: string;
  termA: string;
  termB: string;
  type: 'pdf' | 'csv' | 'json';
  timeframe: string;
  geo: string;
  createdAt: Date;
  fileUrl?: string;
  fileSize?: number;
}

export async function getRecentExports(limit: number = 5, userId?: string): Promise<ExportItem[]> {
  try {
    const user = userId ? { id: userId } : await getCurrentUser();
    if (!user) return [];

    const targetUserId = userId || (user as any).id;
    if (!targetUserId) return [];

    // Get exports from ExportHistory table (new unified tracking)
    const exports = await prisma.exportHistory.findMany({
      where: {
        userId: targetUserId,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return exports.map(exp => ({
      id: exp.id,
      slug: exp.slug,
      termA: exp.termA,
      termB: exp.termB,
      type: exp.type as 'pdf' | 'csv' | 'json',
      timeframe: exp.timeframe,
      geo: exp.geo,
      createdAt: exp.createdAt,
      fileUrl: exp.fileUrl || undefined,
      fileSize: exp.fileSize || undefined,
    }));
  } catch (error) {
    console.error('[DashboardHelpers] Error getting recent exports:', error);
    return [];
  }
}

/**
 * Record an export in the history
 */
export async function recordExport(data: {
  userId: string;
  slug: string;
  termA: string;
  termB: string;
  type: 'pdf' | 'csv' | 'json';
  timeframe?: string;
  geo?: string;
  fileUrl?: string;
  fileSize?: number;
}): Promise<void> {
  try {
    await prisma.exportHistory.create({
      data: {
        userId: data.userId,
        slug: data.slug,
        termA: data.termA,
        termB: data.termB,
        type: data.type,
        timeframe: data.timeframe || '12m',
        geo: data.geo || '',
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
      },
    });
  } catch (error) {
    console.error('[DashboardHelpers] Error recording export:', error);
    // Don't throw - export should still succeed even if history recording fails
  }
}

/**
 * Get most viewed count (last 7 days)
 */
export async function getMostViewedLast7DaysCount(): Promise<number> {
  try {
    const user = await getCurrentUser();
    if (!user) return 0;

    const userId = (user as any).id;
    if (!userId) return 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const count = await prisma.comparisonHistory.count({
      where: {
        userId,
        viewedAt: { gte: sevenDaysAgo },
      },
    });

    return count;
  } catch (error) {
    console.error('[DashboardHelpers] Error getting most viewed count:', error);
    return 0;
  }
}

/**
 * Enrich saved comparison with current snapshot data
 */
export interface EnrichedSavedComparison {
  id: string;
  slug: string;
  termA: string;
  termB: string;
  category: string | null;
  notes: string | null;
  tags: string[];
  savedAt: Date;
  // Enriched data
  currentLeader?: string;
  margin?: number;
  confidence?: number;
  changeIndicator?: 'up' | 'down' | 'stable';
  lastViewed?: Date;
  lastUpdated?: Date;
}

/**
 * Enrich saved comparisons with current snapshot data
 */
export async function enrichSavedComparisons(
  comparisons: Array<{
    id: string;
    slug: string;
    termA: string;
    termB: string;
    category: string | null;
    notes: string | null;
    tags: string[];
    savedAt: Date;
  }>,
  userId?: string
): Promise<EnrichedSavedComparison[]> {
  try {
    // Get userId from parameter or current user
    let targetUserId = userId;
    if (!targetUserId) {
      const user = await getCurrentUser();
      if (!user) return comparisons.map(c => ({ ...c }));
      targetUserId = (user as any).id;
    }
    
    if (!targetUserId) return comparisons.map(c => ({ ...c }));

    const enriched = await Promise.all(
      comparisons.map(async (comp) => {
        // Get latest snapshot (using exact slug match)
        // Wrap in try-catch in case table doesn't exist yet
        let latestSnapshot = null;
        try {
          latestSnapshot = await prisma.comparisonSnapshot.findFirst({
            where: {
              userId: targetUserId,
              slug: comp.slug, // Use exact slug from saved comparison
            },
            orderBy: { computedAt: 'desc' },
          });
        } catch (error: any) {
          // Table doesn't exist yet - this is expected before migration
          if (error?.message?.includes('does not exist') || error?.code === 'P2021') {
            console.warn('[DashboardHelpers] ComparisonSnapshot table does not exist yet. Run migration to create it.');
          } else {
            console.error('[DashboardHelpers] Error fetching snapshot:', error);
          }
        }

        // Debug logging in development
        if (process.env.NODE_ENV === 'development' && !latestSnapshot) {
          console.log('[DashboardHelpers] No snapshot found for slug:', comp.slug, 'userId:', targetUserId);
        }

        // Get previous snapshot for change indicator
        let previousSnapshot = null;
        if (latestSnapshot) {
          try {
            previousSnapshot = await prisma.comparisonSnapshot.findFirst({
              where: {
                userId: targetUserId,
                slug: comp.slug,
                computedAt: { lt: latestSnapshot.computedAt },
              },
              orderBy: { computedAt: 'desc' },
            });
          } catch (error: any) {
            // Table doesn't exist - ignore
            if (!error?.message?.includes('does not exist') && error?.code !== 'P2021') {
              console.error('[DashboardHelpers] Error fetching previous snapshot:', error);
            }
          }
        }

        // Get last viewed
        const lastViewed = await prisma.comparisonHistory.findFirst({
          where: {
            userId: targetUserId,
            slug: comp.slug,
          },
          orderBy: { viewedAt: 'desc' },
          select: { viewedAt: true },
        });

        let changeIndicator: 'up' | 'down' | 'stable' = 'stable';
        if (latestSnapshot && previousSnapshot) {
          const marginChange = latestSnapshot.marginPoints - previousSnapshot.marginPoints;
          if (Math.abs(marginChange) > 0.1) {
            changeIndicator = marginChange > 0 ? 'up' : 'down';
          }
        }

        return {
          ...comp,
          currentLeader: latestSnapshot?.winner,
          margin: latestSnapshot?.marginPoints,
          confidence: latestSnapshot?.confidence,
          changeIndicator,
          lastViewed: lastViewed?.viewedAt,
          lastUpdated: latestSnapshot?.computedAt,
        };
      })
    );

    return enriched;
  } catch (error) {
    console.error('[DashboardHelpers] Error enriching saved comparisons:', error);
    return comparisons.map(c => ({ ...c }));
  }
}
