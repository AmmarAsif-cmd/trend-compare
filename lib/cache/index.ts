/**
 * Unified caching layer for TrendArc
 * 
 * Features:
 * - In-memory fallback
 * - Redis/Upstash support (if configured)
 * - Stale-while-revalidate
 * - Request coalescing
 * - Distributed locking to prevent cache stampede
 */

import { loadCacheConfig, type CacheConfig } from './config';
import { MemoryStore } from './memory-store';
import { RedisStore } from './redis-store';

export interface GetOrSetOptions {
  /** TTL for stale data (defaults to config defaultStaleTtlSeconds) */
  staleTtlSeconds?: number;
  /** Lock duration in seconds (defaults to 30) */
  lockSeconds?: number;
  /** Tags for cache invalidation */
  tags?: string[];
  /** Force refresh even if cached */
  forceRefresh?: boolean;
}

interface PendingCompute<T = unknown> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

class Cache {
  private config: CacheConfig;
  private memoryStore: MemoryStore;
  private redisStore: RedisStore | null = null;
  private pendingComputes = new Map<string, PendingCompute<any>>();

  constructor() {
    this.config = loadCacheConfig();
    this.memoryStore = new MemoryStore();

    if (this.config.provider === 'upstash' && this.config.redisUrl && this.config.redisToken) {
      this.redisStore = new RedisStore(this.config.redisUrl, this.config.redisToken);
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    // Try Redis first if available
    if (this.redisStore?.isAvailable()) {
      const result = await this.redisStore.get<T>(key);
      if (result) {
        return result.value;
      }
    }

    // Fallback to memory
    const result = this.memoryStore.get<T>(key);
    return result ? result.value : null;
  }

  /**
   * Set value in cache
   */
  async set<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
    staleTtlSeconds?: number,
    tags?: string[]
  ): Promise<void> {
    const ttl = ttlSeconds ?? this.config.defaultTtlSeconds;
    const staleTtl = staleTtlSeconds ?? this.config.defaultStaleTtlSeconds;

    // Set in Redis if available
    if (this.redisStore?.isAvailable()) {
      await this.redisStore.set(key, value, ttl, staleTtl, tags);
    }

    // Always set in memory as fallback
    this.memoryStore.set(key, value, ttl, staleTtl, tags);
  }

