/**
 * Memoization Utilities
 * Cache derived computations to avoid recomputation
 */

import { stableHash } from '@/lib/cache/hash';

// Re-export stableHash for convenience
export { stableHash };

interface MemoizedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T>;
  clear: () => void;
  size: () => number;
}

const memoCache = new Map<string, { value: any; timestamp: number }>();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Memoize a function with TTL
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  ttl: number = DEFAULT_TTL,
  keyFn?: (...args: Parameters<T>) => string
): MemoizedFunction<T> {
  const cache = memoCache;

  const memoized = ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyFn 
      ? keyFn(...args)
      : stableHash({ fn: fn.name, args });
    
    const cached = cache.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < ttl) {
      return cached.value;
    }

    const value = fn(...args);
    cache.set(key, { value, timestamp: now });

    // Cleanup old entries periodically
    if (cache.size > 1000) {
      for (const [k, v] of cache.entries()) {
        if (now - v.timestamp > ttl) {
          cache.delete(k);
        }
      }
    }

    return value;
  }) as MemoizedFunction<T>;

  memoized.clear = () => cache.clear();
  memoized.size = () => cache.size();

  return memoized;
}

/**
 * Memoize async function
 */
export function memoizeAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  ttl: number = DEFAULT_TTL,
  keyFn?: (...args: Parameters<T>) => string
): MemoizedFunction<T> {
  const cache = memoCache;
  const pending = new Map<string, Promise<any>>();

  const memoized = (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const key = keyFn 
      ? keyFn(...args)
      : stableHash({ fn: fn.name, args });
    
    const cached = cache.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < ttl) {
      return cached.value;
    }

    // Check if already computing
    const existing = pending.get(key);
    if (existing) {
      return existing;
    }

    // Compute new value
    const promise = fn(...args).then(value => {
      cache.set(key, { value, timestamp: now });
      pending.delete(key);
      return value;
    }).catch(error => {
      pending.delete(key);
      throw error;
    });

    pending.set(key, promise);
    return promise;
  }) as MemoizedFunction<T>;

  memoized.clear = () => {
    cache.clear();
    pending.clear();
  };
  memoized.size = () => cache.size();

  return memoized;
}

