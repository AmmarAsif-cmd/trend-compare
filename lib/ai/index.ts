/**
 * AI Usage Controls and Utilities
 * 
 * Provides:
 * - Budget controls (per-user and global daily caps)
 * - Standardized cache keys
 * - Guard functions to ensure premium-only access and cache-first behavior
 */

export {
  allowOrThrow,
  isAllowed,
  getUserUsage,
  PREMIUM_USER_DAILY_CAP,
  getGlobalDailyCap,
  type AIActionType,
  AIBudgetError,
} from './budget';

export {
  createKeywordContextKey,
  createPeakExplanationKey,
  createForecastExplanationKey,
  createTermNormalizationKey,
  createCategoryDetectionKey,
  createInsightSynthesisKey,
  getAICacheTTL,
  getAICacheStaleTTL,
} from './cacheKeys';

export {
  guardAICall,
  canMakeAICall,
  AIGuardError,
} from './guard';

