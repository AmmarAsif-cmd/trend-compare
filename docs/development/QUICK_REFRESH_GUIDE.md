# 🚀 Quick Refresh Guide

## Refresh All Comparisons

### Option 1: API (Recommended)
```bash
# Refresh trending comparisons (top 20)
curl "http://localhost:3000/api/refresh?trending=true&limit=20"

# Refresh all old comparisons (older than 7 days)
curl "http://localhost:3000/api/refresh?all=true&days=7&limit=100"
```

### Option 2: Script
```bash
npm run refresh:all
```

### Option 3: Browser
Visit these URLs:
- `http://localhost:3000/api/refresh?trending=true&limit=20`
- `http://localhost:3000/api/refresh?all=true&days=7`

## What Gets Refreshed?

✅ **Trending Comparisons**: Top 20 most viewed this week
✅ **Old Comparisons**: Comparisons older than 7 days
✅ **Fresh Data**: All multi-source data (Google Trends, YouTube, Wikipedia, etc.)
✅ **Updated Scores**: TrendArc scores recalculated with latest data

## Improved Trending Algorithm

The trending section now prioritizes:
1. **View Count** - More views = higher rank
2. **Recency** - Recent views get bonus points
3. **Quality Terms** - Meaningful, descriptive keywords
4. **Quality Filters** - Blocks test/demo keywords

## Result

After refresh:
- ✅ Trending section shows updated, quality keywords
- ✅ All comparisons have fresh data
- ✅ Better ranking for quality comparisons
- ✅ Stale data removed

