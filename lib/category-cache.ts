/**
 * Category Caching Service
 * Stores and retrieves keyword categories from database
 * Eliminates duplicate AI calls for the same keywords
 */

import { PrismaClient } from '@prisma/client';
import type { ComparisonCategory } from './category-resolver';

const prisma = new PrismaClient();

export type CachedCategory = {
  category: ComparisonCategory;
  confidence: number;
  source: 'ai' | 'api_probing' | 'manual';
  reasoning?: string;
};

/**
 * Get category from cache for a keyword
 * Returns null if not cached
 */
export async function getCachedCategory(keyword: string): Promise<CachedCategory | null> {
  try {
    const normalized = keyword.toLowerCase().trim();

    const cached = await prisma.keywordCategory.findUnique({
      where: { keyword: normalized },
    });

    if (!cached) {
      return null;
    }

    console.log('[CategoryCache] ✅ Cache HIT for:', keyword, '→', cached.category);

    return {
      category: cached.category as ComparisonCategory,
      confidence: cached.confidence,
      source: cached.source as 'ai' | 'api_probing' | 'manual',
      reasoning: cached.reasoning || undefined,
    };
  } catch (error) {
    console.warn('[CategoryCache] Failed to get cached category:', error);
    return null;
  }
}

/**
 * Save category to cache
 */
export async function saveCategoryToCache(
  keyword: string,
  category: ComparisonCategory,
  confidence: number,
  source: 'ai' | 'api_probing' | 'manual',
  reasoning?: string
): Promise<void> {
  try {
    const normalized = keyword.toLowerCase().trim();

    await prisma.keywordCategory.upsert({
      where: { keyword: normalized },
      create: {
        keyword: normalized,
        category,
        confidence,
        source,
        reasoning,
      },
      update: {
        category,
        confidence,
        source,
        reasoning,
        updatedAt: new Date(),
      },
    });

    console.log('[CategoryCache] 💾 Saved category for:', keyword, '→', category, `(${source})`);
  } catch (error) {
    console.warn('[CategoryCache] Failed to save category:', error);
  }
}

/**
 * Get categories for multiple keywords at once
 * Returns a map of keyword → category
 */
export async function getCachedCategories(keywords: string[]): Promise<Map<string, CachedCategory>> {
  const result = new Map<string, CachedCategory>();

  try {
    const normalized = keywords.map(k => k.toLowerCase().trim());

    const cached = await prisma.keywordCategory.findMany({
      where: {
        keyword: {
          in: normalized,
        },
      },
    });

    for (const item of cached) {
      result.set(item.keyword, {
        category: item.category as ComparisonCategory,
        confidence: item.confidence,
        source: item.source as 'ai' | 'api_probing' | 'manual',
        reasoning: item.reasoning || undefined,
      });
    }

    console.log('[CategoryCache] Retrieved', result.size, '/', keywords.length, 'cached categories');
  } catch (error) {
    console.warn('[CategoryCache] Failed to get cached categories:', error);
  }

  return result;
}

/**
 * Detect unified category from two keywords
 * If both keywords have same cached category → use it
 * If different or one missing → return null (need fresh detection)
 */
export async function getUnifiedCachedCategory(
  termA: string,
  termB: string
): Promise<CachedCategory | null> {
  const categories = await getCachedCategories([termA, termB]);

  const catA = categories.get(termA.toLowerCase().trim());
  const catB = categories.get(termB.toLowerCase().trim());

  // Both cached and same category → use it!
  if (catA && catB && catA.category === catB.category) {
    console.log('[CategoryCache] 🎯 Unified category from cache:', catA.category);
    return catA;
  }

  // Different categories or one missing → need fresh detection
  if (catA && catB && catA.category !== catB.category) {
    console.log('[CategoryCache] ⚠️ Keywords have different cached categories:', {
      [termA]: catA.category,
      [termB]: catB.category,
    });
  }

  return null;
}
