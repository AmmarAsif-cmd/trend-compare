# 🔒 Concurrent Refresh Protection

## Overview

The refresh system now includes protection against concurrent refresh operations to prevent:
- **Race conditions** - Multiple processes trying to refresh the same comparison
- **API rate limits** - Too many parallel API calls
- **Database conflicts** - Multiple delete/update operations on the same record
- **Resource exhaustion** - Too many parallel operations consuming server resources

## Protection Mechanisms

### 1. **Request Deduplication**
- Tracks active refresh operations in memory
- Prevents duplicate refreshes of the same comparison
- Automatically cleans up stale entries

### 2. **Concurrency Limits**
- **Maximum 3 concurrent refresh operations** at once
- Prevents server overload
- Returns HTTP 429 (Too Many Requests) when limit reached

### 3. **Type-Based Protection**
- Prevents multiple bulk refreshes of the same type
- Separate tracking for:
  - `single` - Individual comparison refreshes
  - `all` - Bulk refresh all comparisons
  - `trending` - Refresh trending comparisons

### 4. **Cooldown Period**
- 30-second cooldown between refreshes of the same item
- Prevents rapid-fire refresh attempts

### 5. **Graceful Error Handling**
- Uses `deleteMany` instead of `delete` to avoid conflicts
- Handles "record not found" errors gracefully
- Returns helpful error messages to users

## API Behavior

### Success Response
```json
{
  "success": true,
  "message": "Refreshed 15 comparisons, 2 failed",
  "refreshed": 15,
  "failed": 2
}
```

### Rate Limit Response (HTTP 429)
```json
{
  "success": false,
  "error": "Too many concurrent refresh operations (3/3). Please wait.",
  "status": {
    "active": 3,
    "maxConcurrent": 3,
    "operations": [
      { "key": "type:all", "type": "all", "duration": 5000 }
    ]
  }
}
```

### Duplicate Request Response (HTTP 429)
```json
{
  "success": false,
  "error": "A trending refresh is already in progress. Please wait for it to complete.",
  "status": {
    "active": 1,
    "maxConcurrent": 3
  }
}
```

## Usage Examples

### Check Refresh Status
```bash
GET /api/refresh?status=true
```

### Refresh with Protection
```bash
# Single comparison - will wait if already in progress
GET /api/refresh?slug=iphone-vs-samsung

# Bulk refresh - will reject if already in progress
GET /api/refresh?all=true&days=7

# Trending refresh - will reject if already in progress
GET /api/refresh?trending=true&limit=20
```

## Admin UI Behavior

When multiple users click refresh:
1. **First request** - Starts refresh operation
2. **Subsequent requests** - Returns HTTP 429 with helpful message
3. **Status button** - Shows active refresh operations
4. **User feedback** - Clear alerts explaining why refresh was rejected

## Best Practices

1. **Check Status First** - Use `/api/refresh?status=true` before starting bulk operations
2. **Wait Between Requests** - Don't spam refresh buttons
3. **Monitor Active Operations** - Use status endpoint to see what's running
4. **Handle 429 Errors** - Show user-friendly messages when rate limited

## Production Considerations

### Current Implementation (In-Memory)
- Works for single-instance deployments
- Lost on server restart
- Not shared across multiple instances

### Future Enhancement (Redis)
For multi-instance deployments, consider using Redis:
```typescript
// Use Redis instead of in-memory Map
const redis = new Redis(process.env.REDIS_URL);
await redis.setex(`refresh:${key}`, 300, JSON.stringify({...}));
```

This would allow:
- Shared state across multiple server instances
- Persistent tracking across restarts
- Better scalability

## Configuration

Adjust limits in `lib/refresh-manager.ts`:
```typescript
const MAX_CONCURRENT_REFRESHES = 3; // Increase for more parallelism
const REFRESH_COOLDOWN = 30 * 1000; // Adjust cooldown period
```

## Monitoring

Monitor refresh operations:
- Check `/api/refresh?status=true` regularly
- Log refresh operations for analytics
- Alert on high failure rates
- Track API rate limit usage

