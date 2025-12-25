/**
 * In-memory cache store implementation
 */

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  staleAt: number;
  tags?: string[];
}

export class MemoryStore {
  private store = new Map<string, CacheEntry<unknown>>();

  /**
   * Get value from cache
   */
  get<T>(key: string): { value: T; isStale: boolean } | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const isExpired = now > entry.expiresAt;
    const isStale = now > entry.staleAt;

    if (isExpired) {
      this.store.delete(key);
      return null;
    }

    return {
      value: entry.value,
      isStale,
    };
  }

  /**
   * Set value in cache
   */
  set<T>(
    key: string,
    value: T,
    ttlSeconds: number,
    staleTtlSeconds?: number,
    tags?: string[]
  ): void {
    const now = Date.now();
    const expiresAt = now + ttlSeconds * 1000;
    const staleAt = staleTtlSeconds
      ? now + staleTtlSeconds * 1000
      : expiresAt;

    this.store.set(key, {
      value,
      expiresAt,
      staleAt,
      tags,
    });
  }

  /**
   * Delete value from cache
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Delete all entries with matching tag
   */
  deleteByTag(tag: string): void {
    for (const [key, entry] of this.store.entries()) {
      if (entry.tags?.includes(tag)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get size of cache
   */
  size(): number {
    return this.store.size;
  }
}

