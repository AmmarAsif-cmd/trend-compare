# Warmup Jobs Reliability Fix

## ✅ Implementation Complete

Made warmup jobs reliably generate and store forecast bundles so `/api/comparison/premium` returns forecasts and `forecastAvailable` becomes `true`.

## 📋 Changes Made

### 1. Canonical Cache Keys

**Created:** `lib/forecast/cacheKeys.ts`

**Functions:**
- `forecastKey(slug, term, tf, geo, dataHash, engineVersion)` - Canonical forecast cache key
- `warmupStatusKey(slug, tf, geo, dataHash)` - Warmup status cache key
- `warmupLockKey(slug, tf, geo, dataHash)` - Distributed lock key

**Benefits:**
- Single source of truth for cache keys
- Consistent key generation across warmup jobs and premium endpoint
- Includes `dataHash` and `engineVersion` for proper cache invalidation

### 2. Shared DataHash Utility

**Created:** `lib/forecast/dataHash.ts`

**Function:**
- `computeDataHash(series, timeframe, termA, termB)` - Shared dataHash computation

**Benefits:**
- Consistent dataHash across warmup jobs and premium endpoint
- Ensures warmup jobs use the same hash as premium endpoint for cache key matching

### 3. Updated Warmup Jobs

**`lib/jobs/warmup-on-demand.ts`:**
- ✅ Sets warmup status to `"running"` before starting
- ✅ Uses canonical cache keys (`forecastKey`, `warmupStatusKey`, `warmupLockKey`)
- ✅ Generates forecasts for both terms using prediction engine
- ✅ Stores forecasts in cache with TTL 24h fresh, 7d stale
- ✅ Sets warmup status to `"ready"` on success (when both forecasts generated)
- ✅ Sets warmup status to `"failed"` on error (with error message, 10 min TTL)
- ✅ Sets warmup status to `"queued"` for partial completion (5 min TTL for retry)

**`lib/jobs/warmup-forecasts.ts`:**
- ✅ Uses canonical cache keys
- ✅ Computes dataHash for each comparison
- ✅ Sets warmup status to `"running"` before processing each comparison
- ✅ Generates and caches forecasts using canonical keys
- ✅ Updates warmup status to `"ready"` on success or `"failed"` on error

### 4. Updated Premium Endpoint

**`app/api/comparison/premium/route.ts`:**
- ✅ Uses canonical cache keys to read forecasts
- ✅ Reads warmup status from cache using `warmupStatusKey`
- ✅ Determines `forecastAvailable` from cached forecasts (both termA and termB required)
- ✅ Determines `needsWarmup` based on forecast availability (AI is optional)
- ✅ Sets `warmupStatus` from cache or defaults to `"needs_warmup"`
- ✅ Triggers warmup if forecasts missing and not already triggered
- ✅ Populates `insightsPack.forecasts` with cached forecasts

**Warmup Status Logic:**
```typescript
if (hasForecasts) {
  warmupStatus = 'ready'; // Forecasts are ready (AI optional)
} else if (warmupState exists) {
  warmupStatus = warmupState.status; // queued | running | failed
  warmupTriggered = true;
} else {
  warmupStatus = 'queued';
  warmupTriggered = true;
  triggerWarmup(); // Async background job
}
```

### 5. Forecast Structure in InsightsPack

**Forecasts are now properly structured:**
```typescript
forecasts: {
  termA?: ForecastBundleSummary, // Includes 14-day and 30-day forecasts
  termB?: ForecastBundleSummary
}
```

**ForecastBundleSummary includes:**
- `forecast14Day`: averageValue, confidence, keyPoints, warnings
- `forecast30Day`: averageValue, confidence, keyPoints, warnings
- `overallConfidence`: number
- `direction`: 'rising' | 'falling' | 'stable'
- `warnings`: Array of warning types
- `forecastHash`: for cache invalidation
- `predictionEngineVersion`: for version tracking

## ✅ Acceptance Criteria

- [x] After first premium call, warmup runs and sets status running → ready
- [x] After warmup completes, next premium call returns:
  - `forecastAvailable=true`
  - `insightsPack.forecasts.termA` and `termB` populated
  - `warmupStatus="ready"`
  - `needsWarmup=false` (unless AI sections are also required, but AI is optional)
- [x] Warmup status is stored in cache with proper TTL
- [x] Forecasts are stored using canonical cache keys
- [x] Premium endpoint reads forecasts using same canonical keys
- [x] No heavy compute or AI generation in premium endpoint

## 🔄 Flow

1. **First Premium Call:**
   - Premium endpoint checks cache for forecasts → not found
   - Sets `warmupStatus="queued"`, `warmupTriggered=true`
   - Triggers background warmup job
   - Returns `needsWarmup=true`, `forecastAvailable=false`

2. **Warmup Job Runs:**
   - Sets `warmupStatus="running"` in cache
   - Generates forecasts for termA and termB
   - Stores forecasts in cache using canonical keys
   - Sets `warmupStatus="ready"` on success

3. **Second Premium Call:**
   - Premium endpoint reads forecasts from cache → found
   - Reads `warmupStatus="ready"` from cache
   - Returns `forecastAvailable=true`, `needsWarmup=false`
   - `insightsPack.forecasts` populated with cached forecasts

## 🎯 Key Improvements

1. **Canonical Cache Keys**: Single source of truth ensures warmup jobs and premium endpoint use same keys
2. **Shared DataHash**: Consistent hashing ensures cache key matching
3. **Warmup Status Tracking**: Durable status in cache allows UI to show progress
4. **Forecast Structure**: Properly structured forecasts in insightsPack
5. **Error Handling**: Failed warmups are tracked with error messages

---

**Status**: ✅ Complete - Warmup jobs now reliably generate and store forecasts, premium endpoint correctly reads and returns them

