/**
 * Comparison Metrics V2
 * 
 * Computes derived metrics for comparison results page:
 * - Change over time (gap, confidence, volatility)
 * - Source agreement/disagreement
 * - Stability vs Hype classification
 * 
 * Memoized to avoid recomputation for same inputs
 */

import type { SeriesPoint } from './trends';
import type { ComparisonVerdict } from './trendarc-score';
import { calculateComparisonConfidence } from './confidence-calculator';
import { memoize, stableHash } from '@/lib/utils/memoize';

export interface ComparisonMetrics {
  // Current period metrics
  marginPoints: number;
  confidence: number;
  volatility: number;
  agreementIndex: number;
  disagreementFlag: boolean;
  stability: 'stable' | 'hype' | 'volatile';
  
  // Change metrics (vs previous period or snapshot)
  gapChangePoints: number;
  confidenceChange: number;
  volatilityDelta: number;
  agreementChange: number;
  
  // Top drivers
  topDrivers: Array<{ name: string; impact: number }>;
  riskFlags: string[];
}

export interface ComparisonSnapshot {
  id: string;
  userId: string;
  slug: string;
  termA: string;
  termB: string;
  timeframe: string;
  geo: string;
  computedAt: Date;
  marginPoints: number;
  confidence: number;
  volatility: number;
  agreementIndex: number;
  winner: string;
  winnerScore: number;
  loserScore: number;
  category?: string | null;
}

/**
 * Calculate volatility from time series
 */
export function calculateVolatility(
  series: SeriesPoint[],
  term: string
): number {
  if (!series || series.length < 2) return 0;
  
  const values = series
    .map(p => Number(p[term]) || 0)
    .filter(v => isFinite(v) && v >= 0);
  
  if (values.length < 2) return 0;
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // Return coefficient of variation (0-100 scale)
  return mean > 0 ? Math.min(100, (stdDev / mean) * 100) : 0;
}

/**
 * Calculate agreement index from source breakdowns
 * Returns percentage of sources that agree on direction
 */
export function calculateAgreementIndex(
  breakdownA: { [key: string]: number },
  breakdownB: { [key: string]: number },
  weights?: { [key: string]: number }
): number {
  if (!breakdownA || !breakdownB) return 50; // Default neutral
  
  const sources = Object.keys(breakdownA).filter(k => k !== 'overall');
  if (sources.length === 0) return 50;
  
  let totalWeight = 0;
  let agreementWeight = 0;
  
  for (const source of sources) {
    const valueA = breakdownA[source] || 0;
    const valueB = breakdownB[source] || 0;
    const weight = weights?.[source] || 1;
    
    // Check if sources agree on direction
    const directionA = valueA > valueB ? 'up' : valueA < valueB ? 'down' : 'neutral';
    const directionB = valueA > valueB ? 'up' : valueA < valueB ? 'down' : 'neutral';
    
    // For agreement, we check if the majority direction matches
    // This is simplified - in practice, we'd compare against overall verdict
    const agrees = directionA === directionB || directionA === 'neutral' || directionB === 'neutral';
    
    totalWeight += weight;
    if (agrees) {
      agreementWeight += weight;
    }
  }
  
  return totalWeight > 0 ? (agreementWeight / totalWeight) * 100 : 50;
}

/**
 * Classify stability: stable, hype, or volatile
 */
export function classifyStability(
  series: SeriesPoint[],
  term: string,
  volatility: number
): 'stable' | 'hype' | 'volatile' {
  if (!series || series.length < 7) return 'volatile';
  
  const values = series
    .map(p => Number(p[term]) || 0)
    .filter(v => isFinite(v) && v >= 0);
  
  if (values.length < 7) return 'volatile';
  
  // Check for extreme spike (hype pattern)
  const recent = values.slice(-10);
  const baseline = values.slice(0, -10);
  const baselineAvg = baseline.length > 0 
    ? baseline.reduce((a, b) => a + b, 0) / baseline.length 
    : 0;
  const recentMax = Math.max(...recent);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  
  // Hype: single spike dominates or rapid rise then fall
  const spikeRatio = baselineAvg > 0 ? recentMax / baselineAvg : 0;
  const variance = recent.reduce((sum, val) => sum + Math.pow(val - recentAvg, 2), 0) / recent.length;
  const isHype = spikeRatio > 2.5 || (variance > baselineAvg * 0.5 && recent[recent.length - 1] < recentMax * 0.7);
  
  if (isHype) return 'hype';
  
  // Volatile: high variance
  if (volatility > 40) return 'volatile';
  
  // Stable: low volatility and consistent baseline
  return 'stable';
}