  /**
   * Get or set value with compute function
   * Implements request coalescing, stale-while-revalidate, and distributed locking
   */
  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    computeFn: () => Promise<T>,
    options: GetOrSetOptions = {}
  ): Promise<T> {
    const {
      staleTtlSeconds = this.config.defaultStaleTtlSeconds,
      lockSeconds = 30,
      tags,
      forceRefresh = false,
    } = options;

    // Check for pending compute (request coalescing)
    const pending = this.pendingComputes.get(key);
    if (pending) {
      return pending.promise as Promise<T>;
    }

    // Check cache if not forcing refresh
    if (!forceRefresh) {
      // Try Redis first
      if (this.redisStore?.isAvailable()) {
        const redisResult = await this.redisStore.get<T>(key);
        if (redisResult) {
          const { value, isStale } = redisResult;

          // If stale but within stale TTL, return stale and trigger background refresh
          if (isStale) {
            this.refreshInBackground(key, ttlSeconds, computeFn, {
              staleTtlSeconds,
              lockSeconds,
              tags,
            });
            return value;
          }

          // Fresh value, return it
          return value;
        }
      }

      // Fallback to memory
      const memoryResult = this.memoryStore.get<T>(key);
      if (memoryResult) {
        const { value, isStale } = memoryResult;

        // If stale but within stale TTL, return stale and trigger background refresh
        if (isStale) {
          this.refreshInBackground(key, ttlSeconds, computeFn, {
            staleTtlSeconds,
            lockSeconds,
            tags,
          });
          return value;
        }

        // Fresh value, return it
        return value;
      }
    }

    // Cache miss or force refresh - compute new value
    return this.computeAndSet(key, ttlSeconds, computeFn, {
      staleTtlSeconds,
      lockSeconds,
      tags,
    });
  }

  /**
   * Compute value and set in cache with locking
   */
  private async computeAndSet<T>(
    key: string,
    ttlSeconds: number,
    computeFn: () => Promise<T>,
    options: GetOrSetOptions
  ): Promise<T> {
    const { lockSeconds = 30, tags } = options;
    const lockKey = `lock:${key}`;

    // Create pending compute for request coalescing
    let resolvePending: (value: T) => void;
    let rejectPending: (error: Error) => void;
    const pendingPromise = new Promise<T>((resolve, reject) => {
      resolvePending = resolve;
      rejectPending = reject;
    });

    this.pendingComputes.set(key, {
      promise: pendingPromise,
      resolve: resolvePending! as (value: unknown) => void,
      reject: rejectPending!,
    });

    try {
      // Try to acquire distributed lock (if Redis available)
      const hasLock = this.redisStore?.isAvailable()
        ? await this.redisStore.acquireLock(lockKey, lockSeconds)
        : true; // In-memory mode, no distributed lock needed

      if (!hasLock) {
        // Another process is computing, wait a bit and check cache
        await new Promise(resolve => setTimeout(resolve, 100));
        const cached = await this.get<T>(key);
        if (cached !== null) {
          this.pendingComputes.delete(key);
          resolvePending!(cached);
          return cached;
        }
        // Still not cached, proceed without lock (risk of stampede, but better than blocking)
      }

      // Compute new value
      const value = await computeFn();

      // Set in cache
      await this.set(key, value, ttlSeconds, options.staleTtlSeconds, tags);

      // Release lock
      if (this.redisStore?.isAvailable() && hasLock) {
        await this.redisStore.releaseLock(lockKey);
      }

      // Resolve all pending requests
      this.pendingComputes.delete(key);
      resolvePending!(value);

      return value;
    } catch (error) {
      // Release lock on error
      if (this.redisStore?.isAvailable()) {
        await this.redisStore.releaseLock(lockKey);
      }

      // Reject all pending requests
      this.pendingComputes.delete(key);
      rejectPending!(error as Error);
      throw error;
    }
  }

  /**
   * Refresh cache in background (stale-while-revalidate)
   */
  private async refreshInBackground<T>(
    key: string,
    ttlSeconds: number,
    computeFn: () => Promise<T>,
    options: GetOrSetOptions
  ): Promise<void> {
    // Don't await - fire and forget
    this.computeAndSet(key, ttlSeconds, computeFn, options).catch(error => {
      console.error(`[Cache] Background refresh failed for key "${key}":`, error);
    });
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    if (this.redisStore?.isAvailable()) {
      await this.redisStore.delete(key);
    }
    this.memoryStore.delete(key);
  }

  /**
   * Delete all entries with matching tag
   */
  async deleteByTag(tag: string): Promise<void> {
    if (this.redisStore?.isAvailable()) {
      await this.redisStore.deleteByTag(tag);
    }
    this.memoryStore.deleteByTag(tag);
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memoryStore.clear();
    // Note: Redis clear would require FLUSHDB, which we don't expose for safety
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    provider: string;
    memorySize: number;
    redisAvailable: boolean;
  } {
    return {
      provider: this.config.provider,
      memorySize: this.memoryStore.size(),
      redisAvailable: this.redisStore?.isAvailable() ?? false,
    };
  }
}

// Singleton instance
let cacheInstance: Cache | null = null;

/**
 * Get cache instance (singleton)
 */
export function getCache(): Cache {
  if (!cacheInstance) {
    cacheInstance = new Cache();
  }
  return cacheInstance;
}

// Export convenience functions
export async function get<T>(key: string): Promise<T | null> {
  return getCache().get<T>(key);
}

export async function set<T>(
  key: string,
  value: T,
  ttlSeconds?: number,
  staleTtlSeconds?: number,
  tags?: string[]
): Promise<void> {
  return getCache().set(key, value, ttlSeconds, staleTtlSeconds, tags);
}

export async function getOrSet<T>(
  key: string,
  ttlSeconds: number,
  computeFn: () => Promise<T>,
  options?: GetOrSetOptions
): Promise<T> {
  return getCache().getOrSet(key, ttlSeconds, computeFn, options);
}

export async function deleteKey(key: string): Promise<void> {
  return getCache().delete(key);
}

export async function deleteByTag(tag: string): Promise<void> {
  return getCache().deleteByTag(tag);
}

export async function clear(): Promise<void> {
  return getCache().clear();
}

export function getStats() {
  return getCache().getStats();
}

// Export hash utilities
export { stableHash, createCacheKey } from './hash';

// Export types
export type { CacheConfig } from './config';

