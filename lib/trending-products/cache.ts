// Trending Products Cache Layer
// Caches analyzed trending products to reduce API calls

import { RedisStore } from '@/lib/cache/redis-store';
import type { TrendingProduct } from './types';

const CACHE_TTL = 60 * 60 * 24; // 24 hours
const CACHE_KEY_PREFIX = 'trending-products';

// Initialize Redis if available
let redisStore: RedisStore | null = null;
if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
  redisStore = new RedisStore(
    process.env.UPSTASH_REDIS_URL,
    process.env.UPSTASH_REDIS_TOKEN
  );
}

// In-memory fallback cache
const memoryCache = new Map<string, { data: TrendingProduct[]; timestamp: number }>();

/**
 * Get cached trending products for a category
 */
export async function getCachedTrendingProducts(
  category: string
): Promise<TrendingProduct[] | null> {
  const cacheKey = `${CACHE_KEY_PREFIX}:${category}`;

  // Try Redis first
  if (redisStore) {
    try {
      const cached = await redisStore.get<TrendingProduct[]>(cacheKey);
      if (cached) {
        console.log(`[TrendingCache] Redis cache hit for ${category}`);
        return cached;
      }
    } catch (error) {
      console.error('[TrendingCache] Redis error:', error);
    }
  }

  // Fallback to memory cache
  const memCached = memoryCache.get(cacheKey);
  if (memCached) {
    const age = Date.now() - memCached.timestamp;
    if (age < CACHE_TTL * 1000) {
      console.log(`[TrendingCache] Memory cache hit for ${category}`);
      return memCached.data;
    } else {
      memoryCache.delete(cacheKey);
    }
  }

  return null;
}

/**
 * Cache trending products for a category
 */
export async function setCachedTrendingProducts(
  category: string,
  products: TrendingProduct[]
): Promise<void> {
  const cacheKey = `${CACHE_KEY_PREFIX}:${category}`;

  // Store in Redis if available
  if (redisStore) {
    try {
      await redisStore.set(cacheKey, products, CACHE_TTL);
      console.log(`[TrendingCache] Cached ${products.length} products to Redis for ${category}`);
    } catch (error) {
      console.error('[TrendingCache] Redis cache error:', error);
    }
  }

  // Always store in memory as backup
  memoryCache.set(cacheKey, {
    data: products,
    timestamp: Date.now(),
  });
  console.log(`[TrendingCache] Cached ${products.length} products to memory for ${category}`);
}

/**
 * Clear cache for a category
 */
export async function clearTrendingCache(category?: string): Promise<void> {
  if (category) {
    const cacheKey = `${CACHE_KEY_PREFIX}:${category}`;
    if (redisStore) {
      try {
        await redisStore.delete(cacheKey);
      } catch (error) {
        console.error('[TrendingCache] Redis delete error:', error);
      }
    }
    memoryCache.delete(cacheKey);
  } else {
    // Clear all
    if (redisStore) {
      // Redis: would need to scan for keys, skip for now
    }
    memoryCache.clear();
  }
}
