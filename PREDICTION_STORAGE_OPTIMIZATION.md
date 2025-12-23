# Prediction Storage Optimization

## Problem
Storing 30 daily predictions per term (60 total per comparison) creates significant database overhead.

## Solution: Smart Sampling Strategy

Instead of storing all 30 days, we now store **key milestones**:

### Smart Sampling (Recommended)
**Stores: Day 1, 3, 7, 14, 21, 30** (6 predictions per term = 12 total)

**Benefits:**
- ✅ **80% storage reduction** (12 vs 60 predictions)
- ✅ **Near-term focus**: Day 1, 3 for immediate accuracy tracking
- ✅ **Weekly milestones**: Day 7, 14, 21 for trend validation
- ✅ **End-of-period**: Day 30 for final forecast accuracy
- ✅ **Still accurate**: Enough points to track prediction quality

### Storage Comparison

| Strategy | Predictions per Term | Total per Comparison | Storage Reduction |
|----------|---------------------|---------------------|-------------------|
| **All (old)** | 30 | 60 | 0% |
| **Smart (new)** | 6 | 12 | **80%** |
| **Weekly** | 4 | 8 | 87% |
| **Milestones** | 5 | 10 | 83% |

## Why Smart Sampling is Best

1. **Near-term accuracy** (Day 1, 3): Most important for immediate validation
2. **Weekly checkpoints** (Day 7, 14, 21): Track trend accuracy over time
3. **End-of-period** (Day 30): Final forecast validation
4. **Balanced**: Good accuracy tracking without excessive storage

## Chart Display

The chart still shows **all 30 days** of predictions for smooth visualization. We only store the key milestones in the database for accuracy tracking.

## Changing Strategy

You can change the sampling strategy in `app/compare/[slug]/page.tsx`:

```typescript
// Current: Smart sampling (recommended)
const daysToStore = getDaysToStore(forecastDays, 'smart');

// Options:
// 'smart' - Day 1, 3, 7, 14, 21, 30 (6 predictions) ✅ Recommended
// 'weekly' - Day 7, 14, 21, 30 (4 predictions)
// 'milestones' - Day 1, 7, 14, 21, 30 (5 predictions)
// 'all' - All 30 days (original, not recommended)
```

## Impact

For **1,000 comparisons**:
- **Before**: 60,000 prediction records
- **After**: 12,000 prediction records
- **Savings**: 48,000 records (80% reduction)

## Migration

Existing predictions will continue to work. New predictions will use smart sampling automatically.

To clean up old full predictions (optional):
```sql
-- This is optional - old predictions will be updated naturally over time
-- Or you can manually clean up if needed
```


