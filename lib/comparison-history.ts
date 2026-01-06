/**
 * Comparison History Tracking
 * Tracks comparisons that users have viewed
 */

import { prisma } from './db';
import { getCurrentUser } from './user-auth-helpers';

export type ComparisonHistoryItem = {
  id: string;
  slug: string;
  termA: string;
  termB: string;
  timeframe: string;
  geo: string;
  viewedAt: Date;
};

/**
 * Record a comparison view in user's history
 */
export async function recordComparisonView(
  slug: string,
  termA: string,
  termB: string,
  timeframe: string = '12m',
  geo: string = ''
): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user) return; // Don't track for anonymous users

    const userId = (user as any).id;
    if (!userId) {
      console.error('[ComparisonHistory] User missing id:', user);
      return;
    }

    console.log('[ComparisonHistory] Recording view:', { userId, slug, termA, termB, timeframe, geo });

    // Create history entry (allow duplicates for same user/slug - shows frequency)
    await prisma.comparisonHistory.create({
      data: {
        userId,
        slug,
        termA,
        termB,
        timeframe,
        geo: geo || '',
      },
    });

    console.log('[ComparisonHistory] ✅ View recorded successfully');

    // Optionally: Keep only last 100 entries per user to prevent database bloat
    // We'll handle this with a cleanup job or on-demand
  } catch (error: any) {
    // Don't fail the request if history tracking fails
    console.error('[ComparisonHistory] Error recording view:', {
      error: error?.message || error,
      code: error?.code,
      meta: error?.meta,
    });
  }
}

/**
 * Get user's comparison history
 */
export async function getComparisonHistory(
  limit: number = 20,
  offset: number = 0
): Promise<{ history: ComparisonHistoryItem[]; total: number }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { history: [], total: 0 };
    }

    const userId = (user as any).id;
    if (!userId) {
      console.error('[ComparisonHistory] User missing id');
      return { history: [], total: 0 };
    }

    console.log('[ComparisonHistory] Fetching history for user:', userId);

    // Get all history entries, ordered by most recent
    const allHistory = await prisma.comparisonHistory.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
    });

    console.log('[ComparisonHistory] Found', allHistory.length, 'total history entries');

    // Get unique slugs (most recent view for each slug)
    const uniqueBySlug = new Map<string, ComparisonHistoryItem>();
    for (const h of allHistory) {
      if (!uniqueBySlug.has(h.slug)) {
        uniqueBySlug.set(h.slug, {
          id: h.id,
          slug: h.slug,
          termA: h.termA,
          termB: h.termB,
          timeframe: h.timeframe,
          geo: h.geo,
          viewedAt: h.viewedAt,
        });
      }
    }

    // Convert to array and apply pagination
    const uniqueHistory = Array.from(uniqueBySlug.values());
    const total = uniqueHistory.length;
    const paginatedHistory = uniqueHistory.slice(offset, offset + limit);

    console.log('[ComparisonHistory] Returning', paginatedHistory.length, 'unique comparisons (total:', total, ')');

    return {
      history: paginatedHistory,
      total,
    };
  } catch (error) {
    console.error('[ComparisonHistory] Error fetching history:', error);
    return { history: [], total: 0 };
  }
}

/**
 * Get most viewed comparisons by user (to show favorites)
 */
export async function getMostViewedComparisons(limit: number = 10): Promise<ComparisonHistoryItem[]> {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const userId = (user as any).id;

    // Get counts grouped by slug
    const counts = await prisma.comparisonHistory.groupBy({
      by: ['slug'],
      where: { userId },
      _count: { slug: true },
      orderBy: { _count: { slug: 'desc' } },
      take: limit,
    });

    // Get most recent view for each slug
    const slugs = counts.map((c: any) => c.slug);
    const history = await prisma.comparisonHistory.findMany({
      where: {
        userId,
        slug: { in: slugs },
      },
      orderBy: { viewedAt: 'desc' },
    });

    // Map to unique entries by slug (most recent)
    const uniqueBySlug = new Map<string, ComparisonHistoryItem>();
    for (const h of history) {
      if (!uniqueBySlug.has(h.slug)) {
        uniqueBySlug.set(h.slug, {
          id: h.id,
          slug: h.slug,
          termA: h.termA,
          termB: h.termB,
          timeframe: h.timeframe,
          geo: h.geo,
          viewedAt: h.viewedAt,
        });
      }
    }

    // Sort by view count (from counts array)
    return Array.from(uniqueBySlug.values()).sort((a, b) => {
      const countA = counts.find((c: any) => c.slug === a.slug)?._count.slug || 0;
      const countB = counts.find((c: any) => c.slug === b.slug)?._count.slug || 0;
      return countB - countA;
    });
  } catch (error) {
    console.error('[ComparisonHistory] Error fetching most viewed:', error);
    return [];
  }
}

/**
 * Clear user's comparison history (privacy feature)
 */
export async function clearComparisonHistory(): Promise<{ success: boolean; message: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'You must be logged in' };
    }

    const userId = (user as any).id;

    await prisma.comparisonHistory.deleteMany({
      where: { userId },
    });

    return { success: true, message: 'History cleared' };
  } catch (error: any) {
    console.error('[ComparisonHistory] Error clearing history:', error);
    return { success: false, message: error?.message || 'Failed to clear history' };
  }
}


