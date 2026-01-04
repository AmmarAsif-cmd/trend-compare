/**
 * Redis/Upstash cache store implementation
 */

let Redis: any = null;
let redisLoadAttempted = false;

// Lazy load @upstash/redis at runtime to avoid build-time resolution
async function loadRedis() {
  if (redisLoadAttempted) {
    return Redis;
  }
  redisLoadAttempted = true;
  
  try {
    // Use dynamic import to avoid build-time resolution
    const upstashRedis = await import('@upstash/redis');
    Redis = upstashRedis.Redis;
  } catch (error) {
    // @upstash/redis not installed, Redis will be unavailable
    console.warn('[Cache] @upstash/redis not installed. Redis caching will be unavailable.');
    Redis = null;
  }
  
  return Redis;
}

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  staleAt: number;
  tags?: string[];
}

export class RedisStore {
  private redis: any = null;
  private initialized = false;
  private redisUrl?: string;
  private redisToken?: string;
  private initPromise: Promise<void> | null = null;

  constructor(redisUrl?: string, redisToken?: string) {
    this.redisUrl = redisUrl;
    this.redisToken = redisToken;
  }

  /**
   * Initialize Redis connection (lazy loading)
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized || this.initPromise) {
      if (this.initPromise) {
        await this.initPromise;
      }
      return;
    }

    this.initPromise = (async () => {
      try {
        const RedisClass = await loadRedis();
        if (!RedisClass) {
          this.initialized = false;
          return;
        }

        if (this.redisUrl && this.redisToken) {
          this.redis = new RedisClass({
            url: this.redisUrl,
            token: this.redisToken,
          });
          this.initialized = true;
        } else {
          this.initialized = false;
        }
      } catch (error) {
        console.error('[Cache] Failed to initialize Redis:', error);
        this.initialized = false;
      }
    })();

    await this.initPromise;
  }

  /**
   * Check if Redis is available
   */
  isAvailable(): boolean {
    return this.initialized && this.redis !== null;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<{ value: T; isStale: boolean } | null> {
    await this.ensureInitialized();
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const data = await this.redis!.get(key) as string | null;
      if (!data) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(data);
      const now = Date.now();
      const isExpired = now > entry.expiresAt;
      const isStale = now > entry.staleAt;

      if (isExpired) {
        await this.delete(key);
        return null;
      }

      return {
        value: entry.value,
        isStale,
      };
    } catch (error) {
      console.error(`[Cache] Redis get error for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(
    key: string,
    value: T,
    ttlSeconds: number,
    staleTtlSeconds?: number,
    tags?: string[]
  ): Promise<void> {
    await this.ensureInitialized();
    if (!this.isAvailable()) {
      return;
    }

    try {
      const now = Date.now();
      const expiresAt = now + ttlSeconds * 1000;
      const staleAt = staleTtlSeconds
        ? now + staleTtlSeconds * 1000
        : expiresAt;

      const entry: CacheEntry<T> = {
        value,
        expiresAt,
        staleAt,
        tags,
      };

      // Store with TTL (use expiresAt for Redis TTL)
      await this.redis!.setex(key, ttlSeconds, JSON.stringify(entry));

      // Store tag index for tag-based invalidation
      if (tags && tags.length > 0) {
        for (const tag of tags) {
          const tagKey = `tag:${tag}`;
          await this.redis!.sadd(tagKey, key);
          // Set tag index TTL to match entry TTL
          await this.redis!.expire(tagKey, ttlSeconds);
        }
      }
    } catch (error) {
      console.error(`[Cache] Redis set error for key "${key}":`, error);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    await this.ensureInitialized();
    if (!this.isAvailable()) {
      return;
    }

    try {
      await this.redis!.del(key);
    } catch (error) {
      console.error(`[Cache] Redis delete error for key "${key}":`, error);
    }
  }

  /**
   * Delete all entries with matching tag
   */
  async deleteByTag(tag: string): Promise<void> {
    await this.ensureInitialized();
    if (!this.isAvailable()) {
      return;
    }

    try {
      const tagKey = `tag:${tag}`;
      const keys = await this.redis!.smembers(tagKey) as string[] | null;
      
      if (keys && keys.length > 0) {
        await this.redis!.del(...keys);
        await this.redis!.del(tagKey);
      }
    } catch (error) {
      console.error(`[Cache] Redis deleteByTag error for tag "${tag}":`, error);
    }
  }

  /**
   * Acquire distributed lock
   */
  async acquireLock(lockKey: string, lockSeconds: number): Promise<boolean> {
    await this.ensureInitialized();
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const result = await this.redis!.set(
        lockKey,
        '1',
        {
          ex: lockSeconds,
          nx: true, // Only set if not exists
        }
      );
      return result === 'OK';
    } catch (error) {
      console.error(`[Cache] Redis acquireLock error for key "${lockKey}":`, error);
      return false;
    }
  }

  /**
   * Release distributed lock
   */
  async releaseLock(lockKey: string): Promise<void> {
    await this.ensureInitialized();
    if (!this.isAvailable()) {
      return;
    }

    try {
      await this.redis!.del(lockKey);
    } catch (error) {
      console.error(`[Cache] Redis releaseLock error for key "${lockKey}":`, error);
    }
  }
}

