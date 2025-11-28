# Content Engine - Pattern Detection & Narrative Generation

Zero-cost content generation system that creates unique insights for each comparison using pure statistical analysis.

## Overview

The Content Engine solves two critical problems:

1. **Duplicate Content Risk**: Generates unique, data-driven narratives for each comparison to avoid SEO penalties
2. **Single API Dependency**: Implements multi-source fallback (Reddit, Wikipedia, GitHub) so the system always works

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Content Engine                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │ Multi-Source   │  │ Pattern        │  │ Narrative     │ │
│  │ Data Fetching  │─>│ Detection      │─>│ Generation    │ │
│  └────────────────┘  └────────────────┘  └───────────────┘ │
│         │                    │                    │          │
│         ├─ Reddit            ├─ Seasonality       ├─ Headlines│
│         ├─ Wikipedia         ├─ Spikes/Anomalies ├─ Sections│
│         ├─ GitHub            ├─ Trends/Momentum  ├─ SEO Meta│
│         └─ Google Trends     ├─ Volatility       └─ Takeaways│
│                              └─ Comparisons                  │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

### 100% Generic Pattern Detection
- **NO keyword-specific hardcoding** - works for ANY search term
- Pure statistical methods (z-scores, regression, correlation, IQR)
- Scales to thousands of keywords without maintenance

### Multi-Source Fallback
- **Never relies on single API** - automatic fallback if one fails
- Free tier APIs: Reddit (60/min), Wikipedia (200/hr), GitHub (60/hr)
- Intelligent orchestration with priority and parallel strategies

### Unique Content Generation
- Data-driven narratives (not templates)
- Each comparison gets unique insights based on actual patterns
- Uniqueness scoring (tracks how different each page is)

### ML-Ready Architecture
- Cyclical encoding for temporal features
- Lag features and rolling statistics
- Feature extraction for future predictive models
- Export to ML format included

## Quick Start

### Basic Usage

```typescript
import { generateComparisonContent } from '@/lib/content-engine';

// Your existing comparison data
const terms = ['chatgpt', 'gemini'];
const series = [
  { date: '2024-01-01', chatgpt: 75, gemini: 45 },
  { date: '2024-01-02', chatgpt: 80, gemini: 48 },
  // ... more data
];

// Generate unique content
const result = await generateComparisonContent(terms, series);

console.log(result.narrative.headline);
// "ChatGPT vs Gemini: ChatGPT Leading in Search Interest"

console.log(result.narrative.sections);
// [
//   { title: "Overview", content: "...", confidence: 85 },
//   { title: "Trend Analysis: chatgpt", content: "...", confidence: 78 },
//   { title: "ChatGPT vs Gemini: Comparative Analysis", content: "...", confidence: 75 },
// ]

console.log(result.insights.confidence);
// 82 (0-100 confidence score)
```

### SEO Metadata

```typescript
import { generateSEOMetadata } from '@/lib/content-engine';

const metadata = await generateSEOMetadata(terms, series);

// Use in Next.js metadata
export const metadata: Metadata = {
  title: metadata.title,
  description: metadata.description,
  keywords: metadata.keywords,
};
```

### Quick Preview (Fast)

```typescript
import { generateQuickPreview } from '@/lib/content-engine';

const preview = await generateQuickPreview(terms, series);
// Minimal analysis, ~50ms response time
```

### Deep Analysis (Thorough)

```typescript
const result = await generateComparisonContent(terms, series, {
  deepAnalysis: true,  // More insights, takes ~500ms
  useMultiSource: true, // Try fallback sources
});
```

## Components

### 1. Pattern Detection (`lib/insights/`)

#### Core (`lib/insights/core/`)

**`types.ts`** - ML-ready data structures
```typescript
export interface EnrichedDataPoint {
  date: string;
  [term: string]: number | string;
  dayOfWeek?: number;      // 0-6
  month?: number;          // 0-11
  quarter?: number;        // 1-4
  isWeekend?: boolean;
  // ... more ML features
}
```

**`statistics.ts`** - 29 statistical functions
- Mean, median, standard deviation
- Z-scores and outlier detection
- Linear regression, correlation
- Rolling averages, exponential smoothing
- Autocorrelation for seasonality

**`temporal.ts`** - Date/time utilities
- Temporal feature extraction
- Cyclical encoding (sin/cos for ML)
- Holiday/season detection (generic)

#### Patterns (`lib/insights/patterns/`)

**`seasonal.ts`** - Recurring patterns
```typescript
detectSeasonalPatterns(series, term)
// Returns: annual, quarterly, weekly patterns
// Example: "chatgpt peaks in September (43% above average)"
```

