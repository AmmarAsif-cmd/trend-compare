# AI Usage Controls for Premium

## ✅ Implementation Complete

AI usage controls have been implemented to enforce premium-only access, daily caps, and cache-first behavior.

## 📁 Files Created

1. **`lib/ai/budget.ts`** - Budget enforcement
   - Per-user daily cap (premium: 10/day)
   - Global daily cap (env: `AI_GLOBAL_DAILY_CAP`, default: 1000)
   - Redis storage with DB fallback
   - `allowOrThrow(userId, actionType)` function

2. **`lib/ai/cacheKeys.ts`** - Standardized cache keys
   - `keywordContext`
   - `peakExplanation`
   - `forecastExplanation`
   - `termNormalization`
   - `categoryDetection`
   - `insightSynthesis`
   - Includes `promptVersion` + hashes

3. **`lib/ai/guard.ts`** - AI call guard
   - Ensures premium-only access
   - Checks cache first
   - Enforces budget limits
   - Only calls AI if all checks pass

4. **`lib/ai/index.ts`** - Module exports

## 🎯 Key Features

### Budget Controls

**Per-User Daily Cap:**
- Premium users: 10 AI calls per day
- Resets at midnight UTC
- Stored in Redis (if available) or memory cache

**Global Daily Cap:**
- Configurable via `AI_GLOBAL_DAILY_CAP` env variable
- Default: 1000 calls per day
- Prevents system-wide overuse

**Storage:**
- Primary: Redis (if configured)
- Fallback: In-memory cache
- TTL: 24 hours (until end of day)

### Cache Keys

All cache keys follow the pattern:
```
ai:{operation}:{promptVersion}:{hash}
```

**Included Operations:**
- `keyword-context`
- `peak-explanation`
- `forecast-explanation`
- `term-normalization`
- `category-detection`
- `insight-synthesis`

**Cache TTL:**
- Fresh: 7 days
- Stale: 30 days

### Guard Functions

**`guardAICall()`** - Main guard function:
1. ✅ Checks premium access
2. ✅ Checks cache first
3. ✅ Enforces budget limits
4. ✅ Only calls AI if cache miss
5. ✅ Caches result automatically

**`canMakeAICall()`** - Non-throwing check:
- Returns `{ allowed, reason }` without throwing
- Useful for UI checks

## 🚫 Enforcement Rules

### Rule 1: Premium Only
- ✅ AI is **never** called for free users
- ✅ Throws `AIGuardError` with code `NO_PREMIUM` if free user attempts

### Rule 2: Cache First
- ✅ AI is **never** called if cached output exists
- ✅ Cache is checked before any budget checks
- ✅ Returns cached result immediately if found

### Rule 3: Budget Limits
- ✅ Per-user daily cap enforced
- ✅ Global daily cap enforced
- ✅ Throws `AIBudgetError` if limit exceeded

## 📊 Usage Examples

### Basic AI Call with Guard

```typescript
import { guardAICall, createKeywordContextKey } from '@/lib/ai';
import { detectCategoryWithAI } from '@/lib/ai-category-detector';

async function getCategory(termA: string, termB: string) {
  const cacheKey = createKeywordContextKey(termA, termB);
  
  const { result, cached } = await guardAICall(
    cacheKey,
    'categoryDetection',
    () => detectCategoryWithAI(termA, termB)
  );
  
  if (cached) {
    console.log('Returned from cache');
  } else {
    console.log('Called AI and cached result');
  }
  
  return result;
}
```

### Check if AI Call is Allowed

```typescript
import { canMakeAICall } from '@/lib/ai';

async function checkAccess() {
  const check = await canMakeAICall('categoryDetection');
  
  if (!check.allowed) {
    console.log('Not allowed:', check.reason);
    // Show upgrade prompt or error message
  }
}
```

### Get User Usage Stats

```typescript
import { getUserUsage } from '@/lib/ai';
import { getCurrentUser } from '@/lib/user-auth-helpers';

async function showUsage() {
  const user = await getCurrentUser();
  if (!user) return;
  
  const usage = await getUserUsage((user as any).id);
  
  console.log(`User: ${usage.userCount}/${usage.userLimit}`);
  console.log(`Global: ${usage.globalCount}/${usage.globalLimit}`);
}
```

## 🔧 Environment Variables

```env
# Global daily AI call cap (default: 1000)
AI_GLOBAL_DAILY_CAP=1000

# Anthropic API key (required for AI calls)
ANTHROPIC_API_KEY=sk-ant-...
```

## 🔄 Migration Guide

### Update Existing AI Functions

**Before:**
```typescript
export async function detectCategoryWithAI(termA: string, termB: string) {
  // Direct AI call
  const response = await anthropic.messages.create({...});
  return result;
}
```

**After:**
```typescript
import { guardAICall, createCategoryDetectionKey } from '@/lib/ai';

export async function detectCategoryWithAI(termA: string, termB: string) {
  const cacheKey = createCategoryDetectionKey(termA, termB);
  
  return await guardAICall(
    cacheKey,
    'categoryDetection',
    async () => {
      // AI call only if cache miss and budget allows
      const response = await anthropic.messages.create({...});
      return result;
    }
  );
}
```

## ✅ Checklist for AI Functions

When updating AI functions, ensure:

- [ ] Uses `guardAICall()` wrapper
- [ ] Uses standardized cache key from `cacheKeys.ts`
- [ ] Checks premium access (handled by guard)
- [ ] Checks cache first (handled by guard)
- [ ] Enforces budget limits (handled by guard)
- [ ] Never calls AI for free users (handled by guard)
- [ ] Never calls AI if cached (handled by guard)

## 🎯 Action Types

Supported action types:
- `keywordContext` - Keyword context generation
- `peakExplanation` - Peak event explanations
- `forecastExplanation` - Forecast explanations
- `termNormalization` - Term normalization
- `categoryDetection` - Category detection
- `insightSynthesis` - Insight synthesis

## 📈 Monitoring

Budget counters are stored with:
- **Key format**: `ai-budget:{type}:{identifier}:{date}`
- **TTL**: 24 hours (resets daily)
- **Storage**: Redis (primary) or memory (fallback)

Example keys:
- `ai-budget:user:user-123:2024-12-15`
- `ai-budget:global:2024-12-15`

## 🔒 Security

- ✅ Premium access verified via `canAccessPremium()`
- ✅ User ID validated before budget checks
- ✅ Cache keys include hashes to prevent collisions
- ✅ Budget limits prevent abuse
- ✅ Global cap prevents system overload

---

**Status**: ✅ Complete - Premium-only, cache-first, budget-enforced AI controls

