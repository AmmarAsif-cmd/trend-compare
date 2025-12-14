# 🔄 Refresh Comparisons Guide

## Overview

This guide explains how to refresh cached comparisons to get updated data and improve the trending comparisons section.

## Why Refresh?

- **Stale Data**: Comparisons cached from previous searches may show outdated results
- **Better Trending**: Refreshing ensures trending section shows current, quality keywords
- **Updated Scores**: Multi-source data (YouTube, Wikipedia, etc.) gets refreshed

## Methods to Refresh

### 1. **API Endpoint** (Recommended)

#### Refresh Specific Comparison
```bash
GET /api/refresh?slug=iphone-vs-samsung
GET /api/refresh?slug=iphone-vs-samsung&timeframe=12m&geo=US
```

#### Refresh All Old Comparisons
```bash
GET /api/refresh?all=true&days=7&limit=100
```
- `days`: Refresh comparisons older than X days (default: 7)
- `limit`: Maximum number to refresh (default: 100)

#### Refresh Trending Comparisons
```bash
GET /api/refresh?trending=true&limit=20
```
- Refreshes top 20 most viewed comparisons from this week

#### Clear Cache (Force Fresh Fetch)
```bash
GET /api/refresh?clear=iphone-vs-samsung
```
- Deletes cached comparison, will rebuild on next view

### 2. **Script** (For Bulk Operations)

```bash
# Refresh all (trending + old comparisons)
npm run refresh:all

# Or manually
npx tsx scripts/refresh-all-comparisons.ts
```

### 3. **Programmatic** (In Code)

```typescript
import { refreshComparison, refreshTrendingComparisons } from '@/lib/refresh-comparisons';

// Refresh specific
await refreshComparison('iphone-vs-samsung', '12m', '');

// Refresh trending
await refreshTrendingComparisons(20);
```

## Improved Trending Algorithm

The trending section now uses a **quality scoring system**:

### Quality Factors:
1. **View Count** (Primary) - More views = higher score
2. **Recency Bonus** - Recent views get bonus points
   - Viewed today: +10 points
   - Viewed in last 3 days: +5 points
   - Viewed this week: +2 points
3. **Term Quality** - Longer, descriptive terms score higher
4. **Meaningful Terms** - Filters out generic words

### Quality Filters:
- ✅ Minimum 2 views required
- ✅ Filters out test/demo keywords
- ✅ Blocks single letters, numbers only
- ✅ Filters gibberish terms
- ✅ Prefers meaningful, descriptive comparisons

## Cache Settings

- **Trending Cache**: 30 minutes (was 1 hour)
- **Comparison Cache**: Stored in database, refreshed on demand
- **Category Cache**: 7 days TTL

## Best Practices

1. **Regular Refresh**: Run `npm run refresh:all` daily or weekly
2. **Focus on Trending**: Refresh top 20 trending comparisons regularly
3. **Monitor Quality**: Check trending section shows quality keywords
4. **Automate**: Set up cron job or scheduled task for automatic refresh

## Example Workflow

```bash
# 1. Refresh trending comparisons (most important)
curl "http://localhost:3000/api/refresh?trending=true&limit=20"

# 2. Refresh old comparisons (older than 7 days)
curl "http://localhost:3000/api/refresh?all=true&days=7&limit=50"

# 3. Verify trending section shows updated results
# Visit homepage and check "Trending Comparisons This Week"
```

## Troubleshooting

**Problem**: Trending section still shows old comparisons
- **Solution**: Clear Next.js cache and refresh
  ```bash
  # Clear Next.js cache
  rm -rf .next
  # Then refresh
  npm run refresh:all
  ```

**Problem**: Some comparisons not refreshing
- **Solution**: Check if comparison exists in database
- **Solution**: Verify terms are valid (2+ characters)

**Problem**: Quality keywords not ranking high
- **Solution**: Algorithm now prioritizes:
  - Higher view counts
  - Recent activity
  - Meaningful terms
  - Quality filters applied

## API Response Format

```json
{
  "success": true,
  "refreshed": 15,
  "failed": 2,
  "message": "Refreshed 15 comparisons, 2 failed"
}
```

