/**
 * Standardized Cache Keys for AI Operations
 * 
 * Ensures consistent cache key format across all AI operations
 * Includes promptVersion + hashes for cache invalidation
 */

import { PROMPT_VERSION } from '@/lib/insights/contracts/versions';
import { createCacheKey, stableHash } from '@/lib/cache/hash';

/**
 * Create cache key for keyword context
 */
export function createKeywordContextKey(
  termA: string,
  termB: string,
  category?: string
): string {
  const hash = stableHash({
    termA: termA.toLowerCase().trim(),
    termB: termB.toLowerCase().trim(),
    category: category || 'general',
  });
  
  return createCacheKey(
    'ai',
    'keyword-context',
    PROMPT_VERSION,
    hash
  );
}

/**
 * Create cache key for peak explanation
 */
export function createPeakExplanationKey(
  term: string,
  peakDate: string,
  peakHash: string
): string {
  const hash = stableHash({
    term: term.toLowerCase().trim(),
    peakDate,
    peakHash,
  });
  
  return createCacheKey(
    'ai',
    'peak-explanation',
    PROMPT_VERSION,
    hash
  );
}

/**
 * Create cache key for forecast explanation
 */
export function createForecastExplanationKey(
  term: string,
  forecastHash: string,
  direction: 'rising' | 'falling' | 'stable' | 'volatile'
): string {
  const hash = stableHash({
    term: term.toLowerCase().trim(),
    forecastHash,
    direction,
  });
  
  return createCacheKey(
    'ai',
    'forecast-explanation',
    PROMPT_VERSION,
    hash
  );
}

/**
 * Create cache key for term normalization
 */
export function createTermNormalizationKey(
  termA: string,
  termB: string,
  category?: string
): string {
  const hash = stableHash({
    termA: termA.toLowerCase().trim(),
    termB: termB.toLowerCase().trim(),
    category: category || 'general',
  });
  
  return createCacheKey(
    'ai',
    'term-normalization',
    PROMPT_VERSION,
    hash
  );
}

/**
 * Create cache key for category detection
 */
export function createCategoryDetectionKey(
  termA: string,
  termB: string
): string {
  const hash = stableHash({
    termA: termA.toLowerCase().trim(),
    termB: termB.toLowerCase().trim(),
  });
  
  return createCacheKey(
    'ai',
    'category-detection',
    PROMPT_VERSION,
    hash
  );
}

/**
 * Create cache key for insight synthesis
 */
export function createInsightSynthesisKey(
  insightsHash: string,
  dataHash: string
): string {
  const hash = stableHash({
    insightsHash,
    dataHash,
  });
  
  return createCacheKey(
    'ai',
    'insight-synthesis',
    PROMPT_VERSION,
    hash
  );
}

/**
 * Get TTL for AI cache (7 days)
 */
export function getAICacheTTL(): number {
  return 7 * 24 * 60 * 60; // 7 days in seconds
}

/**
 * Get stale TTL for AI cache (30 days)
 */
export function getAICacheStaleTTL(): number {
  return 30 * 24 * 60 * 60; // 30 days in seconds
}

