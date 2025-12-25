# AI-Assisted Insight Modules

## ✅ Implementation Complete

AI-assisted insight modules with strict structured I/O, caching, and budget controls.

## 📁 Files Created

1. **`lib/ai/insights/keyword-context.ts`** - Keyword context + category detection
2. **`lib/ai/insights/meaning-explanation.ts`** - Meaning explanation from interpretations
3. **`lib/ai/insights/peak-explanation.ts`** - Peak explanation (top 1-3 peaks)
4. **`lib/ai/insights/forecast-explanation.ts`** - Forecast explanation (14/30 day)
5. **`lib/ai/insights/index.ts`** - Module exports

## 🎯 Module Overview

### 1. Keyword Context + Category Detection

**Input:** `KeywordContextInput`
```typescript
{
  termA: string;
  termB: string;
  category?: ComparisonCategory;
}
```

**Output:** `KeywordContextOutput | null`
```typescript
{
  category: ComparisonCategory;
  categoryConfidence: number;
  categoryReasoning: string;
  context: {
    summary: string; // Max 2 sentences
    keyPoints: string[]; // 5-7 bullets max
    uncertainty?: string;
  };
  confidence: number;
  generatedAt: string;
  promptVersion: string;
}
```

**Cache:** 180d fresh, 365d stale

### 2. Meaning Explanation

**Input:** `MeaningExplanationInput`
```typescript
{
  termA: string;
  termB: string;
  interpretations: Interpretation[];
  category?: string;
}
```

**Output:** `MeaningExplanationOutput | null`
```typescript
{
  summary: string; // Max 2 sentences
  keyInsights: string[]; // 5-7 bullets max
  uncertainty?: string;
  confidence: number;
  generatedAt: string;
  promptVersion: string;
}
```

**Cache:** 30d fresh, 180d stale

### 3. Peak Explanation

**Input:** `PeakExplanationInput`
```typescript
{
  term: string;
  peaks: PeakNote[]; // Top 1-3 peaks
  category?: string;
}
```

**Output:** `PeakExplanationOutput | null`
```typescript
{
  peakExplanations: Array<{
    peakId: string;
    summary: string; // Max 2 sentences
    keyPoints: string[]; // 5-7 bullets max
    uncertainty?: string;
    confidence: number;
    generatedAt: string;
    promptVersion: string;
  }>;
  generatedAt: string;
}
```

**Cache:** 30d fresh, 180d stale (per peak)

### 4. Forecast Explanation

**Input:** `ForecastExplanationInput`
```typescript
{
  term: string;
  forecast: ForecastBundleSummary;
  category?: string;
}
```

**Output:** `ForecastExplanationOutput | null`
```typescript
{
  summary: string; // Max 2 sentences
  keyPoints: string[]; // 5-7 bullets max
  warnings?: string[];
  uncertainty?: string;
  confidence: number;
  generatedAt: string;
  promptVersion: string;
}
```

**Cache:** 30d fresh, 180d stale

## ✨ Key Features

### Structured I/O
- ✅ All modules take only structured inputs
- ✅ All modules return structured JSON matching contracts
- ✅ No generic text - concise and specific

### Caching Strategy
- ✅ **Keyword context**: 180d fresh, 365d stale (long-lived)
- ✅ **Peak/forecast explanations**: 30d fresh, 180d stale
- ✅ Cache checked before any AI calls
- ✅ Results cached automatically after AI calls

### Budget Controls
- ✅ Uses `budget.allowOrThrow()` before AI calls
- ✅ Premium-only access enforced
- ✅ Returns `null` if budget exceeded
- ✅ Relies on deterministic content if AI fails

### Content Guidelines
- ✅ Summary: Maximum 2 sentences
- ✅ Bullets: 5-7 maximum
- ✅ Explicit uncertainty when confidence is low
- ✅ No long generic text

## 📊 Usage Examples

### Keyword Context

```typescript
import { getKeywordContext } from '@/lib/ai/insights';

const context = await getKeywordContext({
  termA: 'Taylor Swift',
  termB: 'Beyonce',
  category: 'music',
});

if (context) {
  console.log(context.category); // 'music'
  console.log(context.context.summary); // 2 sentences max
  console.log(context.context.keyPoints); // 5-7 bullets
}
```

### Meaning Explanation

```typescript
import { getMeaningExplanation } from '@/lib/ai/insights';

const explanation = await getMeaningExplanation({
  termA: 'Taylor Swift',
  termB: 'Beyonce',
  interpretations: [...], // From generateInterpretations
  category: 'music',
});

if (explanation) {
  console.log(explanation.summary); // 2 sentences max
  console.log(explanation.keyInsights); // 5-7 bullets
}
```

### Peak Explanation

```typescript
import { getPeakExplanations } from '@/lib/ai/insights';

const explanations = await getPeakExplanations({
  term: 'Taylor Swift',
  peaks: topPeaks.slice(0, 3), // Top 1-3 peaks
  category: 'music',
});

if (explanations) {
  explanations.peakExplanations.forEach(exp => {
    console.log(exp.summary); // 2 sentences max
    console.log(exp.keyPoints); // 5-7 bullets
  });
}
```

### Forecast Explanation

```typescript
import { getForecastExplanation } from '@/lib/ai/insights';

const explanation = await getForecastExplanation({
  term: 'Taylor Swift',
  forecast: forecastBundle, // From prediction engine
  category: 'music',
});

if (explanation) {
  console.log(explanation.summary); // 2 sentences max
  console.log(explanation.keyPoints); // 5-7 bullets
  console.log(explanation.warnings); // If any
}
```

## 🔒 Error Handling

All modules follow the same error handling pattern:

1. **Cache check first** - Returns cached result if available
2. **Premium check** - Enforced by `guardAICall()`
3. **Budget check** - Enforced by `guardAICall()`
4. **AI call** - Only if all checks pass
5. **Return null** - If AI fails or budget exceeded
6. **Fallback** - Rely on deterministic content

## 📝 Content Guidelines

### Summary (Max 2 Sentences)
- ✅ Concise overview
- ✅ Key takeaway
- ❌ No generic filler

### Key Points (5-7 Bullets)
- ✅ Specific insights
- ✅ Actionable information
- ❌ No vague statements

### Uncertainty
- ✅ Explicit when confidence < 70
- ✅ Clear about limitations
- ❌ No false confidence

## 🔗 Integration

Ready to integrate with:
- `lib/insights/generateInterpretations` - For meaning explanation
- `lib/insights/contracts/peak-note` - For peak explanation
- `lib/insights/contracts/forecast-bundle-summary` - For forecast explanation
- `lib/ai/budget` - Budget controls
- `lib/ai/cacheKeys` - Cache key generation
- `lib/ai/guard` - Premium and cache checks

## ✅ Checklist

When using AI insight modules:

- [ ] Check cache first (handled automatically)
- [ ] Verify premium access (handled by guard)
- [ ] Check budget limits (handled by guard)
- [ ] Handle null returns (rely on deterministic content)
- [ ] Validate structured output
- [ ] Respect content guidelines (2 sentences, 5-7 bullets)

---

**Status**: ✅ Complete - Structured I/O, cached, budget-controlled, premium-only

