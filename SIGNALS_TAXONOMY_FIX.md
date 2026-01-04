# Signals Taxonomy and Response Consistency Fix

## ✅ Implementation Complete

Fixed response consistency for `/api/comparison/premium` and aligned Signals taxonomy across the system.

## 📋 Changes Made

### 1. Normalized Signals Structure

**Problem:** 
- Top-level `signals` was populated, but `insightsPack.signals` was empty array `[]`
- Signal counters showed 0 even when signals existed

**Solution:**
- Updated `InsightsPack` contract: `signals` is now a structured `SignalsSummary` object (not `Signal[]`)
- `InsightsPack.signals` is now the **single source of truth**
- Top-level `signals` in API response mirrors `insightsPack.signals` for convenience

**New SignalsSummary Structure:**
```typescript
{
  winner: 'termA' | 'termB' | 'tie',
  marginPoints: number,
  momentumA: number,
  momentumB: number,
  volatilityA: 'low' | 'medium' | 'high',
  volatilityB: 'low' | 'medium' | 'high',
  seriesTypeA: 'stable' | 'seasonal' | 'eventDriven' | 'noisy' | 'regimeShift',
  seriesTypeB: 'stable' | 'seasonal' | 'eventDriven' | 'noisy' | 'regimeShift',
  leaderChangeRisk: 'low' | 'medium' | 'high',
  confidenceOverall: number,
  computedAt: string, // ISO 8601
  dataFreshness: {
    lastUpdatedAt: string,
    source: string
  }
}
```

### 2. Fixed Signals Taxonomy

**Problem:**
- `signals-summary.ts` used `'trending'` but `generateInterpretations.ts` used `'Stable' | 'Seasonal' | 'EventDriven' | 'Noisy' | 'RegimeShift'`
- Inconsistent labels between signals and interpretations

**Solution:**
- Replaced `'trending'` with consistent enum: `'stable' | 'seasonal' | 'eventDriven' | 'noisy' | 'regimeShift'`
- Updated `createSignalsSummary()` to use `classifySeriesType()` which matches `generateInterpretations` logic
- Renamed `stabilityA/stabilityB` to `seriesTypeA/seriesTypeB` for clarity
- Removed signal counters (`signalCount`, `criticalSignals`, `highSeveritySignals`) - not needed in structured summary

**Taxonomy Alignment:**
- `signals-summary.ts`: Uses `SeriesType = 'stable' | 'seasonal' | 'eventDriven' | 'noisy' | 'regimeShift'`
- `generateInterpretations.ts`: Uses `SeriesClassification = 'Stable' | 'Seasonal' | 'EventDriven' | 'Noisy' | 'RegimeShift'`
- Both use the same classification logic (case difference is internal only)

### 3. Removed Duplication / Enforced Mirroring

**Solution:** Option 2 - Keep top-level signals but set it equal to `insightsPack.signals`

- Top-level `signals` in API response = `insightsPack.signals` (always identical)
- `insightsPack.signals` is the single source of truth
- Top-level is provided for UI convenience (easier access)

### 4. Fixed Warmup Status Logic

**Problem:**
- `warmupStatus` was `"queued"` but `warmupTriggered` was `false`
- Inconsistent logic

**Solution:**
- Defined warmup status enum: `'needs_warmup' | 'queued' | 'running' | 'ready' | 'failed'`
- Store warmup state in cache: `warmup-status:{slug}:{dataHash}` with TTL
- Fixed logic:
  - `warmupStatus='ready'` → `warmupTriggered=false` (no warmup needed)
  - `warmupStatus='queued'` → `warmupTriggered=true` (warmup triggered)
  - `warmupStatus='needs_warmup'` → `warmupTriggered=false` (not yet triggered)
- Updated `triggerWarmup()` to set status in cache

**Warmup Status Logic:**
```typescript
if (hasForecasts && hasAIInsights) {
  warmupStatus = 'ready';
  warmupTriggered = false;
} else if (warmupState exists) {
  warmupStatus = warmupState.status; // queued | running | failed
  warmupTriggered = true;
} else if (needsWarmup) {
  warmupStatus = 'queued';
  warmupTriggered = true;
  triggerWarmup(); // Sets status in cache
}
```

### 5. Updated Core Functions

**`lib/insights/signals-summary.ts`:**
- Updated `SignalsSummary` interface: removed counters, added `seriesTypeA/seriesTypeB`, `computedAt`, `dataFreshness`
- Updated `createSignalsSummary()`: uses `classifySeriesType()` matching `generateInterpretations` logic
- Added `SeriesType` export for consistency

**`lib/insights/contracts/insights-pack.ts`:**
- Changed `signals: Signal[]` to `signals: SignalsSummary`
- Updated `createEmptyInsightsPack()` to return structured signals object

**`lib/insights/buildInsightsPack.ts`:**
- Updated to accept `SignalsSummary` instead of `Signal[]`
- Updated `computeInsightsHash()` to hash structured signals object

**`lib/insights/getInsightsPack.ts`:**
- Added `scores` parameter to input interface
- Converts `Signal[]` to `SignalsSummary` using `createSignalsSummary()` before building pack
- Ensures `insightsPack.signals` is always populated

**`app/api/comparison/premium/route.ts`:**
- Removed duplicate `createSignalsSummary()` call (now done in `getInsightsPack`)
- Passes `scores` to `getInsightsPack()` for signals summary generation
- Uses `insightsPack.signals` as single source of truth
- Mirrors `insightsPack.signals` to top-level `signals` for convenience
- Fixed warmup status logic with proper state management

## ✅ Acceptance Criteria

- [x] `insightsPack.signals` is populated and consistent with top-level
- [x] No conflicting stability labels between signals and interpretations
- [x] Warmup fields are consistent and accurate
- [x] JSON remains fast and cached-only
- [x] No heavy compute, no AI calls

## 📊 Example Response

```json
{
  "isPremium": true,
  "cached": true,
  "forecastAvailable": true,
  "warmupStatus": "ready",
  "warmupTriggered": false,
  "signals": {
    "winner": "termA",
    "marginPoints": 15,
    "momentumA": 76,
    "momentumB": 45,
    "volatilityA": "low",
    "volatilityB": "medium",
    "seriesTypeA": "stable",
    "seriesTypeB": "stable",
    "leaderChangeRisk": "medium",
    "confidenceOverall": 0.82,
    "computedAt": "2024-01-15T10:30:00.000Z",
    "dataFreshness": {
      "lastUpdatedAt": "2024-01-15T09:00:00.000Z",
      "source": "google-trends"
    }
  },
  "insightsPack": {
    "version": "1",
    "slug": "amazon-vs-costco",
    "signals": {
      // Same as top-level signals (single source of truth)
      "winner": "termA",
      "marginPoints": 15,
      "seriesTypeA": "stable",
      "seriesTypeB": "stable",
      ...
    },
    "interpretations": [...],
    "decisionGuidance": {...},
    "forecasts": {...},
    "peaks": {...},
    "aiInsights": {...}
  },
  "needsWarmup": false
}
```

## 🎯 Key Improvements

1. **Single Source of Truth**: `insightsPack.signals` is the canonical signals structure
2. **Consistent Taxonomy**: All series type labels use the same enum across the system
3. **Logical Warmup Status**: Status and triggered flags are now consistent
4. **No Duplication**: Top-level signals mirrors insightsPack.signals (not duplicated)
5. **Performance**: Still fast, cached-only, no heavy compute

---

**Status**: ✅ Complete - Signals taxonomy aligned, response consistency fixed, warmup status logic corrected

