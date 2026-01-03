/**
 * Peak Explanation Caching Layer
 * Historical events never change, so we can cache forever!
 * This saves 95%+ of costs by never recalculating the same peak
 */

import { PrismaClient } from '@prisma/client';
import type { ImprovedPeakExplanation } from './peak-explanation-improved-v2';

const prisma = new PrismaClient();

/**
 * Generate a unique cache key for a peak
 */
export function generatePeakCacheKey(keyword: string, date: Date): string {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const normalizedKeyword = keyword.toLowerCase().trim().replace(/\s+/g, '-');
  return `${normalizedKeyword}:${dateStr}`;
}

/**
 * Check if we have a cached explanation for this peak
 */
export async function getCachedPeakExplanation(
  keyword: string,
  date: Date
): Promise<ImprovedPeakExplanation | null> {
  const cacheKey = generatePeakCacheKey(keyword, date);

  console.log(`[Cache] Looking for cached explanation: ${cacheKey}`);

  try {
    // Check if PeakExplanationCache table exists
    const cached = await prisma.peakExplanationCache.findUnique({
      where: { cacheKey },
    });

    if (!cached) {
      console.log(`[Cache] ❌ No cached explanation found`);
      return null;
    }

    console.log(`[Cache] ✅ Found cached explanation from ${cached.createdAt.toISOString()}`);

    // Parse the stored JSON back to ImprovedPeakExplanation
    const explanation: ImprovedPeakExplanation = {
      explanation: cached.explanation,
      confidence: cached.confidence,
      events: cached.events ? JSON.parse(cached.events as string) : [],
      bestEvent: cached.bestEvent ? JSON.parse(cached.bestEvent as string) : null,
      citations: cached.citations ? JSON.parse(cached.citations as string) : [],
      verified: cached.verified,
      sourceCount: cached.sourceCount,
      status: cached.status as 'verified' | 'probable' | 'possible' | 'unknown',
    };

    return explanation;

  } catch (error) {
    console.error('[Cache] Error fetching from cache:', error);
    return null;
  }
}

/**
 * Store a peak explanation in the cache
 */
export async function cachePeakExplanation(
  keyword: string,
  date: Date,
  peakValue: number,
  explanation: ImprovedPeakExplanation
): Promise<void> {
  const cacheKey = generatePeakCacheKey(keyword, date);

  console.log(`[Cache] 💾 Caching explanation: ${cacheKey}`);

  try {
    await prisma.peakExplanationCache.upsert({
      where: { cacheKey },
      update: {
        explanation: explanation.explanation,
        confidence: explanation.confidence,
        events: JSON.stringify(explanation.events),
        bestEvent: explanation.bestEvent ? JSON.stringify(explanation.bestEvent) : null,
        citations: JSON.stringify(explanation.citations),
        verified: explanation.verified,
        sourceCount: explanation.sourceCount,
        status: explanation.status,
        peakValue,
        lastAccessed: new Date(),
        accessCount: { increment: 1 },
      },
      create: {
        cacheKey,
        keyword,
        peakDate: date,
        peakValue,
        explanation: explanation.explanation,
        confidence: explanation.confidence,
        events: JSON.stringify(explanation.events),
        bestEvent: explanation.bestEvent ? JSON.stringify(explanation.bestEvent) : null,
        citations: JSON.stringify(explanation.citations),
        verified: explanation.verified,
        sourceCount: explanation.sourceCount,
        status: explanation.status,
        accessCount: 1,
      },
    });

    console.log(`[Cache] ✅ Cached successfully`);

  } catch (error) {
    console.error('[Cache] Error caching explanation:', error);
    // Don't throw - caching is optional
  }
}

/**
 * Get cached explanation or generate new one
 * This is the main function to use
 */
export async function getPeakExplanationWithCache(
  keyword: string,
  date: Date,
  peakValue: number,
  generateFn: () => Promise<ImprovedPeakExplanation>
): Promise<ImprovedPeakExplanation> {
  // Try cache first
  const cached = await getCachedPeakExplanation(keyword, date);

  if (cached) {
    console.log(`[Cache] 🎯 Using cached explanation (saved API costs!)`);
    return cached;
  }

  // Generate new explanation
  console.log(`[Cache] 🔍 Generating new explanation...`);
  const explanation = await generateFn();

  // Cache it for future use
  await cachePeakExplanation(keyword, date, peakValue, explanation);

  return explanation;
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalCached: number;
  verifiedCount: number;
  unknownCount: number;
  avgConfidence: number;
  mostAccessed: Array<{ keyword: string; accessCount: number }>;
}> {
  try {
    const all = await prisma.peakExplanationCache.findMany({
      select: {
        keyword: true,
        accessCount: true,
        confidence: true,
        status: true,
      },
      orderBy: { accessCount: 'desc' },
      take: 100,
    });

    const verifiedCount = all.filter(c => c.status === 'verified').length;
    const unknownCount = all.filter(c => c.status === 'unknown').length;
    const avgConfidence = all.reduce((sum, c) => sum + c.confidence, 0) / all.length || 0;

    const mostAccessed = all
      .slice(0, 10)
      .map(c => ({ keyword: c.keyword, accessCount: c.accessCount }));

    return {
      totalCached: all.length,
      verifiedCount,
      unknownCount,
      avgConfidence: Math.round(avgConfidence),
      mostAccessed,
    };

  } catch (error) {
    console.error('[Cache] Error getting stats:', error);
    return {
      totalCached: 0,
      verifiedCount: 0,
      unknownCount: 0,
      avgConfidence: 0,
      mostAccessed: [],
    };
  }
}

/**
 * Clear old cache entries (optional - run periodically)
 * Only clear entries that haven't been accessed in 6+ months
 */
export async function clearStaleCacheEntries(): Promise<number> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  try {
    const result = await prisma.peakExplanationCache.deleteMany({
      where: {
        lastAccessed: {
          lt: sixMonthsAgo,
        },
        accessCount: {
          lt: 2, // Only delete if accessed less than 2 times
        },
      },
    });

    console.log(`[Cache] 🗑️ Deleted ${result.count} stale entries`);
    return result.count;

  } catch (error) {
    console.error('[Cache] Error clearing stale entries:', error);
    return 0;
  }
}
