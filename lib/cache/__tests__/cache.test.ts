/**
 * Cache test harness
 * Tests for dedupe, locking, and stale-while-revalidate
 */

import { getCache } from '../index';
import { createCacheKey } from '../hash';

describe('Cache', () => {
  beforeEach(() => {
    // Clear cache before each test
    getCache().clear();
  });

  describe('Request Coalescing (Dedupe)', () => {
    it('should dedupe concurrent requests for same key', async () => {
      let computeCount = 0;
      const computeFn = async () => {
        computeCount++;
        await new Promise(resolve => setTimeout(resolve, 100));
        return `value-${computeCount}`;
      };

      // Fire 5 concurrent requests
      const promises = Array.from({ length: 5 }, () =>
        getCache().getOrSet('test-key', 60, computeFn)
      );

      const results = await Promise.all(promises);

      // Should only compute once
      expect(computeCount).toBe(1);
      // All results should be the same
      expect(new Set(results).size).toBe(1);
      expect(results[0]).toBe('value-1');
    });

    it('should handle errors in deduped requests', async () => {
      const computeFn = async () => {
        throw new Error('Compute failed');
      };

      // Fire 3 concurrent requests
      const promises = Array.from({ length: 3 }, () =>
        getCache().getOrSet('error-key', 60, computeFn)
      );

      // All should reject with same error
      await expect(Promise.all(promises)).rejects.toThrow('Compute failed');
    });
  });

  describe('Stale-While-Revalidate (SWR)', () => {
    it('should return stale value and refresh in background', async () => {
      // Set initial value with short TTL
      await getCache().set('swr-key', 'initial-value', 1); // 1 second TTL

      // Wait for it to become stale
      await new Promise(resolve => setTimeout(resolve, 1100));

      let refreshCount = 0;
      const computeFn = async () => {
        refreshCount++;
        await new Promise(resolve => setTimeout(resolve, 50));
        return `refreshed-value-${refreshCount}`;
      };

      // Get with SWR (staleTtlSeconds > TTL)
      const result = await getCache().getOrSet(
        'swr-key',
        60,
        computeFn,
        { staleTtlSeconds: 5 }
      );

      // Should return stale value immediately
      expect(result).toBe('initial-value');

      // Wait for background refresh
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check that refresh happened
      expect(refreshCount).toBe(1);

      // Next request should get fresh value
      const freshResult = await getCache().getOrSet(
        'swr-key',
        60,
        computeFn,
        { staleTtlSeconds: 5 }
      );
      expect(freshResult).toBe('refreshed-value-1');
    });

    it('should not return expired values', async () => {
      // Set value with very short TTL
      await getCache().set('expired-key', 'expired-value', 0.1); // 0.1 second TTL

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 200));

      let computeCount = 0;
      const computeFn = async () => {
        computeCount++;
        return 'new-value';
      };

      // Should compute new value (not return expired)
      const result = await getCache().getOrSet(
        'expired-key',
        60,
        computeFn,
        { staleTtlSeconds: 1 }
      );

      expect(result).toBe('new-value');
      expect(computeCount).toBe(1);
    });
  });

  describe('Distributed Locking', () => {
    it('should prevent cache stampede with locks', async () => {
      let computeCount = 0;
      const computeFn = async () => {
        computeCount++;
        await new Promise(resolve => setTimeout(resolve, 200));
        return `value-${computeCount}`;
      };

      // Simulate concurrent requests (without dedupe)
      // In real scenario, these would be from different processes
      const promises = [
        getCache().getOrSet('lock-key', 60, computeFn, { lockSeconds: 5 }),
        getCache().getOrSet('lock-key', 60, computeFn, { lockSeconds: 5 }),
        getCache().getOrSet('lock-key', 60, computeFn, { lockSeconds: 5 }),
      ];

      const results = await Promise.all(promises);

      // With request coalescing, should only compute once
      // (In distributed scenario, lock would prevent multiple computes)
      expect(computeCount).toBe(1);
      expect(new Set(results).size).toBe(1);
    });
  });

  describe('Basic Operations', () => {
    it('should get and set values', async () => {
      await getCache().set('test-key', 'test-value', 60);
      const value = await getCache().get<string>('test-key');
      expect(value).toBe('test-value');
    });

    it('should return null for non-existent keys', async () => {
      const value = await getCache().get('non-existent');
      expect(value).toBeNull();
    });

    it('should delete values', async () => {
      await getCache().set('delete-key', 'delete-value', 60);
      await getCache().delete('delete-key');
      const value = await getCache().get('delete-key');
      expect(value).toBeNull();
    });

    it('should handle tags', async () => {
      await getCache().set('tag-key-1', 'value-1', 60, undefined, ['tag1']);
      await getCache().set('tag-key-2', 'value-2', 60, undefined, ['tag1']);
      await getCache().set('tag-key-3', 'value-3', 60, undefined, ['tag2']);

      await getCache().deleteByTag('tag1');

      expect(await getCache().get('tag-key-1')).toBeNull();
      expect(await getCache().get('tag-key-2')).toBeNull();
      expect(await getCache().get('tag-key-3')).toBe('value-3');
    });

    it('should force refresh when requested', async () => {
      await getCache().set('force-key', 'old-value', 60);

      let computeCount = 0;
      const computeFn = async () => {
        computeCount++;
        return 'new-value';
      };

      // Force refresh
      const result = await getCache().getOrSet(
        'force-key',
        60,
        computeFn,
        { forceRefresh: true }
      );

      expect(result).toBe('new-value');
      expect(computeCount).toBe(1);
    });
  });

  describe('Hash Utility', () => {
    it('should create stable cache keys', () => {
      const key1 = createCacheKey('prefix', { a: 1, b: 2 });
      const key2 = createCacheKey('prefix', { b: 2, a: 1 }); // Different order
      expect(key1).toBe(key2); // Should be same
    });

    it('should handle different types', () => {
      const key1 = createCacheKey('test', 123, 'string', { obj: true });
      expect(typeof key1).toBe('string');
      expect(key1.length).toBeGreaterThan(0);
    });
  });
});

// Simple test runner for environments without Jest
if (typeof describe === 'undefined') {
  console.log('[Cache Tests] Test harness requires Jest. Run with: npm test');
}

