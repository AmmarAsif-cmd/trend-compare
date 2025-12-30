/**
 * Redis/Upstash cache store implementation
 */

let Redis: any = null;
try {
  // Try to import @upstash/redis if available
  const upstashRedis = require('@upstash/redis');
  Redis = upstashRedis.Redis;
} catch (error) {
  // @upstash/redis not installed, Redis will be unavailable
  console.warn('[Cache] @upstash/redis not installed. Redis caching will be unavailable.');
}

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  staleAt: number;
  tags?: string[];
}

export class RedisStore {
  private redis: InstanceType<typeof Redis> | null = null;
  private initialized = false;

  constructor(redisUrl?: string, redisToken?: string) {
    if (!Redis) {
      this.initialized = false;
      return;
    }

    if (redisUrl && redisToken) {
      try {
        this.redis = new Redis({
          url: redisUrl,
          token: redisToken,
        });
        this.initialized = true;
      } catch (error) {
        console.error('[Cache] Failed to initialize Redis:', error);
        this.initialized = false;
      }
    }
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

