# Why 30 Predictions Are Stored

## Current Implementation

We're storing **30 predictions per term** (60 total for a comparison) because:

1. **30-Day Forecast**: We generate predictions for the next 30 days
2. **Daily Granularity**: Each day gets its own prediction record
3. **Accuracy Tracking**: We verify each day's prediction against actual data

## Why This Design?

### ✅ Benefits:
- **Detailed Accuracy Tracking**: Can verify if Day 1, Day 5, Day 15, etc. were accurate
- **Daily Forecast Chart**: Shows smooth prediction curve with daily granularity
- **Better Model Validation**: Can see which days our predictions are most/least accurate
- **Time-Series Analysis**: Can analyze prediction accuracy over the forecast horizon

### ❌ Drawbacks:
- **Database Storage**: 60 records per comparison (30 per term)
- **More Records to Manage**: More data to query and maintain
- **Potential Overhead**: If you have 1000 comparisons, that's 60,000 prediction records

## Options to Reduce Storage

### Option 1: Store Weekly Predictions (7 instead of 30)
Store predictions for days: 7, 14, 21, 30 (4 predictions per term = 8 total)

### Option 2: Store Key Milestones (5 instead of 30)
Store predictions for: Day 1, Day 7, Day 14, Day 21, Day 30 (5 per term = 10 total)

### Option 3: Store Aggregated Predictions (1 per week)
Store weekly averages: Week 1, Week 2, Week 3, Week 4 (4 per term = 8 total)

### Option 4: Store Only End-of-Period (1 instead of 30)
Store only Day 30 prediction (1 per term = 2 total) - loses daily tracking

## Recommendation

**Keep 30 predictions** if:
- You want detailed accuracy tracking
- You have sufficient database storage
- You want to show daily forecast charts
- You want to analyze which days are most predictable

**Reduce to weekly (7 predictions)** if:
- Database storage is a concern
- Daily granularity isn't needed
- You want to reduce database size

Would you like me to implement one of these options?


