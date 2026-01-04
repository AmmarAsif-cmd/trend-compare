# Insight Framework Contracts

This directory contains the canonical TypeScript type definitions for TrendArc's Insight Framework. These contracts serve as the **single source of truth** for insights used by UI components and export functionality.

## Structure

```
lib/insights/contracts/
├── index.ts                    # Main export file
├── versions.ts                 # Version constants
├── signals.ts                  # Signal type definitions
├── interpretations.ts          # Interpretation type definitions
├── decision-guidance.ts        # Decision guidance (Marketer/Founder roles)
├── forecast-bundle-summary.ts  # Forecast summaries (14-day, 30-day)
├── peak-note.ts                # Peak event definitions
├── ai-insights.ts              # Optional AI-enhanced explanations
└── insights-pack.ts            # Final assembled insights object
```

## Design Principles

1. **Deterministic First**: Core insights are generated from structured data analysis
2. **AI Enhancement**: AI explanations are optional additions, not required
3. **Versioned**: All contracts include version information for safe cache invalidation
4. **Data Freshness**: Every type includes metadata about when data was last updated
5. **Hash-based Caching**: Hash fields enable efficient cache invalidation

## Usage

```typescript
import type { InsightsPack, Signal, ForecastBundleSummary } from '@/lib/insights/contracts';
import { INSIGHT_VERSION, createEmptyInsightsPack } from '@/lib/insights/contracts';

// Create an empty insights pack
const pack = createEmptyInsightsPack(
  'taylor-swift-vs-beyonce',
  'Taylor Swift',
  'Beyonce',
  '12m',
  ''
);

// Use types for type safety
const signal: Signal = {
  id: 'sig-123',
  type: 'momentum_shift',
  severity: 'high',
  term: 'termA',
  description: 'Significant momentum shift detected',
  detectedAt: new Date().toISOString(),
  confidence: 85,
  source: {
    provider: 'google-trends',
    lastUpdatedAt: new Date().toISOString(),
  },
  generatedAt: new Date().toISOString(),
};
```

## Version Constants

- `INSIGHT_VERSION`: Current version of the insight framework ("1")
- `PROMPT_VERSION`: Version of AI prompts used ("1")
- `PREDICTION_ENGINE_VERSION`: Version of prediction engine ("1")
- `INSIGHT_FRAMEWORK_VERSION`: Combined version string for cache keys

## Type Overview

### Signals
Raw observations from data analysis (momentum shifts, volatility spikes, etc.)

### Interpretations
Human-readable meaning and context derived from signals

### Decision Guidance
Role-specific recommendations (Marketer, Founder only)

### Forecast Bundle Summary
Aggregated forecast information with 14-day and 30-day predictions

### Peak Note
Detected peak events with optional AI explanations

### AI Insights
Optional AI-enhanced explanations for meaning, forecasts, and peaks

### Insights Pack
Final assembled object containing all insights for a comparison

## Required Fields

Every type includes:
- `generatedAt`: ISO 8601 timestamp of when the insight was generated
- `dataFreshness`: Object with `lastUpdatedAt` and `source`
- Hash fields where needed: `dataHash`, `peakHash`, `forecastHash`, `insightsHash`

## Cache Invalidation

Hash fields enable efficient cache invalidation:
- When source data changes, hashes change
- Cache keys can include hash values
- Version changes invalidate all caches

## Future Evolution

When updating contracts:
1. Increment version constants
2. Add new optional fields (never remove required fields)
3. Use union types for extensibility
4. Document breaking changes

