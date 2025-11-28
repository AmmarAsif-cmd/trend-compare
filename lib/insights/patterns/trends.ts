/**
 * Trend & Momentum Analysis
 * Detects growth/decline patterns and acceleration
 * Uses statistical methods - NO keyword-specific rules
 */

import type { EnrichedDataPoint, TrendMetrics } from '../core/types';
import {
  linearRegression,
  calculateMean,
  calculateStdDev,
  rollingAverage,
} from '../core/statistics';

export type TrendDirection = 'strong-growth' | 'growth' | 'stable' | 'decline' | 'strong-decline';

export type TrendAnalysis = {
  direction: TrendDirection;
  strength: number; // 0-100
  confidence: number; // 0-100
  momentum: number; // Current rate of change
  acceleration: number; // Change in momentum
  slope: number; // Linear regression slope
  rSquared: number; // How linear is the trend (0-1)
  description: string;
  projectedChange30d?: number; // Projected % change in next 30 days
  metadata: {
    startValue: number;
    endValue: number;
    percentChange: number;
    volatility: number;
    dataPoints: number;
  };
};

/**
 * Analyze trend for a single term
 */
export function analyzeTrend(
  series: EnrichedDataPoint[],
  term: string,
  lookbackDays: number = 90
): TrendAnalysis | null {
  if (series.length < 7) return null;

  // Get data for analysis (use full series or lookback window)
  const dataToAnalyze = lookbackDays > 0 && series.length > lookbackDays
    ? series.slice(-lookbackDays)
    : series;

  const values = dataToAnalyze.map(p => p[term] as number);
  const indices = values.map((_, i) => i);

  // Linear regression for trend line
  const regression = linearRegression(indices, values);
  const { slope, rSquared } = regression;

  // Calculate momentum (recent rate of change)
  const momentum = calculateMomentum(values);

  // Calculate acceleration (is momentum increasing/decreasing?)
  const acceleration = calculateAcceleration(values);

  // Classify trend direction
  const direction = classifyTrendDirection(slope, momentum, rSquared);

  // Calculate strength (0-100) based on slope magnitude and R²
  const strength = calculateTrendStrength(slope, rSquared, values);

  // Confidence based on R² and data quality
  const confidence = calculateTrendConfidence(rSquared, values.length);

  // Volatility (how noisy is the data?)
  const volatility = calculateVolatility(values);

  // Metadata
  const startValue = values[0];
  const endValue = values[values.length - 1];
  const percentChange = ((endValue - startValue) / startValue) * 100;

  // Project 30-day change if trend is strong enough
  const projectedChange30d = rSquared > 0.5
    ? projectChange(slope, values, 30)
    : undefined;

  return {
    direction,
    strength: Math.round(strength),
    confidence: Math.round(confidence),
    momentum,
    acceleration,
    slope,
    rSquared,
    description: generateTrendDescription(direction, strength, momentum, percentChange),
    projectedChange30d,
    metadata: {
      startValue,
      endValue,
      percentChange,
      volatility,
      dataPoints: values.length,
    },
  };
}

/**
 * Compare trends between two terms
 */
export function compareTrends(
  series: EnrichedDataPoint[],
  termA: string,
  termB: string
): {
  winner: string | null; // Which term is trending stronger
  gap: number; // How much stronger (percentage points)
  convergence: 'converging' | 'diverging' | 'stable';
  correlation: number; // -1 to 1
  description: string;
} | null {
  const trendA = analyzeTrend(series, termA);
  const trendB = analyzeTrend(series, termB);

  if (!trendA || !trendB) return null;

  // Determine winner by momentum
  const gapInMomentum = trendA.momentum - trendB.momentum;
  const winner = Math.abs(gapInMomentum) > 5
    ? (gapInMomentum > 0 ? termA : termB)
    : null;

  // Are they converging or diverging?
  const convergence = determineConvergence(series, termA, termB);

  // Calculate correlation
  const valuesA = series.map(p => p[termA] as number);
  const valuesB = series.map(p => p[termB] as number);
  const correlation = calculateCorrelation(valuesA, valuesB);

  return {
    winner,
    gap: Math.abs(gapInMomentum),
    convergence,
    correlation,
    description: generateComparisonDescription(termA, termB, winner, convergence, correlation),
  };
}

/**
 * Calculate momentum (recent rate of change)
 * Uses 7-day and 30-day rolling averages
 */
