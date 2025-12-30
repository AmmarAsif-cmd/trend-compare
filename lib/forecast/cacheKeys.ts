/**
 * Canonical cache keys for forecasts and warmup status
 * 
 * Single source of truth for cache key generation
 * Ensures consistency across warmup jobs and premium endpoint
 */

import { createCacheKey } from '../cache/hash';
import { PREDICTION_ENGINE_VERSION } from '../insights/contracts/versions';

export interface ForecastKeyParams {
  slug: string;
  term: string;
  tf: string;
  geo: string;
  dataHash: string;
  engineVersion?: string;
}

export interface WarmupKeyParams {
  slug: string;
  tf: string;
  geo: string;
  dataHash: string;
}

/**
 * Generate forecast cache key for a term
 * 
 * Format: forecast:{slug}:{term}:{timeframe}:{geo}:{dataHash}:{engineVersion}
 */
export function forecastKey(params: ForecastKeyParams): string {
  const { slug, term, tf, geo, dataHash, engineVersion = PREDICTION_ENGINE_VERSION } = params;
  return createCacheKey('forecast', slug, term, tf, geo, dataHash, engineVersion);
}

/**
 * Generate warmup status cache key
 * 
 * Format: warmup-status:{slug}:{timeframe}:{geo}:{dataHash}
 */
export function warmupStatusKey(params: WarmupKeyParams): string {
  const { slug, tf, geo, dataHash } = params;
  return createCacheKey('warmup-status', slug, tf, geo, dataHash);
}

/**
 * Generate warmup error cache key (stores last error message)
 * 
 * Format: warmup-error:{slug}:{timeframe}:{geo}:{dataHash}
 */
export function warmupErrorKey(params: WarmupKeyParams): string {
  const { slug, tf, geo, dataHash } = params;
  return createCacheKey('warmup-error', slug, tf, geo, dataHash);
}

/**
 * Generate warmup started at cache key
 * 
 * Format: warmup-started-at:{slug}:{timeframe}:{geo}:{dataHash}
 */
export function warmupStartedAtKey(params: WarmupKeyParams): string {
  const { slug, tf, geo, dataHash } = params;
  return createCacheKey('warmup-started-at', slug, tf, geo, dataHash);
}

/**
 * Generate warmup finished at cache key
 * 
 * Format: warmup-finished-at:{slug}:{timeframe}:{geo}:{dataHash}
 */
export function warmupFinishedAtKey(params: WarmupKeyParams): string {
  const { slug, tf, geo, dataHash } = params;
  return createCacheKey('warmup-finished-at', slug, tf, geo, dataHash);
}

/**
 * Generate warmup debug ID cache key
 * 
 * Format: warmup-debug-id:{slug}:{timeframe}:{geo}:{dataHash}
 */
export function warmupDebugIdKey(params: WarmupKeyParams): string {
  const { slug, tf, geo, dataHash } = params;
  return createCacheKey('warmup-debug-id', slug, tf, geo, dataHash);
}

// Legacy function signatures for backward compatibility (will be removed)
export function warmupLockKey(params: WarmupKeyParams): string {
  const { slug, tf, geo, dataHash } = params;
  return createCacheKey('warmup-lock', slug, tf, geo, dataHash);
}

