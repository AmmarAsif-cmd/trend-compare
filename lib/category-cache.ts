/**
 * Category Caching System
 * Implements keyword-level caching to minimize AI API calls
 *
 * Cost Optimization:
 * - First detection: ~$0.0001 (AI call)
 * - Subsequent uses: $0 (database cache)
 * - 95%+ cost reduction on category detection at scale
 */

import { prisma } from './db';
import type { ComparisonCategory } from './category-resolver';

const CACHE_TTL_DAYS = 7; // Cache categories for 7 days (reduced from 90 for faster updates)
const MIN_CONFIDENCE = 70; // Minimum confidence to trust cached result

/**
 * Get cached category for a keyword
 * Returns null if not cached or cache is stale/low confidence
 */
export async function getCachedKeywordCategory(
  keyword: string
): Promise<{ category: ComparisonCategory; confidence: number; source: string } | null> {
  const normalized = keyword.toLowerCase().trim();

  try {
    const cached = await prisma.keywordCategory.findUnique({
      where: { keyword: normalized },
    });

    if (!cached) {
      console.log(`[CategoryCache] ❌ MISS for "${keyword}" - not in database`);
      return null;
    }

    // Check cache freshness
    const ageInDays = (Date.now() - cached.updatedAt.getTime()) / (1000 * 60 * 60 * 24);

    if (ageInDays >= CACHE_TTL_DAYS) {
      console.log(`[CategoryCache] ⚠️ STALE for "${keyword}" - ${Math.round(ageInDays)} days old`);
      return null;
    }

    // Check confidence level
    if (cached.confidence < MIN_CONFIDENCE) {
      console.log(`[CategoryCache] ⚠️ LOW CONFIDENCE for "${keyword}" - ${cached.confidence}%`);
      return null;
    }

    console.log(`[CategoryCache] ✅ HIT for "${keyword}" → ${cached.category} (${cached.confidence}% confidence, ${cached.source})`);

    return {
      category: cached.category as ComparisonCategory,
      confidence: cached.confidence,
      source: cached.source,
    };
  } catch (error) {
    console.warn('[CategoryCache] Database error:', error);
    return null;
  }
}

/**
 * Save keyword category to cache
 * Uses upsert to handle concurrent requests gracefully
 */
export async function cacheKeywordCategory(
  keyword: string,
  category: ComparisonCategory,
  confidence: number,
  source: 'ai' | 'api_probing' | 'manual',
  reasoning?: string
): Promise<void> {
  const normalized = keyword.toLowerCase().trim();

  try {
    await prisma.keywordCategory.upsert({
      where: { keyword: normalized },
      create: {
        keyword: normalized,
        category,
        confidence,
        source,
        reasoning: reasoning || `Detected as ${category}`,
      },
      update: {
        category,
        confidence,
        source,
        reasoning: reasoning || `Detected as ${category}`,
        updatedAt: new Date(),
      },
    });

    console.log(`[CategoryCache] 💾 Saved "${keyword}" → ${category} (${confidence}% confidence, source: ${source})`);
  } catch (error) {
    console.warn('[CategoryCache] Failed to save:', error);
    // Non-critical error - continue without caching
  }
}

/**
 * Check if both keywords in a comparison have cached categories
 * Returns unified result only if both keywords are cached with the same category
 */
export async function getCachedComparisonCategory(
  termA: string,
  termB: string
): Promise<{ category: ComparisonCategory; confidence: number; cached: boolean } | null> {
  const [cacheA, cacheB] = await Promise.all([
    getCachedKeywordCategory(termA),
    getCachedKeywordCategory(termB),
  ]);

  // If both keywords are cached with the SAME category, use it
  if (cacheA && cacheB && cacheA.category === cacheB.category) {
    const avgConfidence = Math.round((cacheA.confidence + cacheB.confidence) / 2);
    console.log(`[CategoryCache] ✅✅ BOTH keywords cached with same category: ${cacheA.category} (avg confidence: ${avgConfidence}%)`);

    return {
      category: cacheA.category,
      confidence: avgConfidence,
      cached: true,
    };
  }

  // If one or both missing, or categories don't match, need fresh detection
  if (cacheA && cacheB && cacheA.category !== cacheB.category) {
    console.log(`[CategoryCache] ⚠️ CONFLICT - "${termA}": ${cacheA.category}, "${termB}": ${cacheB.category}`);
  } else if (cacheA && !cacheB) {
    console.log(`[CategoryCache] ⚠️ PARTIAL - "${termA}": cached, "${termB}": not cached`);
  } else if (!cacheA && cacheB) {
    console.log(`[CategoryCache] ⚠️ PARTIAL - "${termA}": not cached, "${termB}": cached`);
  }

  return null;
}

/**
 * Cache both keywords from a comparison with the same category
 * Used after successful AI detection or API probing
 */
export async function cacheComparisonKeywords(
  termA: string,
  termB: string,
  category: ComparisonCategory,
  confidence: number,
  source: 'ai' | 'api_probing',
  reasoning?: string
): Promise<void> {
  // Cache both keywords in parallel
  await Promise.all([
    cacheKeywordCategory(termA, category, confidence, source, reasoning),
    cacheKeywordCategory(termB, category, confidence, source, reasoning),
  ]);
}

/**
 * Invalidate cache for a keyword (if manual correction is needed)
 */
export async function invalidateKeywordCache(keyword: string): Promise<void> {
  const normalized = keyword.toLowerCase().trim();

  try {
    await prisma.keywordCategory.delete({
      where: { keyword: normalized },
    });
    console.log(`[CategoryCache] 🗑️ Invalidated cache for "${keyword}"`);
  } catch (error) {
    console.warn('[CategoryCache] Failed to invalidate:', error);
  }
}

/**
 * Get cache statistics for monitoring
 */
export async function getCacheStats(): Promise<{
  totalCached: number;
  byCategory: Record<string, number>;
  bySource: Record<string, number>;
  avgConfidence: number;
}> {
  try {
    const all = await prisma.keywordCategory.findMany({
      select: {
        category: true,
        confidence: true,
        source: true,
      },
    });

    const byCategory: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    let totalConfidence = 0;

    all.forEach(item => {
      byCategory[item.category] = (byCategory[item.category] || 0) + 1;
      bySource[item.source] = (bySource[item.source] || 0) + 1;
      totalConfidence += item.confidence;
    });

    return {
      totalCached: all.length,
      byCategory,
      bySource,
      avgConfidence: all.length > 0 ? Math.round(totalConfidence / all.length) : 0,
    };
  } catch (error) {
    console.warn('[CategoryCache] Failed to get stats:', error);
    return {
      totalCached: 0,
      byCategory: {},
      bySource: {},
      avgConfidence: 0,
    };
  }
}