function calculateMomentum(values: number[]): number {
  if (values.length < 7) return 0;

  // Compare recent 7-day average to previous 7-day average
  const recent7d = values.slice(-7);
  const previous7d = values.slice(-14, -7);

  if (previous7d.length === 0) {
    // Not enough data for comparison, use simple recent vs older
    const recentAvg = calculateMean(recent7d);
    const olderAvg = calculateMean(values.slice(0, Math.min(7, values.length - 7)));
    return olderAvg === 0 ? 0 : ((recentAvg - olderAvg) / olderAvg) * 100;
  }

  const recentAvg = calculateMean(recent7d);
  const previousAvg = calculateMean(previous7d);

  return previousAvg === 0 ? 0 : ((recentAvg - previousAvg) / previousAvg) * 100;
}

/**
 * Calculate acceleration (change in momentum)
 * Positive = speeding up, Negative = slowing down
 */
function calculateAcceleration(values: number[]): number {
  if (values.length < 14) return 0;

  // Calculate momentum for recent period vs earlier period
  const recentMomentum = calculateMomentumForWindow(values.slice(-7));
  const previousMomentum = calculateMomentumForWindow(values.slice(-14, -7));

  return recentMomentum - previousMomentum;
}

function calculateMomentumForWindow(values: number[]): number {
  if (values.length < 2) return 0;
  const start = values[0];
  const end = values[values.length - 1];
  return start === 0 ? 0 : ((end - start) / start) * 100;
}

/**
 * Classify trend direction based on slope and momentum
 */
function classifyTrendDirection(
  slope: number,
  momentum: number,
  rSquared: number
): TrendDirection {
  // If trend is weak (low R²), it's likely stable/noisy
  if (rSquared < 0.3) {
    return 'stable';
  }

  // Strong trend indicators
  const avgIndicator = (slope + momentum) / 2;

  if (avgIndicator > 10) return 'strong-growth';
  if (avgIndicator > 3) return 'growth';
  if (avgIndicator < -10) return 'strong-decline';
  if (avgIndicator < -3) return 'decline';

  return 'stable';
}

/**
 * Calculate trend strength (0-100)
 * Based on slope magnitude and how linear the trend is
 */
function calculateTrendStrength(
  slope: number,
  rSquared: number,
  values: number[]
): number {
  // Normalize slope relative to data magnitude
  const mean = calculateMean(values);
  const normalizedSlope = mean === 0 ? 0 : Math.abs(slope) / mean;

  // Strength = how steep the slope is × how linear it is
  const rawStrength = normalizedSlope * 100 * rSquared;

  // Cap at 100
  return Math.min(100, rawStrength * 50); // Scale factor for reasonable range
}

/**
 * Calculate confidence in trend analysis (0-100)
 */
function calculateTrendConfidence(rSquared: number, dataPoints: number): number {
  // Confidence increases with:
  // 1. Higher R² (more linear)
  // 2. More data points

  const rSquaredScore = rSquared * 70; // R² contributes up to 70%
  const dataScore = Math.min(30, (dataPoints / 100) * 30); // More data up to 30%

  return Math.min(100, rSquaredScore + dataScore);
}

/**
 * Calculate volatility (coefficient of variation)
 */
function calculateVolatility(values: number[]): number {
  const mean = calculateMean(values);
  const stdDev = calculateStdDev(values);

  // Coefficient of variation (CV)
  return mean === 0 ? 0 : (stdDev / mean) * 100;
}

/**
 * Project future change based on current trend
 */
function projectChange(slope: number, values: number[], daysAhead: number): number {
  const currentValue = values[values.length - 1];
  const projectedValue = currentValue + (slope * daysAhead);

  return currentValue === 0 ? 0 : ((projectedValue - currentValue) / currentValue) * 100;
}

/**
 * Determine if two trends are converging or diverging
 */
function determineConvergence(
  series: EnrichedDataPoint[],
  termA: string,
  termB: string
): 'converging' | 'diverging' | 'stable' {
  if (series.length < 14) return 'stable';

  // Calculate gap at start vs gap at end
  const recentPeriod = series.slice(-7);
  const earlierPeriod = series.slice(0, 7);

  const recentGap = calculateAverageGap(recentPeriod, termA, termB);
  const earlierGap = calculateAverageGap(earlierPeriod, termA, termB);

  const gapChange = ((recentGap - earlierGap) / Math.max(earlierGap, 1)) * 100;

  if (Math.abs(gapChange) < 10) return 'stable';
  return gapChange < 0 ? 'converging' : 'diverging';
}

