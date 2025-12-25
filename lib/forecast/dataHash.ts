/**
 * Shared utility for computing stable dataHash
 * 
 * Used by warmup jobs and premium endpoint to ensure consistent hashing
 */

import type { SeriesPoint } from '../trends';
import { stableHash } from '../cache/hash';
import { INSIGHT_VERSION, PREDICTION_ENGINE_VERSION, PROMPT_VERSION } from '../insights/contracts/versions';

/**
 * Clean and normalize series points for stable hashing
 */
function cleanSeriesPoints(series: SeriesPoint[], termA: string, termB: string): Array<{ date: string; valueA: number; valueB: number }> {
  if (!Array.isArray(series) || series.length === 0) return [];

  const firstPoint = series[0];
  if (!firstPoint || typeof firstPoint !== 'object') return [];

  // Find term keys
  const availableKeys = Object.keys(firstPoint).filter(k => k !== 'date');
  const normalizeKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, '');

  const termKeyA = availableKeys.find(k => {
    const keyNormalized = normalizeKey(k);
    const termNormalized = normalizeKey(termA);
    return (
      k.toLowerCase() === termA.toLowerCase() ||
      keyNormalized === termNormalized ||
      k.toLowerCase().replace(/\s+/g, '-') === termA.toLowerCase() ||
      k.toLowerCase().replace(/-/g, ' ') === termA.toLowerCase()
    );
  }) || availableKeys[0];

  const termKeyB = availableKeys.find(k => {
    const keyNormalized = normalizeKey(k);
    const termNormalized = normalizeKey(termB);
    return (
      k.toLowerCase() === termB.toLowerCase() ||
      keyNormalized === termNormalized ||
      k.toLowerCase().replace(/\s+/g, '-') === termB.toLowerCase() ||
      k.toLowerCase().replace(/-/g, ' ') === termB.toLowerCase()
    ) && k !== termKeyA;
  }) || availableKeys[1] || availableKeys[0];

  return series
    .map(point => ({
      date: String(point.date),
      valueA: Number(point[termKeyA] || 0),
      valueB: Number(point[termKeyB] || 0),
    }))
    .filter(p => isFinite(p.valueA) && isFinite(p.valueB));
}

/**
 * Compute stable dataHash from cleaned series points + timeframe + engine versions
 * 
 * This hash should be stable for the same data, even if generated at different times.
 */
export function computeDataHash(
  series: SeriesPoint[],
  timeframe: string,
  termA: string,
  termB: string
): string {
  // Clean and normalize series points
  const cleanedSeries = cleanSeriesPoints(series, termA, termB);

  // Create hash input with all relevant data
  const hashInput = {
    series: cleanedSeries,
    timeframe,
    termA,
    termB,
    // Include engine versions for cache invalidation when engines change
    versions: {
      insight: INSIGHT_VERSION,
      prediction: PREDICTION_ENGINE_VERSION,
      prompt: PROMPT_VERSION,
    },
  };

  return stableHash(hashInput);
}