/**
 * Calculate change metrics between two periods
 */
export function calculateChangeMetrics(
  current: {
    marginPoints: number;
    confidence: number;
    volatility: number;
    agreementIndex: number;
  },
  previous: {
    marginPoints: number;
    confidence: number;
    volatility: number;
    agreementIndex: number;
  }
): {
  gapChangePoints: number;
  confidenceChange: number;
  volatilityDelta: number;
  agreementChange: number;
} {
  return {
    gapChangePoints: current.marginPoints - previous.marginPoints,
    confidenceChange: current.confidence - previous.confidence,
    volatilityDelta: current.volatility - previous.volatility,
    agreementChange: current.agreementIndex - previous.agreementIndex,
  };
}

/**
 * Extract top drivers from breakdown
 */
export function extractTopDrivers(
  breakdownA: { [key: string]: number },
  breakdownB: { [key: string]: number },
  limit: number = 2
): Array<{ name: string; impact: number }> {
  if (!breakdownA || !breakdownB) return [];
  
  const drivers: Array<{ name: string; impact: number }> = [];
  
  // Map source names
  const sourceNames: { [key: string]: string } = {
    searchInterest: 'Search Interest',
    socialBuzz: 'Social Buzz',
    authority: 'Authority',
    momentum: 'Momentum',
  };
  
  for (const [key, valueA] of Object.entries(breakdownA)) {
    if (key === 'overall') continue;
    
    const valueB = breakdownB[key] || 0;
    const impact = Math.abs(valueA - valueB);
    const name = sourceNames[key] || key;
    
    drivers.push({ name, impact });
  }
  
  // Sort by impact and return top N
  return drivers
    .sort((a, b) => b.impact - a.impact)
    .slice(0, limit);
}

/**
 * Generate risk flags based on metrics
 */
export function generateRiskFlags(
  volatility: number,
  agreementIndex: number,
  stability: 'stable' | 'hype' | 'volatile',
  hasSpike: boolean
): string[] {
  const flags: string[] = [];
  
  if (volatility > 50) {
    flags.push('High volatility detected');
  }
  
  if (agreementIndex < 60) {
    flags.push('Source disagreement');
  }
  
  if (stability === 'hype') {
    flags.push('Potential hype pattern');
  }
  
  if (hasSpike) {
    flags.push('Recent spike detected');
  }
  
  return flags;
}

/**
 * Compute all metrics for a comparison (internal, not memoized)
 */
