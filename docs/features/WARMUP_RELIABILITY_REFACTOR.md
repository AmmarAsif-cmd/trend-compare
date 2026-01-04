# Warmup Reliability Refactor - Implementation Complete

## ✅ Summary

Refactored warmup system to use cache-based status tracking instead of database, ensuring reliable execution and making it impossible for warmup to silently fail. Added comprehensive debug visibility.

## 📋 Changes Made

### 1. Canonical Cache Keys (`lib/forecast/cacheKeys.ts`)

**Refactored to use params objects:**
```typescript
export function forecastKey(params: ForecastKeyParams): string
export function warmupStatusKey(params: WarmupKeyParams): string
export function warmupErrorKey(params: WarmupKeyParams): string
export function warmupStartedAtKey(params: WarmupKeyParams): string
export function warmupFinishedAtKey(params: WarmupKeyParams): string
```

**Benefits:**
- Single source of truth for all cache keys
- Type-safe parameters
- Ensures exact key matching between warmup and premium endpoint

### 2. Warmup Execution Endpoint (`app/api/jobs/execute-warmup/route.ts`)

**NEW endpoint that performs heavy compute:**

**Steps:**
1. Sets `warmupStatus=running` and `warmupStartedAt=now` (TTL 15m)
2. Loads comparison row (series + terms) by slug/tf/geo
3. Generates forecasts for BOTH terms using prediction engine
4. Writes forecasts to cache using `forecastKey()` with TTL 24h fresh, 7d stale
5. Verifies write succeeded by reading keys back once
6. Sets `warmupStatus=ready`, `warmupFinishedAt=now`, clears error
7. Returns JSON `{ ok: true, status: "ready" }`

**On error:**
- Sets `warmupStatus=failed` (TTL 10m)
- Sets `warmupErrorKey=error message` (TTL 10m)
- Returns JSON `{ ok: false, status: "failed", error: "..." }`

**Security:**
- Secured by `X-Warmup-Secret` header
- No default fallback (requires explicit secret)

### 3. Updated Premium Endpoint (`app/api/comparison/premium/route.ts`)

**Changes:**

**A) `triggerWarmup()` function:**
- Sets `warmupStatus=queued` in cache (TTL 15m) if not already set
- Calls POST `/api/jobs/execute-warmup` with `X-Warmup-Secret` (async)
- Compute happens in execute-warmup endpoint runtime, not in premium request

**B) Status reading:**
- Reads `warmupStatus` from cache (not database)
- Computes `forecastAvailable` based on both forecasts being present
- Sets `warmupStatus`:
  - If `forecastAvailable` → `"ready"`
  - Else if cached status exists → use cached status
  - Else → `"needs_warmup"` and trigger warmup

**C) Debug info (when `DEBUG_API_HEADERS=true`):**
```typescript
debug: {
  warmupStatusKey: string,
  forecastKeys: { termAKey: string, termBKey: string },
  warmupStartedAt: string | null,
  warmupFinishedAt: string | null,
  warmupError: string | null
}
```

### 4. Updated Warmup Jobs

**Updated to use new cache key signatures:**
- `lib/jobs/warmup-on-demand.ts` - Uses params objects
- `lib/jobs/warmup-forecasts.ts` - Uses params objects

**Status stored as strings:**
- `warmupStatus` stores just the status string: `"queued" | "running" | "ready" | "failed"`
- Errors stored separately in `warmupErrorKey`
- Timestamps stored separately in `warmupStartedAtKey` and `warmupFinishedAtKey`

## 🔄 Flow

### 1. First Premium Call
```
1. Premium endpoint checks cache for forecasts → not found
2. Checks warmupStatus in cache → not found
3. Sets warmupStatus="queued" in cache (TTL 15m)
4. Calls POST /api/jobs/execute-warmup (async)
5. Returns: warmupStatus="queued", forecastAvailable=false, needsWarmup=true
```

### 2. Warmup Execution
```
1. /api/jobs/execute-warmup receives request
2. Sets warmupStatus="running", warmupStartedAt=now
3. Loads comparison data
4. Generates forecasts for termA and termB
5. Writes forecasts to cache using forecastKey()
6. Verifies forecasts were written (reads back)
7. Sets warmupStatus="ready", warmupFinishedAt=now, clears error
```

### 3. Second Premium Call
```
1. Premium endpoint checks cache for forecasts → found!
2. Checks warmupStatus in cache → "ready"
3. Returns: warmupStatus="ready", forecastAvailable=true, needsWarmup=false
4. insightsPack.forecasts populated with cached forecasts
```

## ✅ Acceptance Criteria

- [x] First call to premium returns warmupStatus queued/running, forecastAvailable false
- [x] After execute-warmup completes, next call returns:
  - warmupStatus="ready"
  - forecastAvailable=true
  - insightsPack.forecasts populated for both terms
- [x] If warmup fails, response shows warmupStatus="failed" and debug.warmupError when DEBUG_API_HEADERS=true
- [x] No heavy compute occurs inside premium route (all compute in execute-warmup)
- [x] Premium and warmup share EXACT cache keys (via canonical helpers)
- [x] Warmup cannot silently fail (status tracked in cache, errors stored separately)

## 🔧 Setup

1. **Set Environment Variable:**
   ```
   WARMUP_SECRET=your-secret-here
   ```

2. **Optional Debug Mode:**
   ```
   DEBUG_API_HEADERS=true
   ```

3. **Test:**
   ```bash
   # First call - should return warmupStatus="queued"
   curl "http://localhost:3000/api/comparison/premium?slug=amazon-vs-costco&tf=12m"
   
   # Wait for warmup to complete (check logs)
   # Second call - should return warmupStatus="ready", forecastAvailable=true
   curl "http://localhost:3000/api/comparison/premium?slug=amazon-vs-costco&tf=12m"
   
   # With DEBUG_API_HEADERS=true, response includes debug object with:
   # - warmupStatusKey
   # - forecastKeys (termAKey, termBKey)
   # - warmupStartedAt
   # - warmupFinishedAt
   # - warmupError (if failed)
   ```

## 🎯 Key Improvements

1. **Cache-Based Status**: No database dependency for warmup status
2. **Durable Execution**: Compute happens in dedicated endpoint with proper error handling
3. **Verification**: Forecasts verified after write to ensure they're actually cached
4. **Debug Visibility**: Comprehensive debug info when DEBUG_API_HEADERS=true
5. **Exact Key Matching**: Canonical helpers ensure premium and warmup use same keys
6. **No Silent Failures**: Status and errors tracked separately, impossible to silently fail

---

**Status**: ✅ Complete - Warmup system is now reliable, verifiable, and debuggable