**`spikes.ts`** - Unusual surges
```typescript
detectSpikes(series, term, thresholdStdDev = 2)
// Returns: spikes 2+ std dev above mean
// Example: "67% surge on 2024-03-15, coinciding with product launch period"
```

**`trends.ts`** - Momentum analysis
```typescript
analyzeTrend(series, term)
// Returns: direction, strength, acceleration, projections
// Example: "Strong upward trend with 85% growth and 23% momentum"
```

**`volatility.ts`** - Stability metrics
```typescript
analyzeVolatility(series, term)
// Returns: volatility level, stability score, risk score
// Example: "Volatile data showing 45% variation with frequent fluctuations"
```

### 2. Multi-Source Fetching (`lib/sources/`)

**`orchestrator.ts`** - Fallback coordinator
```typescript
import { dataOrchestrator } from '@/lib/sources/orchestrator';

const data = await dataOrchestrator.fetchWithFallback(
  'chatgpt',
  startDate,
  endDate,
  'google-trends' // Primary source
);

// If Google Trends fails:
// 1. Try Reddit API
// 2. Try Wikipedia Pageviews
// 3. Try GitHub Search
// Returns best available data
```

**Adapters:**
- `adapters/reddit.ts` - Reddit mentions & engagement
- `adapters/wikipedia.ts` - Wikipedia article pageviews
- `adapters/github.ts` - Repository creation & stars

Each adapter:
- Respects rate limits
- Normalizes to 0-100 scale
- Calculates confidence scores
- Handles errors gracefully

### 3. Narrative Generation (`lib/insights/narrative.ts`)

**Rule-based text generation** (no AI):
```typescript
generateNarrative(insights)
// Returns:
// - headline: "ChatGPT vs Gemini: Head-to-Head Trend Comparison"
// - sections: Overview, Trend Analysis, Comparison, Seasonal, Events
// - keyTakeaways: ["chatgpt is strong-growth with 85% trend strength", ...]
// - seoDescription: "Compare search trends: ChatGPT vs Gemini..."
// - uniquenessScore: 87 (how unique is this content)
```

Generates:
- **Headlines** - Data-driven titles
- **Sections** - Overview, trends, comparisons, seasonality, events
- **Key Takeaways** - Bullet points (3-5)
- **SEO Descriptions** - Meta descriptions with specific data
- **Uniqueness Scoring** - Measures content differentiation

## Configuration

### Content Engine Config

```typescript
type ContentEngineConfig = {
  useMultiSource?: boolean;      // Default: true
  primarySource?: 'google-trends' | 'reddit' | 'wikipedia' | 'github';
  fallbackEnabled?: boolean;     // Default: true
  deepAnalysis?: boolean;        // Default: false (fast mode)
  timeout?: number;              // Default: 30000ms
};
```

### Analyzer Config

```typescript
type AnalyzerConfig = {
  minDataPoints?: number;              // Default: 30
  seasonalityMinConfidence?: number;   // Default: 0.7 (70%)
  spikeThresholdStdDev?: number;      // Default: 2
  minSpikeMagnitude?: number;         // Default: 20%

  enableSeasonality?: boolean;        // Default: true
  enableSpikes?: boolean;             // Default: true
  enableTrends?: boolean;             // Default: true
  enableVolatility?: boolean;         // Default: true

  maxInsightsPerType?: number;        // Default: 5
};
```

## Examples

### Example 1: Generate Content for Compare Page

```typescript
// app/compare/[slug]/page.tsx
import { generateComparisonContent, generateSEOMetadata } from '@/lib/content-engine';

export async function generateMetadata({ params }) {
  const { slug } = params;
  const terms = fromSlug(slug);

  // Get comparison data
  const result = await getOrBuildComparison(terms, '90d', 'US');

  // Generate SEO metadata
  const seo = await generateSEOMetadata(terms, result.series);

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords.join(', '),
  };
}

export default async function ComparePage({ params }) {
  const { slug } = params;
  const terms = fromSlug(slug);

  // Get comparison data
  const result = await getOrBuildComparison(terms, '90d', 'US');

  // Generate insights and narrative
  const content = await generateComparisonContent(terms, result.series, {
    deepAnalysis: true,
    useMultiSource: true,
  });

  return (
    <div>
      <h1>{content.narrative.headline}</h1>
      <p>{content.narrative.subtitle}</p>

      {/* Key Takeaways */}
      <ul>
        {content.narrative.keyTakeaways.map((takeaway, i) => (
          <li key={i}>{takeaway}</li>
        ))}
      </ul>

      {/* Chart */}
      <TrendChart series={result.series} terms={terms} />

      {/* Narrative Sections */}
      {content.narrative.sections.map((section, i) => (
        <section key={i}>
          <h2>{section.title}</h2>
          <p>{section.content}</p>
          <small>Confidence: {section.confidence}%</small>
        </section>
      ))}

      {/* Performance */}
      <small>
        Generated in {content.performance.totalMs}ms
        (Analysis: {content.performance.analysisMs}ms,
         Narrative: {content.performance.narrativeMs}ms)
      </small>
    </div>
  );
}
```