function calculateAverageGap(
  data: EnrichedDataPoint[],
  termA: string,
  termB: string
): number {
  const gaps = data.map(p => Math.abs((p[termA] as number) - (p[termB] as number)));
  return calculateMean(gaps);
}

/**
 * Simple correlation calculation
 */
function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const n = x.length;
  const meanX = calculateMean(x);
  const meanY = calculateMean(y);
  const stdX = calculateStdDev(x);
  const stdY = calculateStdDev(y);

  if (stdX === 0 || stdY === 0) return 0;

  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += ((x[i] - meanX) * (y[i] - meanY));
  }

  return sum / (n * stdX * stdY);
}

/**
 * Generate human-readable trend description
 */
function generateTrendDescription(
  direction: TrendDirection,
  strength: number,
  momentum: number,
  percentChange: number
): string {
  const absChange = Math.abs(Math.round(percentChange));
  const momentumRounded = Math.round(momentum);

  switch (direction) {
    case 'strong-growth':
      return `Strong upward trend with ${absChange}% growth and ${momentumRounded}% momentum`;

    case 'growth':
      return `Positive trend showing ${absChange}% growth with steady momentum`;

    case 'strong-decline':
      return `Significant downward trend with ${absChange}% decline`;

    case 'decline':
      return `Declining trend with ${absChange}% decrease over period`;

    case 'stable':
    default:
      return `Relatively stable with ${absChange}% variation`;
  }
}

/**
 * Generate comparison description
 */
function generateComparisonDescription(
  termA: string,
  termB: string,
  winner: string | null,
  convergence: 'converging' | 'diverging' | 'stable',
  correlation: number
): string {
  const parts: string[] = [];

  if (winner) {
    parts.push(`${winner} is trending stronger`);
  } else {
    parts.push(`Both terms show similar momentum`);
  }

  if (convergence === 'converging') {
    parts.push('trends are converging');
  } else if (convergence === 'diverging') {
    parts.push('gap is widening');
  }

  const corrRounded = Math.round(correlation * 100);
  if (Math.abs(correlation) > 0.7) {
    parts.push(`highly correlated (${corrRounded}%)`);
  } else if (Math.abs(correlation) < 0.3) {
    parts.push(`independent trends (${corrRounded}% correlation)`);
  }

  return parts.join(', ');
}

/**
 * Detect trend changes (reversals, accelerations)
 */
export function detectTrendChanges(
  series: EnrichedDataPoint[],
  term: string
): Array<{
  type: 'reversal' | 'acceleration' | 'deceleration';
  date: string;
  description: string;
  magnitude: number;
}> {
  if (series.length < 30) return [];

  const changes: Array<{
    type: 'reversal' | 'acceleration' | 'deceleration';
    date: string;
    description: string;
    magnitude: number;
  }> = [];

  // Analyze in windows of 14 days
  for (let i = 14; i < series.length - 14; i++) {
    const before = series.slice(i - 14, i);
    const after = series.slice(i, i + 14);

    const beforeValues = before.map(p => p[term] as number);
    const afterValues = after.map(p => p[term] as number);

    const beforeMomentum = calculateMomentum(beforeValues);
    const afterMomentum = calculateMomentum(afterValues);

    const momentumChange = afterMomentum - beforeMomentum;

    // Reversal: momentum changes sign significantly
    if (Math.abs(momentumChange) > 20 && beforeMomentum * afterMomentum < 0) {
      changes.push({
        type: 'reversal',
        date: series[i].date,
        description: `Trend reversed from ${beforeMomentum > 0 ? 'growth' : 'decline'} to ${afterMomentum > 0 ? 'growth' : 'decline'}`,
        magnitude: Math.abs(momentumChange),
      });
    }
    // Acceleration: momentum increases significantly
    else if (momentumChange > 15 && beforeMomentum > 0) {
      changes.push({
        type: 'acceleration',
        date: series[i].date,
        description: `Growth accelerated by ${Math.round(momentumChange)}%`,
        magnitude: momentumChange,
      });
    }
    // Deceleration: momentum decreases significantly
    else if (momentumChange < -15 && afterMomentum > 0) {
      changes.push({
        type: 'deceleration',
        date: series[i].date,
        description: `Growth slowed by ${Math.round(Math.abs(momentumChange))}%`,
        magnitude: Math.abs(momentumChange),
      });
    }
  }

  // Return most significant changes (top 3)
  return changes
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, 3);
}
