# Stage E: InsightsPack Assembly and Caching

## ✅ Implementation Complete

Stage E assembles the final InsightsPack from all components and implements caching with stable data hashing.

## 📁 Files Created

1. **`lib/insights/buildInsightsPack.ts`** - Assembles InsightsPack from components
2. **`lib/insights/getInsightsPack.ts`** - Gets or builds InsightsPack with caching

## 🎯 Key Features

### buildInsightsPack
**Input:**
- slug, termA, termB, timeframe, geo, category
- signals, interpretations, decisionGuidance
- forecasts (optional), peaks (optional), aiInsights (optional)
- dataHash, dataSource, lastUpdatedAt

**Output:** Complete `InsightsPack` matching contracts

**Features:**
- Computes `insightsHash` from all components
- Assembles all sections into final pack
- Handles optional sections gracefully

### getInsightsPack
**Input:**
- All comparison metadata (slug, terms, timeframe, geo, category)
- series (SeriesPoint[])
- signals, interpretations, decisionGuidance
- forecasts (optional), peaks (optional), aiInsights (optional)
- dataSource, lastUpdatedAt

**Output:** `GetInsightsPackResult` with:
- `pack`: Complete InsightsPack
- `needsWarmup`: boolean flag (true if forecast or AI sections missing)

**Features:**
- Computes stable `dataHash` from cleaned series + timeframe + engine versions
- Uses `cache.getOrSet` with TTL 24h, stale 7d
- Returns cached InsightsPack if available
- If AI content missing, still returns deterministic InsightsPack with aiSections null
- Sets `needsWarmup` flag appropriately

## 🔐 Stable Data Hashing

### DataHash Computation
The `dataHash` is computed from:
- **Cleaned series points**: Normalized dates, rounded values, consistent structure
- **Timeframe**: Comparison timeframe
- **Terms**: termA and termB
- **Engine versions**: INSIGHT_VERSION, PREDICTION_ENGINE_VERSION, PROMPT_VERSION

### Series Cleaning
- Normalizes dates to ISO format (YYYY-MM-DD)
- Rounds values to 2 decimal places
- Filters out invalid/non-finite values
- Matches term keys robustly (handles variations)
- Creates consistent structure: `{ date, termA, termB }`

### InsightsHash Computation
The `insightsHash` is computed from:
- Signal IDs, types, severities, terms, detectedAt
- Interpretation IDs, categories, terms
- Decision guidance IDs, actions, terms
- Forecast hashes (from ForecastBundleSummary)
- Peak hashes (from PeakNote)
- AI insights hash (if available)

## 💾 Caching Strategy

### Cache Key
```
insights-pack:{slug}:{dataHash}
```

### TTL Configuration
- **TTL**: 24 hours (86,400 seconds)
- **Stale TTL**: 7 days (604,800 seconds)
- **Tags**: `insights:{slug}`, `data:{dataHash}`

### Cache Behavior
- Uses `cache.getOrSet` for request coalescing
- Implements stale-while-revalidate
- Supports distributed locking (if Redis available)
- Falls back to in-memory cache

## 🚩 NeedsWarmup Flag

The `needsWarmup` flag indicates whether additional processing is needed:

```typescript
const needsWarmup = !hasForecasts || !hasAIInsights;
```

**True when:**
- Forecasts are missing (no termA or termB forecast)
- AI insights are missing (null or undefined)

**False when:**
- Both forecasts and AI insights are present

This flag allows the system to:
- Return deterministic insights immediately
- Trigger background warmup for missing sections
- Show partial insights while waiting for AI/forecasts

## 📊 Usage Example

```typescript
import { getInsightsPack } from '@/lib/insights/generate';

const result = await getInsightsPack({
  slug: 'taylor-swift-vs-beyonce',
  termA: 'Taylor Swift',
  termB: 'Beyonce',
  timeframe: '12m',
  geo: '',
  category: 'music',
  series: timeSeriesData,
  signals: [...],
  interpretations: [...],
  decisionGuidance: {
    marketer: [...],
    founder: [...],
  },
  forecasts: {
    termA: {...},
    termB: {...},
  },
  peaks: {
    termA: [...],
    termB: [...],
  },
  aiInsights: {...}, // Optional
  dataSource: 'google-trends',
  lastUpdatedAt: new Date().toISOString(),
});

// Check if warmup is needed
if (result.needsWarmup) {
  // Trigger background warmup for forecasts/AI
  await warmupInsights(result.pack);
}

// Use the pack
console.log(result.pack.insightsHash);
console.log(result.pack.signals.length);
console.log(result.pack.interpretations.length);
```

## 🔗 Integration Points

Ready to integrate with:
- `lib/insights/generateSignals` - Stage A
- `lib/insights/generateInterpretations` - Stage B
- `lib/insights/generateDecisionGuidance` - Stage C
- `lib/cache` - Caching layer
- `lib/insights/contracts` - Type definitions

## ✅ Deterministic Behavior

- Same input data → same dataHash
- Same components → same insightsHash
- Cache key is stable and predictable
- No side effects (pure functions)

## 🎯 Cache Invalidation

The cache can be invalidated by:
1. **Data changes**: New dataHash (different series/timeframe)
2. **Version changes**: Engine versions in dataHash
3. **Tag-based**: `deleteByTag('insights:{slug}')`
4. **Manual**: `deleteKey(cacheKey)`

---

**Status**: ✅ Complete - Deterministic, cached, and ready for integration

