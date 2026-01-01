/**
 * Metric Normalization
 * Converts raw source metrics to percentile-based scores (0-100)
 * This ensures metrics can vary meaningfully and don't always look weak
 */

/**
 * Normalize a value to 0-100 using percentile-based scaling
 * Uses reference distribution to map values to percentiles
 */
export function normalizeToPercentile(
  value: number,
  referenceDistribution: number[],
  minPercentile: number = 5,
  maxPercentile: number = 95
): number {
  if (referenceDistribution.length === 0) {
    // No reference data - use linear scaling with reasonable bounds
    return Math.max(0, Math.min(100, value));
  }

  // Sort reference distribution
  const sorted = [...referenceDistribution].sort((a, b) => a - b);
  
  // Find percentile of value in distribution
  const percentile = getPercentile(value, sorted);
  
  // Map percentile to 0-100 scale, clamping to min/max percentiles
  const clampedPercentile = Math.max(minPercentile, Math.min(maxPercentile, percentile));
  const normalized = ((clampedPercentile - minPercentile) / (maxPercentile - minPercentile)) * 100;
  
  return Math.max(0, Math.min(100, normalized));
}

/**
 * Get percentile of a value in a sorted array
 */
function getPercentile(value: number, sortedArray: number[]): number {
  if (sortedArray.length === 0) return 50;
  
  // Count values less than or equal to value
  let count = 0;
  for (const v of sortedArray) {
    if (v <= value) count++;
  }
  
  return (count / sortedArray.length) * 100;
}

/**
 * Reference distributions for different metric types
 * These are based on typical ranges observed in real data
 */
export const REFERENCE_DISTRIBUTIONS = {
  // YouTube views: typical range 1k - 100M
  youtubeViews: Array.from({ length: 100 }, (_, i) => {
    const logValue = 3 + (i / 100) * 5; // log10(1k) to log10(100M)
    return Math.pow(10, logValue);
  }),
  
  // Spotify popularity: already 0-100, but we can still normalize
  spotifyPopularity: Array.from({ length: 100 }, (_, i) => i),
  
  // Wikipedia pageviews: typical range 100 - 1M per day
  wikipediaPageviews: Array.from({ length: 100 }, (_, i) => {
    const logValue = 2 + (i / 100) * 4; // log10(100) to log10(1M)
    return Math.pow(10, logValue);
  }),
  
  // TMDB ratings: 0-10 scale
  tmdbRating: Array.from({ length: 100 }, (_, i) => (i / 10)),
  
  // Steam review score: 0-100 percentage
  steamReviewScore: Array.from({ length: 100 }, (_, i) => i),
  
  // Momentum: -100 to 100
  momentum: Array.from({ length: 200 }, (_, i) => i - 100),
};

/**
 * Normalize YouTube views to 0-100 score
 */
export function normalizeYouTubeViews(views: number): number {
  if (views <= 0) return 0;
  const logViews = Math.log10(Math.max(1, views));
  // Map log10(views) to 0-100: 1k=10, 10k=20, 100k=30, 1M=40, 10M=50, 100M=60+
  const score = Math.min(100, (logViews / 8) * 100);
  return Math.max(0, score);
}

/**
 * Normalize Wikipedia pageviews to 0-100 score
 */
export function normalizeWikipediaPageviews(pageviews: number): number {
  if (pageviews <= 0) return 0;
  const logPageviews = Math.log10(Math.max(1, pageviews));
  // Map log10(pageviews) to 0-100: 100/day=10, 1k=20, 10k=40, 100k=60, 1M=80, 10M=100
  const score = Math.min(100, (logPageviews / 7) * 100);
  return Math.max(0, score);
}

/**
 * Normalize momentum to 0-100 score
 * Momentum is -100 to 100, we want 0-100
 */
export function normalizeMomentum(momentum: number): number {
  // Convert -100,100 to 0-100
  return Math.max(0, Math.min(100, 50 + (momentum / 2)));
}

/**
 * Check if a source has low coverage and should be weighted less
 */
export function hasLowCoverage(
  sourceData: { [key: string]: any },
  requiredFields: string[]
): boolean {
  const hasData = requiredFields.some(field => {
    const value = sourceData[field];
    return value !== undefined && value !== null && value > 0;
  });
  return !hasData;
}

