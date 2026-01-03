/**
 * Cache configuration from environment variables
 */

export type CacheProvider = 'upstash' | 'memory';

export interface CacheConfig {
  provider: CacheProvider;
  defaultTtlSeconds: number;
  defaultStaleTtlSeconds: number;
  redisUrl?: string;
  redisToken?: string;
}

/**
 * Load cache configuration from environment
 */
export function loadCacheConfig(): CacheConfig {
  const provider = (process.env.CACHE_PROVIDER || 'memory') as CacheProvider;
  
  if (provider !== 'upstash' && provider !== 'memory') {
    console.warn(`[Cache] Invalid CACHE_PROVIDER "${provider}", defaulting to "memory"`);
  }

  const defaultTtlSeconds = parseInt(
    process.env.CACHE_DEFAULT_TTL_SECONDS || '3600',
    10
  );

  const defaultStaleTtlSeconds = parseInt(
    process.env.CACHE_DEFAULT_STALE_TTL_SECONDS || '7200',
    10
  );

  const config: CacheConfig = {
    provider: provider === 'upstash' ? 'upstash' : 'memory',
    defaultTtlSeconds,
    defaultStaleTtlSeconds,
    redisUrl: process.env.UPSTASH_REDIS_REST_URL,
    redisToken: process.env.UPSTASH_REDIS_REST_TOKEN,
  };

  if (config.provider === 'upstash' && (!config.redisUrl || !config.redisToken)) {
    console.warn('[Cache] Upstash provider selected but UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set. Falling back to memory.');
    config.provider = 'memory';
  }

  return config;
}

