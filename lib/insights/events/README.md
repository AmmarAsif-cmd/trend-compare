# Multi-Source Event Detection System

This directory contains the real event detection system that explains spikes in search trends using **multiple reliable data sources**.

## 🎯 Problem Solved

Previously, the system used **hardcoded seasonal guessing** ("back-to-school season", "fall season") which was:
- ❌ Wrong most of the time
- ❌ Not scalable (requires manual updates)
- ❌ No real verification
- ❌ Provided zero value to users

Now, we use **REAL APIs and data sources** that automatically detect and verify events.

---

## 🔌 Data Sources

### 1. **Wikipedia Current Events** (`wikipedia-events.ts`)
- **Cost**: FREE ✅
- **Reliability**: HIGH (Wikipedia editors manually curate)
- **Coverage**: Daily summaries of major world events
- **API**: MediaWiki API (https://en.wikipedia.org/w/api.php)
- **Update Frequency**: Daily
- **No API Key Required**: ✅

**Example**:
```typescript
const events = await getWikipediaEventsNearDate(
  new Date('2024-09-09'),
  ['iphone', 'apple'],
  3 // ±3 days window
);
// Returns: Apple announces iPhone 16 at keynote event
```

### 2. **GDELT (Global Database of Events, Language, and Tone)** (`gdelt-events.ts`)
- **Cost**: FREE ✅
- **Reliability**: MEDIUM-HIGH (aggregates from thousands of news sources)
- **Coverage**: Global news events
- **API**: GDELT DOC 2.0 API
- **Update Frequency**: Every 15 minutes
- **No API Key Required**: ✅

**Example**:
```typescript
const events = await getGDELTEventsNearDate(
  new Date('2024-09-09'),
  ['iphone'],
  3
);
// Returns: 50+ news articles about iPhone 16 launch
```

### 3. **Tech Events Database** (`tech-events.ts`)
- **Cost**: FREE (local database) ✅
- **Reliability**: HIGH (manually curated)
- **Coverage**: Major tech product launches (Apple, Google, Samsung)
- **Update**: Manual (should be migrated to database)
- **No API Key Required**: ✅

**Example**:
```typescript
const events = findEventsNearDate(
  new Date('2024-09-09'),
  ['iphone'],
  7
);
// Returns: { title: "Apple iPhone 16 Launch Event", date: "2024-09-09", ... }
```

### 4. **NewsAPI** (`news-detector.ts`) - OPTIONAL
- **Cost**: FREE tier (100 requests/day), Paid ($449/month unlimited)
- **Reliability**: MEDIUM-HIGH
- **Coverage**: 80,000+ news sources worldwide
- **API**: https://newsapi.org
- **Update Frequency**: Real-time
- **API Key Required**: YES (add to `.env`)

**Setup**:
```bash
# Add to .env or .env.local
NEWS_API_KEY=your_api_key_here
```

**Example**:
```typescript
const articles = await fetchNewsForDate(
  new Date('2024-09-09'),
  ['iphone'],
  3
);
// Returns: Latest iPhone news from major publications
```

---

## 🧠 How It Works

### Multi-Source Detection Flow

```
1. Spike Detected: 82% increase on Sep 9, 2024
   ↓
2. Fetch from ALL sources in parallel:
   - Wikipedia: Check daily events for Sep 6-12
   - GDELT: Query "iphone" news for Sep 6-12
   - Tech DB: Check for Apple/iPhone events
   - NewsAPI: Fetch articles (if API key available)
   ↓
3. Unify & Deduplicate:
   - Group similar events (same date ±1 day, similar titles)
   - Merge duplicates from different sources
   ↓
4. Cross-Verify:
   - Events confirmed by 2+ sources marked as "Verified"
   - Calculate confidence score (high/medium/low)
   ↓
5. Return Best Explanation:
   - Prioritize verified events
   - Sort by confidence + number of sources
```

### Code Example

```typescript
import { getBestEventExplanation } from './multi-source-detector';

// Detect event for a spike
const event = await getBestEventExplanation(
  new Date('2024-09-09'),  // Date
  ['iphone', 'apple'],      // Keywords
  7                         // ±7 day window
);

if (event) {
  console.log(event.title);
  // → "Apple iPhone 16 Launch Event"

  console.log(event.verified);
  // → true (confirmed by Wikipedia + GDELT + Tech DB)

  console.log(event.sources);
  // → ['tech-db', 'wikipedia', 'gdelt']

  console.log(event.confidence);
  // → 'high'
}
```

---

## 📊 Confidence Scoring

Events are scored based on:

| Factor | Points |
|--------|--------|
| Confidence Level: High | +40 |
| Confidence Level: Medium | +25 |
| Confidence Level: Low | +10 |
| Each Additional Source | +15 |
| Verified by 2+ Sources | +25 |

**Example**:
- Event from Wikipedia only: 40 + 15 = **55/100**
- Event from Tech DB + GDELT: 40 + 30 + 25 = **95/100** (verified!)

---

## 🚀 Usage in Spike Detection

The system is automatically used when detecting spikes:

```typescript
// In patterns/spikes.ts
const context = await inferSpikeContext(point, keywords);

// Returns:
// - "Apple iPhone 16 Launch Event (Verified by multiple sources)"
// - Or undefined if no event found
```

---

## 🔄 Adding New Data Sources

To add a new event source:

1. Create new file: `lib/insights/events/your-source.ts`
2. Implement interface that returns `UnifiedEvent[]`
3. Add to `multi-source-detector.ts`:

```typescript
// Add import
import { fetchYourSource } from './your-source';

// Add to Promise.all
const [techEvents, wikiEvents, gdeltEvents, yourEvents] = await Promise.all([
  // ... existing sources
  fetchYourSource(targetDate, keywords, windowDays),
]);

// Add to unifyEvents
function unifyEvents(..., yourEvents: YourEvent[]) {
  // ... map yourEvents to UnifiedEvent format
}
```

---

## 🧪 Testing

### Test Individual Sources

```typescript
// Test Wikipedia
import { getWikipediaEventsNearDate } from './wikipedia-events';
const wiki = await getWikipediaEventsNearDate(new Date(), ['tech'], 3);
console.log(wiki);

// Test GDELT
import { getGDELTEventsNearDate } from './gdelt-events';
const gdelt = await getGDELTEventsNearDate(new Date(), ['iphone'], 3);
console.log(gdelt);

// Test Multi-Source
import { detectEventsMultiSource } from './multi-source-detector';
const events = await detectEventsMultiSource(new Date(), ['iphone'], 7);
console.log(events);
```

### Check API Status

```bash
# Wikipedia API (should work immediately)
curl "https://en.wikipedia.org/w/api.php?action=parse&page=Portal:Current_events/2024_September_9&format=json"

# GDELT API (should work immediately)
curl "https://api.gdeltproject.org/api/v2/doc/doc?query=iphone&mode=artlist&maxrecords=5&format=json"

# NewsAPI (requires API key)
curl "https://newsapi.org/v2/everything?q=iphone&apiKey=YOUR_KEY"
```

---

## 🎯 Future Improvements

1. **Move Tech Events to Database**
   - Currently hardcoded in `tech-events.ts`
   - Should be in PostgreSQL with admin panel
   - Auto-update from industry calendars

2. **Add More Sources**
   - Event Registry (alternative to NewsAPI)
   - Bing News API
   - Reddit trending topics
   - Twitter/X trending hashtags

3. **Machine Learning**
   - Train model to detect event patterns
   - Predict future spikes based on event calendars
   - Sentiment analysis from news tone

4. **Caching**
   - Cache API responses (especially Wikipedia/GDELT)
   - Store verified events in database
   - Reduce duplicate API calls

5. **Rate Limiting**
   - Implement proper rate limiting for APIs
   - Queue system for batch event detection
   - Respect API limits (GDELT, NewsAPI)

---

## ⚠️ Important Notes

### Rate Limits

- **Wikipedia**: No official limit, but be respectful (100ms delay between requests)
- **GDELT**: No official limit, designed for high volume
- **NewsAPI**:
  - Free tier: 100 requests/day
  - Paid tier: Unlimited
- **Tech DB**: No limit (local)

### Error Handling

All API calls have try-catch blocks and graceful fallbacks:

```typescript
// If Wikipedia fails, GDELT + Tech DB still work
// If all APIs fail, falls back to Tech DB only
// If Tech DB has no match, returns undefined (no generic guessing!)
```

### Performance

- All sources fetched in **parallel** using `Promise.all`
- Typical response time: 1-3 seconds
- Can be cached for repeated queries

---

## 📝 Summary

**Before**: Hardcoded seasonal guessing ❌

**After**: Real multi-source event detection with verification ✅

**Sources**: Wikipedia (free) + GDELT (free) + Tech DB (local) + NewsAPI (optional)

**Result**: Accurate, verified event explanations for search spikes
