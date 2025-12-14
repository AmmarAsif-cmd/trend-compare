# YouTube API Quota Exceeded - Graceful Handling

## Problem
YouTube Data API v3 has a **daily quota limit**:
- **Free tier**: 10,000 units per day
- **Search request**: 100 units each
- **Video stats request**: 1 unit each
- **Total searches per day**: ~100 searches

When quota is exceeded, the API returns a `403` error with message: "The request cannot be completed because you have exceeded your quota."

## Solution Implemented

### 1. **QuotaExceededError Class** (`lib/utils/errors.ts`)
- New error class specifically for quota exceeded errors
- Provides clear error messages
- Identifiable for special handling

### 2. **YouTube Adapter** (`lib/sources/adapters/youtube.ts`)
- Detects quota exceeded errors (403 status + "quota" in message)
- Throws `QuotaExceededError` instead of generic error
- Provides helpful warning messages

### 3. **Retry Logic** (`lib/utils/retry.ts`)
- **Never retries** quota exceeded errors (waste of time)
- Immediately throws the error to avoid unnecessary retries
- Updated default `shouldRetry` to check for `QuotaExceededError`

### 4. **Intelligent Comparison** (`lib/intelligent-comparison.ts`)
- Gracefully handles quota errors
- Shows helpful warning messages
- Continues comparison without YouTube data
- Provides guidance on quota limits

## Behavior

**Before:**
- Quota errors caused retries (wasteful)
- Generic error messages
- System might fail or hang

**After:**
- Quota errors detected immediately
- No retries (saves time)
- Clear warning messages
- Comparison continues without YouTube data
- Social buzz defaults to 50 (neutral) when YouTube unavailable

## User Experience

When quota is exceeded:
1. ✅ Comparison still works (without YouTube data)
2. ⚠️ Warning shown: "YouTube quota exceeded. Skipping YouTube data"
3. 💡 Helpful tip: "YouTube free tier allows ~100 searches/day. Consider enabling billing for higher limits"
4. 📊 Social buzz defaults to 50 (neutral score)
5. 🎯 Other data sources (Google Trends, TMDB, Spotify, etc.) still work

## How to Increase Quota

1. **Enable Billing** in Google Cloud Console
   - Go to: https://console.cloud.google.com/billing
   - Link a payment method
   - Default quota increases to 1,000,000 units/day

2. **Request Quota Increase**
   - Go to: https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas
   - Request higher limits if needed

3. **Optimize API Usage**
   - Cache YouTube results (already implemented)
   - Reduce unnecessary searches
   - Use batch requests when possible

## Testing

The system now:
- ✅ Detects quota errors correctly
- ✅ Doesn't retry quota errors
- ✅ Continues comparison gracefully
- ✅ Shows helpful messages
- ✅ Works without YouTube data

## Notes

- YouTube quota resets daily (Pacific Time)
- Each comparison uses 2 searches (one per term)
- With free tier: ~50 comparisons per day
- With billing enabled: ~5,000 comparisons per day

