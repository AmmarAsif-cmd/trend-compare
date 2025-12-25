/**
 * TrendArc Score Time-Series Calculator
 * Converts raw Google Trends series into TrendArc Score time-series
 * This provides a more stable, multi-source-aware signal for predictions
 */

import type { SeriesPoint } from './trends';
import { CATEGORY_WEIGHTS, type ComparisonCategory } from './trendarc-score';

export type TrendArcScoreTimeSeries = Array<{
  date: string;
  score: number;
  components: {
    searchInterest: number;
    socialBuzz: number;
    authority: number;
    momentum: number;
  };
}>;

/**
 * Calculate TrendArc Score time-series from Google Trends data
 * Uses category-specific weights and includes momentum calculation
 * 
 * This is more accurate than raw Google Trends because:
 * 1. Uses category-specific weighting
 * 2. Includes momentum component
 * 3. Normalized to 0-100 scale (same as what users see)
 * 4. More stable signal for predictions
 */
export function calculateTrendArcScoreTimeSeries(
  series: SeriesPoint[],
  term: string,
  category: ComparisonCategory = 'general'
): TrendArcScoreTimeSeries {
  if (!series || series.length === 0) return [];

  // Find matching term key (handle different formats)
  const firstPoint = series[0];
  const termKeys = Object.keys(firstPoint).filter(k => k !== 'date');
  
  // Enhanced term matching with more variations
  const normalizeForMatch = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
  const termNormalized = normalizeForMatch(term);
  
  const matchingTerm = termKeys.find(k => {
    const keyNormalized = normalizeForMatch(k);
    return (
      k.toLowerCase() === term.toLowerCase() ||
      keyNormalized === termNormalized ||
      k.toLowerCase().replace(/\s+/g, '-') === term.toLowerCase() ||
      k.toLowerCase().replace(/-/g, ' ') === term.toLowerCase() ||
      k.toLowerCase().replace(/\s+/g, '') === term.toLowerCase().replace(/\s+/g, '')
    );
  });

  if (!matchingTerm) {
    console.error(`[TrendArcScoreTimeSeries] ❌ Term "${term}" not found in series. Available keys: ${termKeys.join(', ')}`);
    return [];
  }

  if (matchingTerm !== term) {
    console.log(`[TrendArcScoreTimeSeries] Matched "${term}" to series key "${matchingTerm}"`);
  }

  const weights = CATEGORY_WEIGHTS[category] || CATEGORY_WEIGHTS.general;
  const scores: TrendArcScoreTimeSeries = [];

  for (let i = 0; i < series.length; i++) {
    const point = series[i];
    const date = point.date;
    const searchInterest = Number(point[matchingTerm] || 0);

    // Calculate momentum from recent trend
    let momentum = 50; // Default neutral
    if (i > 0) {
      const prevSearchInterest = Number(series[i - 1][matchingTerm] || 0);
      const change = searchInterest - prevSearchInterest;
      
      // Convert change to momentum score (0-100)
      // Positive change = upward momentum, negative = downward
      // Scale: ±1 point change = ±2 momentum points (max ±50)
      momentum = Math.max(0, Math.min(100, 50 + (change * 2)));
    }

    // For historical data, we typically only have Google Trends
    // Social Buzz and Authority default to 50 (neutral) unless we have time-series data
    // This is a simplified but still better than raw Google Trends
    const socialBuzz = 50; // Would be enhanced with YouTube/Spotify time-series if available
    const authority = 50;  // Would be enhanced with TMDB/Steam time-series if available

    // Calculate TrendArc Score using category weights
    const score = Math.round(
      searchInterest * weights.searchInterest +
      socialBuzz * weights.socialBuzz +
      authority * weights.authority +
      momentum * weights.momentum
    );

    scores.push({
      date,
      score: Math.max(0, Math.min(100, score)),
      components: {
        searchInterest: Math.round(searchInterest),
        socialBuzz: Math.round(socialBuzz),
        authority: Math.round(authority),
        momentum: Math.round(momentum),
      },
    });
  }

  return scores;
}

/**
 * Enhanced version that can incorporate multi-source data when available
 * For recent data points, uses full multi-source metrics
 * For historical data, uses simplified calculation
 */
export async function calculateEnhancedTrendArcScoreTimeSeries(
  series: SeriesPoint[],
  term: string,
  category: ComparisonCategory,
  intelligentComparison?: {
    scores: {
      termA: { overall: number; breakdown: any };
      termB: { overall: number; breakdown: any };
    };
  }
): Promise<TrendArcScoreTimeSeries> {
  const weights = CATEGORY_WEIGHTS[category] || CATEGORY_WEIGHTS.general;
  const scores: TrendArcScoreTimeSeries = [];

  // Get current multi-source breakdown if available
  const currentBreakdown = intelligentComparison?.scores?.termA?.breakdown || 
                           intelligentComparison?.scores?.termB?.breakdown;

  for (let i = 0; i < series.length; i++) {
    const point = series[i];
    const date = point.date;
    const searchInterest = Number(point[term] || 0);

    // Calculate momentum
    let momentum = 50;
    if (i > 0) {
      const prevSearchInterest = Number(series[i - 1][term] || 0);
      const change = searchInterest - prevSearchInterest;
      momentum = Math.max(0, Math.min(100, 50 + (change * 2)));
    }

    // Use current breakdown for recent data (last 30 days), simplified for older
    const isRecent = i >= series.length - 30;
    let socialBuzz = 50;
    let authority = 50;

    if (isRecent && currentBreakdown) {
      // Use actual multi-source data for recent points
      socialBuzz = currentBreakdown.socialBuzz || 50;
      authority = currentBreakdown.authority || 50;
    }

    const score = Math.round(
      searchInterest * weights.searchInterest +
      socialBuzz * weights.socialBuzz +
      authority * weights.authority +
      momentum * weights.momentum
    );

    scores.push({
      date,
      score: Math.max(0, Math.min(100, score)),
      components: {
        searchInterest: Math.round(searchInterest),
        socialBuzz: Math.round(socialBuzz),
        authority: Math.round(authority),
        momentum: Math.round(momentum),
      },
    });
  }

  return scores;
}