### Example 2: Check Data Source Health

```typescript
import { getDataSourceHealth } from '@/lib/content-engine';

const health = await getDataSourceHealth();

console.log(health);
// [
//   {
//     source: 'reddit',
//     status: 'active',
//     responseTime: 245,
//     successRate: 95,
//     rateLimitRemaining: 58
//   },
//   // ... more sources
// ]
```

### Example 3: Batch Generate for Popular Comparisons

```typescript
import { batchGenerateContent } from '@/lib/content-engine';

const topComparisons = [
  { terms: ['chatgpt', 'gemini'], series: [...] },
  { terms: ['iphone', 'android'], series: [...] },
  // ... more
];

const results = await batchGenerateContent(topComparisons, {
  deepAnalysis: true,
});

// Pre-cache the generated content
for (const result of results) {
  await saveToCache(result.insights, result.narrative);
}
```

## Performance

### Typical Performance (90 days of data, 2 terms):

- **Quick Mode**: ~150ms total
  - Data fetch: 0ms (using provided series)
  - Analysis: 80ms
  - Narrative: 70ms

- **Deep Mode**: ~500ms total
  - Data fetch: 0ms
  - Analysis: 350ms
  - Narrative: 150ms

- **With Multi-Source**: +200-500ms
  - Reddit/Wikipedia/GitHub fetch: 200-500ms
  - Analysis: 350ms
  - Narrative: 150ms

### Memory Usage:
- Peak: ~15MB per analysis
- Baseline: ~5MB

### Rate Limits:
- Reddit: 60 requests/minute (free)
- Wikipedia: 200 requests/hour (free)
- GitHub: 60 requests/hour (free, 5000 with token)
- Google Trends: Unofficial API (varies)

## Testing

### Unit Tests (To Be Written)

```bash
npm test lib/insights/core/statistics.test.ts
npm test lib/insights/patterns/seasonal.test.ts
npm test lib/sources/adapters/reddit.test.ts
```

### Integration Test

```typescript
import { generateComparisonContent } from '@/lib/content-engine';

test('should generate unique content for comparison', async () => {
  const terms = ['test', 'example'];
  const series = generateMockSeries(90);

  const result = await generateComparisonContent(terms, series);

  expect(result.insights).toBeDefined();
  expect(result.narrative.headline).toContain('test');
  expect(result.narrative.uniquenessScore).toBeGreaterThan(50);
});
```

## Future Enhancements

### Phase 1 (Current) ✓
- [x] Generic pattern detection (NO hardcoding)
- [x] Multi-source fallback
- [x] Narrative generation
- [x] ML-ready data structures

### Phase 2 (Next)
- [ ] Add tests for all components
- [ ] Integrate with compare page UI
- [ ] Add caching layer
- [ ] Performance optimizations

### Phase 3 (Future)
- [ ] Predictive models (ML forecasting)
- [ ] More data sources (Twitter/X, News APIs)
- [ ] Advanced NLP for narrative quality
- [ ] A/B testing framework for content variations

## Troubleshooting

### Issue: Low confidence scores

**Solution**: Ensure data has:
- At least 30 data points
- Minimal gaps in date coverage
- Non-zero values
- Consistent patterns

### Issue: Generic narratives

**Check**:
```typescript
const uniqueness = await checkContentUniqueness(terms, series);
console.log('Uniqueness:', uniqueness); // Should be >70
```

If low:
- More data points = more specific insights
- Longer date range = more seasonal patterns
- Volatile data = more spikes/events to describe

### Issue: Multi-source fallback not working

**Check health**:
```typescript
const health = await getDataSourceHealth();
console.log(health);
```

Common causes:
- Rate limits exceeded (wait for reset)
- Network issues (check connectivity)
- Term not found on source (normal, will try next)

## License

Part of TrendCompare - Internal use only.

## Contributors

Built for zero-cost content generation with maximum scalability.
