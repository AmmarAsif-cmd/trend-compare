/**
 * Data Source Service Layer
 * Centralized service for all external API calls with caching, concurrency control, and timeouts
 */

import { getOrSet, createCacheKey } from '@/lib/cache';
import { metricsCollector } from '@/lib/performance/metrics';
import { logger } from '@/lib/performance/logger';

// Dynamic import p-limit to avoid build issues
let pLimit: any;
try {
  pLimit = require('p-limit');
} catch {
  // Fallback if p-limit not available - no concurrency limit
  pLimit = (limit: number) => (fn: any) => fn();
}

// Concurrency limit for external API calls
const API_CONCURRENCY_LIMIT = 3;
const apiLimiter = pLimit(API_CONCURRENCY_LIMIT);

// TTL rules by source type
const CACHE_TTL = {
  googleTrends: {
    '7d': 6 * 60 * 60,      // 6 hours
    '30d': 12 * 60 * 60,    // 12 hours
    '12m': 24 * 60 * 60,    // 24 hours
    '5y': 7 * 24 * 60 * 60, // 7 days
  },
  youtube: 1 * 60 * 60,     // 1 hour (fast-changing)
  spotify: 2 * 60 * 60,     // 2 hours
  tmdb: 6 * 60 * 60,        // 6 hours
  bestbuy: 6 * 60 * 60,     // 6 hours
  steam: 6 * 60 * 60,       // 6 hours
  wikipedia: 7 * 24 * 60 * 60, // 7 days (stable)
} as const;

// Stale TTL (serve stale while revalidating)
const STALE_TTL = {
  googleTrends: 48 * 60 * 60,  // 48 hours
  youtube: 6 * 60 * 60,        // 6 hours
  spotify: 12 * 60 * 60,       // 12 hours
  tmdb: 24 * 60 * 60,          // 24 hours
  bestbuy: 24 * 60 * 60,       // 24 hours
  steam: 24 * 60 * 60,         // 24 hours
  wikipedia: 14 * 24 * 60 * 60, // 14 days
} as const;

export interface SourceCallOptions {
  requestId?: string;
  timeout?: number;
  retries?: number;
}

/**
 * Call external API with caching, concurrency control, and timeout
 */
export async function callDataSource<T>(
  source: keyof typeof CACHE_TTL,
  cacheKey: string,
  fetchFn: () => Promise<T>,
  options: SourceCallOptions = {}
): Promise<T | null> {
  const { requestId, timeout = 8000, retries = 2 } = options;

  // Get TTL for this source
  const ttl = typeof CACHE_TTL[source] === 'object' 
    ? CACHE_TTL[source]['12m'] // Default to 12m for Google Trends
    : CACHE_TTL[source];
  const staleTtl = STALE_TTL[source];

  try {
    // Use cache with stale-while-revalidate
    const result = await getOrSet(
      cacheKey,
      ttl,
      async () => {
        // Track API call
        if (requestId) {
          metricsCollector.recordApiCall(requestId);
        }

        // Apply concurrency limit
        return apiLimiter(async () => {
          const startTime = Date.now();
          
          try {
            // Apply timeout
            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error(`${source} timeout`)), timeout);
            });

            const result = await Promise.race([
              fetchFn(),
              timeoutPromise,
            ]);

            const duration = Date.now() - startTime;
            logger.debug(`${source} call completed`, { requestId, duration });

            return result;
          } catch (error: any) {
            const duration = Date.now() - startTime;
            logger.warn(`${source} call failed`, { requestId, duration, error: error.message });
            
            // Retry logic
            if (retries > 0 && (error.name === 'TimeoutError' || error.code === 'ETIMEDOUT')) {
              logger.debug(`Retrying ${source} call`, { requestId, retries });
              return callDataSource(source, cacheKey, fetchFn, { ...options, retries: retries - 1 });
            }
            
            throw error;
          }
        });
      },
      {
        staleTtlSeconds: staleTtl,
        tags: [`source:${source}`],
      }
    );

    // Track cache hit
    if (requestId) {
      metricsCollector.recordCacheHit(requestId);
    }

    return result;
  } catch (error: any) {
    // Track cache miss on error
    if (requestId) {
      metricsCollector.recordCacheMiss(requestId);
      metricsCollector.recordError(requestId, `${source}: ${error.message}`);
    }

    logger.error(`${source} call failed after retries`, { requestId, error: error.message });
    
    // Graceful degradation - return null instead of throwing
    return null;
  }
}

/**
 * Create cache key for data source
 */
export function createSourceCacheKey(
  source: string,
  term: string,
  timeframe?: string,
  geo?: string,
  version?: string
): string {
  return createCacheKey('source', source, term, timeframe || '12m', geo || '', version || 'v1');
}