function computeComparisonMetricsInternal(
  series: SeriesPoint[],
  termA: string,
  termB: string,
  verdict: {
    winner: string;
    loser: string;
    winnerScore: number;
    loserScore: number;
    margin: number;
    confidence: number;
  },
  breakdownA: { [key: string]: number },
  breakdownB: { [key: string]: number },
  previousSnapshot?: ComparisonSnapshot | null
): ComparisonMetrics {
  // Current period metrics
  const volatilityA = calculateVolatility(series, termA);
  const volatilityB = calculateVolatility(series, termB);
  const volatility = (volatilityA + volatilityB) / 2;
  
  const agreementIndex = calculateAgreementIndex(breakdownA, breakdownB);
  const stability = classifyStability(series, verdict.winner, volatility);
  
  // Check for spikes
  const recentValues = series.slice(-10).map(p => Number(p[verdict.winner]) || 0);
  const hasSpike = recentValues.length > 0 && 
    Math.max(...recentValues) > (recentValues.reduce((a, b) => a + b, 0) / recentValues.length) * 2;
  
  const disagreementFlag = agreementIndex < 60;
  const topDrivers = extractTopDrivers(breakdownA, breakdownB, 2);
  const riskFlags = generateRiskFlags(volatility, agreementIndex, stability, hasSpike);
  
  // Calculate leader change risk (estimated from volatility and margin)
  // Higher volatility + lower margin = higher risk
  const leaderChangeRisk = Math.min(100, volatility * 0.7 + (verdict.margin < 5 ? 50 : verdict.margin < 15 ? 30 : 0));
  
  // Count data sources from breakdowns
  const sourceCount = Math.max(1, Object.keys(breakdownA).filter(k => k !== 'overall').length);
  
  // Calculate continuous confidence score (replaces tier mapping)
  const confidenceResult = calculateComparisonConfidence(
    agreementIndex,
    volatility,
    series.length,
    sourceCount,
    verdict.margin,
    leaderChangeRisk
  );
  
  // Use calculated confidence instead of verdict confidence (which may be bucketed)
  const computedConfidence = confidenceResult.score;
  
  // Change metrics
  let gapChangePoints = 0;
  let confidenceChange = 0;
  let volatilityDelta = 0;
  let agreementChange = 0;
  
  if (previousSnapshot) {
      // Calculate previous period confidence using real data
      const prevConfidenceResult = calculateComparisonConfidence(
        previousSnapshot.agreementIndex,
        previousSnapshot.volatility,
        series.length, // Use current series length as approximation
        sourceCount,
        previousSnapshot.marginPoints,
        Math.min(100, previousSnapshot.volatility * 0.7 + (previousSnapshot.marginPoints < 5 ? 50 : previousSnapshot.marginPoints < 15 ? 30 : 0))
      );
      
      const changes = calculateChangeMetrics(
        {
          marginPoints: verdict.margin,
          confidence: computedConfidence, // Use computed confidence, not verdict.confidence
          volatility,
          agreementIndex,
        },
        {
          marginPoints: previousSnapshot.marginPoints,
          confidence: prevConfidenceResult.score, // Use calculated confidence
          volatility: previousSnapshot.volatility,
          agreementIndex: previousSnapshot.agreementIndex,
        }
      );
    gapChangePoints = changes.gapChangePoints;
    confidenceChange = changes.confidenceChange;
    volatilityDelta = changes.volatilityDelta;
    agreementChange = changes.agreementChange;
  } else {
    // Compare current period vs previous period from series
    const midpoint = Math.floor(series.length / 2);
    const currentPeriod = series.slice(midpoint);
    const previousPeriod = series.slice(0, midpoint);
    
    if (previousPeriod.length > 0 && currentPeriod.length > 0) {
      // Calculate previous period metrics
      const prevVolatilityA = calculateVolatility(previousPeriod, termA);
      const prevVolatilityB = calculateVolatility(previousPeriod, termB);
      const prevVolatility = (prevVolatilityA + prevVolatilityB) / 2;
      
      // Calculate previous period metrics from real data
      const prevValuesA = previousPeriod.map(p => Number(p[termA]) || 0);
      const prevValuesB = previousPeriod.map(p => Number(p[termB]) || 0);
      const prevAvgA = prevValuesA.reduce((a, b) => a + b, 0) / prevValuesA.length;
      const prevAvgB = prevValuesB.reduce((a, b) => a + b, 0) / prevValuesB.length;
      const prevMargin = Math.abs(prevAvgA - prevAvgB);
      
      // Calculate previous period agreement index (simplified - compare averages)
      const prevAgreementIndex = Math.abs(prevAvgA - prevAvgB) > 5 
        ? 70 // If clear winner, assume good agreement
        : 50; // If close, assume neutral agreement
      
      // Calculate previous period leader change risk
      const prevLeaderChangeRisk = Math.min(100, prevVolatility * 0.7 + (prevMargin < 5 ? 50 : prevMargin < 15 ? 30 : 0));
      
      // Calculate previous period confidence using real data
      const prevConfidenceResult = calculateComparisonConfidence(
        prevAgreementIndex,
        prevVolatility,
        previousPeriod.length,
        sourceCount,
        prevMargin,
        prevLeaderChangeRisk
      );
      
      const changes = calculateChangeMetrics(
        {
          marginPoints: verdict.margin,
          confidence: computedConfidence, // Use computed confidence
          volatility,
          agreementIndex,
        },
        {
          marginPoints: prevMargin,
          confidence: prevConfidenceResult.score, // Use calculated confidence from real data
          volatility: prevVolatility,
          agreementIndex: prevAgreementIndex,
        }
      );
      gapChangePoints = changes.gapChangePoints;
      confidenceChange = changes.confidenceChange;
      volatilityDelta = changes.volatilityDelta;
      agreementChange = changes.agreementChange;
    }
  }
  
  return {
    marginPoints: verdict.margin,
    confidence: computedConfidence, // Use computed continuous confidence
    volatility,
    agreementIndex,
    disagreementFlag,
    stability,
    gapChangePoints,
    confidenceChange,
    volatilityDelta,
    agreementChange,
    topDrivers,
    riskFlags,
  };
}

/**
 * Memoized version of computeComparisonMetrics
 * Memoized with 5-minute TTL
 */
export const computeComparisonMetrics = memoize(
  computeComparisonMetricsInternal,
  5 * 60 * 1000, // 5 minutes TTL
  (series, termA, termB, verdict, breakdownA, breakdownB, previousSnapshot) => {
    return stableHash({ 
      series, 
      termA, 
      termB, 
      verdict, 
      breakdownA, 
      breakdownB, 
      previousSnapshotId: previousSnapshot?.id 
    });
  }
);

