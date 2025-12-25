# Unified Caching Layer

A production-ready caching layer for TrendArc with support for in-memory fallback, Redis/Upstash, stale-while-revalidate, request coalescing, and distributed locking.

## Features

- ✅ **In-memory fallback**: Always available, no external dependencies
- ✅ **Redis/Upstash support**: Optional distributed caching
- ✅ **Stale-while-revalidate**: Return stale data immediately, refresh in background
- ✅ **Request coalescing**: Dedupe concurrent requests for same key
- ✅ **Distributed locking**: Prevent cache stampede across processes
- ✅ **Tag-based invalidation**: Invalidate related cache entries
- ✅ **Stable hashing**: Consistent cache keys from objects

## Installation

For Redis/Upstash support (optional):

```bash
npm install @upstash/redis
```

## Configuration

Set environment variables:

```env
# Cache provider: 'upstash' or 'memory' (default: 'memory')
CACHE_PROVIDER=upstash

# Default TTL in seconds (default: 3600)
CACHE_DEFAULT_TTL_SECONDS=3600

# Default stale TTL in seconds (default: 7200)
CACHE_DEFAULT_STALE_TTL_SECONDS=7200

# Upstash Redis credentials (required if CACHE_PROVIDER=upstash)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

## Usage

### Basic Operations

```typescript
import { get, set, getOrSet } from '@/lib/cache';

// Set a value
await set('user:123', { name: 'John' }, 3600); // 1 hour TTL

// Get a value
const user = await get<{ name: string }>('user:123');

// Get or set with compute function
const data = await getOrSet(
  'expensive-computation',
  3600,
  async () => {
    // Expensive computation
    return await computeExpensiveData();
  }
);
```

### Advanced Usage

```typescript
import { getOrSet } from '@/lib/cache';

// With options
const result = await getOrSet(
  'key',
  3600, // TTL
  async () => computeData(),
  {
    staleTtlSeconds: 7200, // Stale data valid for 2 hours
    lockSeconds: 30,        // Lock duration
    tags: ['user', 'profile'], // Tags for invalidation
    forceRefresh: false,    // Force recompute
  }
);
```

### Tag-based Invalidation

```typescript
import { deleteByTag } from '@/lib/cache';

// Invalidate all entries with tag 'user'
await deleteByTag('user');
```

### Stale-While-Revalidate

The cache automatically implements stale-while-revalidate:

1. If data is fresh (< TTL), return immediately
2. If data is stale but within `staleTtlSeconds`, return stale data and refresh in background
3. If data is expired, compute new value

```typescript
// Set with short TTL
await set('data', 'value', 1); // 1 second TTL

// Wait for it to become stale
await new Promise(resolve => setTimeout(resolve, 1100));

// Get with SWR - returns stale immediately, refreshes in background
const value = await getOrSet(
  'data',
  60,
  async () => 'new-value',
  { staleTtlSeconds: 5 } // Stale valid for 5 seconds
);
// Returns 'value' immediately, then refreshes to 'new-value'
```

### Request Coalescing

Concurrent requests for the same key are automatically deduped:

```typescript
// 5 concurrent requests - only computes once
const promises = Array.from({ length: 5 }, () =>
  getOrSet('key', 60, async () => expensiveComputation())
);

const results = await Promise.all(promises);
// All results are the same, computation ran only once
```

### Distributed Locking

When Redis is available, distributed locks prevent cache stampede across multiple processes:

```typescript
// Multiple processes can safely call this simultaneously
const result = await getOrSet(
  'key',
  60,
  async () => expensiveComputation(),
  { lockSeconds: 30 } // Lock for 30 seconds
);
```

## API Reference

### `get<T>(key: string): Promise<T | null>`

Get value from cache.

### `set<T>(key: string, value: T, ttlSeconds?: number, staleTtlSeconds?: number, tags?: string[]): Promise<void>`

Set value in cache.

### `getOrSet<T>(key: string, ttlSeconds: number, computeFn: () => Promise<T>, options?: GetOrSetOptions): Promise<T>`

Get value from cache or compute and set it.

**Options:**
- `staleTtlSeconds?: number` - TTL for stale data
- `lockSeconds?: number` - Lock duration (default: 30)
- `tags?: string[]` - Tags for invalidation
- `forceRefresh?: boolean` - Force recompute

### `deleteKey(key: string): Promise<void>`

Delete a single key.

### `deleteByTag(tag: string): Promise<void>`

Delete all entries with matching tag.

### `clear(): Promise<void>`

Clear all cache (memory only, Redis not cleared for safety).

### `getStats()`

Get cache statistics.

## Stable Hashing

```typescript
import { stableHash, createCacheKey } from '@/lib/cache/hash';

// Hash an object (order-independent)
const hash1 = stableHash({ a: 1, b: 2 });
const hash2 = stableHash({ b: 2, a: 1 }); // Same hash

// Create cache key from parts
const key = createCacheKey('prefix', 'user', 123, { filter: 'active' });
```

## Testing

Run tests:

```bash
npm test lib/cache
```

Tests verify:
- ✅ Request deduplication
- ✅ Stale-while-revalidate behavior
- ✅ Distributed locking
- ✅ Tag-based invalidation
- ✅ Basic operations

## Architecture

```
lib/cache/
├── index.ts           # Main cache interface
├── config.ts          # Environment configuration
├── memory-store.ts    # In-memory implementation
├── redis-store.ts     # Redis/Upstash implementation
├── hash.ts            # Stable hashing utilities
└── __tests__/         # Test harness
```

## Fallback Behavior

1. **Redis unavailable**: Falls back to memory
2. **Redis connection error**: Falls back to memory
3. **Memory always available**: Guaranteed to work

## Performance

- **Memory cache**: ~1ms latency
- **Redis cache**: ~5-10ms latency (network dependent)
- **Request coalescing**: Prevents duplicate computations
- **Stale-while-revalidate**: Zero-latency stale reads

## Best Practices

1. **Use tags** for related data that should be invalidated together
2. **Set appropriate TTLs** based on data freshness requirements
3. **Use staleTtlSeconds** for data that can be slightly stale
4. **Monitor cache stats** to optimize TTLs
5. **Use stable hashing** for consistent cache keys

