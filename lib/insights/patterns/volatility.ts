/**
 * Volatility & Stability Analysis
 * Measures how stable or erratic the data is
 * Uses statistical methods - NO keyword-specific rules
 */

import type { EnrichedDataPoint } from '../core/types';
import {
  calculateMean,
  calculateStdDev,
  calculateMedian,
  rollingAverage,
} from '../core/statistics';

export type VolatilityLevel = 'very-stable' | 'stable' | 'moderate' | 'volatile' | 'highly-volatile';

export type VolatilityMetrics = {
  level: VolatilityLevel;
  coefficientOfVariation: number; // Main metric (stdDev / mean)
  avgDailyChange: number; // Average % change day-to-day
  maxSwing: number; // Largest single-day % change
  stability: number; // 0-100 (inverse of volatility)
  consistency: number; // 0-100 (how predictable)
  description: string;
  riskScore: number; // 0-100 (higher = riskier)
  metadata: {
    stdDev: number;
    mean: number;
    median: number;
    range: number;
    outlierCount: number;
  };
};

/**
 * Analyze volatility for a single term
 */
export function analyzeVolatility(
  series: EnrichedDataPoint[],
  term: string
): VolatilityMetrics | null {
  if (series.length < 7) return null;

  const values = series.map(p => p[term] as number);

  // Core statistics
  const mean = calculateMean(values);
  const stdDev = calculateStdDev(values);
  const median = calculateMedian(values);

  // Coefficient of Variation (CV) - primary volatility metric
  const coefficientOfVariation = mean === 0 ? 0 : (stdDev / mean) * 100;

  // Average daily change
  const dailyChanges = calculateDailyChanges(values);
  const avgDailyChange = calculateMean(dailyChanges.map(Math.abs));

  // Maximum swing (largest single change)
  const maxSwing = Math.max(...dailyChanges.map(Math.abs));

  // Range
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  // Count outliers (values > 2 std dev from mean)
  const outlierCount = values.filter(v => Math.abs(v - mean) > 2 * stdDev).length;

  // Classify volatility level
  const level = classifyVolatility(coefficientOfVariation, avgDailyChange);

  // Stability score (0-100, inverse of volatility)
  const stability = calculateStability(coefficientOfVariation, avgDailyChange);

  // Consistency score (how predictable is the pattern?)
  const consistency = calculateConsistency(values);

  // Risk score (combines multiple factors)
  const riskScore = calculateRiskScore(coefficientOfVariation, maxSwing, outlierCount, values.length);

  return {
    level,
    coefficientOfVariation,
    avgDailyChange,
    maxSwing,
    stability: Math.round(stability),
    consistency: Math.round(consistency),
    description: generateVolatilityDescription(level, coefficientOfVariation, avgDailyChange),
    riskScore: Math.round(riskScore),
    metadata: {
      stdDev,
      mean,
      median,
      range,
      outlierCount,
    },
  };
}

/**
 * Compare volatility between two terms
 */
export function compareVolatility(
  series: EnrichedDataPoint[],
  termA: string,
  termB: string
): {
  moreStable: string;
  stabilitygap: number;
  description: string;
} | null {
  const volA = analyzeVolatility(series, termA);
  const volB = analyzeVolatility(series, termB);

  if (!volA || !volB) return null;

  const moreStable = volA.stability > volB.stability ? termA : termB;
  const stabilitygap = Math.abs(volA.stability - volB.stability);

  return {
    moreStable,
    stabilitygap: Math.round(stabilitygap),
    description: generateComparisonDescription(termA, termB, volA, volB),
  };
}

/**
 * Detect periods of high/low volatility
 */
export function detectVolatilityPeriods(
  series: EnrichedDataPoint[],
  term: string,
  windowSize: number = 30
): Array<{
  type: 'high-volatility' | 'low-volatility';
  startDate: string;
  endDate: string;
  avgVolatility: number;
  description: string;
}> {
  if (series.length < windowSize * 2) return [];

  const periods: Array<{
    type: 'high-volatility' | 'low-volatility';
    startDate: string;
    endDate: string;
    avgVolatility: number;
    description: string;
  }> = [];

  // Analyze in rolling windows
  for (let i = 0; i <= series.length - windowSize; i += Math.floor(windowSize / 2)) {
    const window = series.slice(i, i + windowSize);
    const values = window.map(p => p[term] as number);

    const mean = calculateMean(values);
    const stdDev = calculateStdDev(values);
    const cv = mean === 0 ? 0 : (stdDev / mean) * 100;

    // Classify this period
    if (cv > 40) {
      periods.push({
        type: 'high-volatility',
        startDate: window[0].date,
        endDate: window[window.length - 1].date,
        avgVolatility: cv,
        description: `High volatility period with ${Math.round(cv)}% variation`,
      });
    } else if (cv < 15) {
      periods.push({
        type: 'low-volatility',
        startDate: window[0].date,
        endDate: window[window.length - 1].date,
        avgVolatility: cv,
        description: `Stable period with ${Math.round(cv)}% variation`,
      });
    }
  }

  // Return most extreme periods (top 3)
  return periods
    .sort((a, b) => {
      if (a.type === b.type) {
        return a.type === 'high-volatility'
          ? b.avgVolatility - a.avgVolatility
          : a.avgVolatility - b.avgVolatility;
      }
      return 0;
    })
    .slice(0, 3);
}

/**
 * Calculate daily changes (% change from previous day)
 */
function calculateDailyChanges(values: number[]): number[] {
  const changes: number[] = [];

  for (let i = 1; i < values.length; i++) {
    const prev = values[i - 1];
    const curr = values[i];

    if (prev === 0) {
      changes.push(0);
    } else {
      changes.push(((curr - prev) / prev) * 100);
    }
  }

  return changes;
}

/**
 * Classify volatility level based on CV and average daily change
 */
function classifyVolatility(cv: number, avgDailyChange: number): VolatilityLevel {
  // Coefficient of Variation is primary indicator
  if (cv > 50 || avgDailyChange > 15) return 'highly-volatile';
  if (cv > 35 || avgDailyChange > 10) return 'volatile';
  if (cv > 20 || avgDailyChange > 5) return 'moderate';
  if (cv > 10 || avgDailyChange > 2) return 'stable';
  return 'very-stable';
}

/**
 * Calculate stability score (0-100)
 * Higher = more stable
 */
function calculateStability(cv: number, avgDailyChange: number): number {
  // Stability decreases as CV and daily changes increase
  const cvScore = Math.max(0, 100 - cv);
  const dailyChangeScore = Math.max(0, 100 - (avgDailyChange * 5));

  // Weighted average (CV is more important)
  return (cvScore * 0.7) + (dailyChangeScore * 0.3);
}

/**
 * Calculate consistency score (0-100)
 * Measures how predictable the pattern is
 */
function calculateConsistency(values: number[]): number {
  if (values.length < 14) return 50;

  // Compare actual values to rolling average
  const smoothed = rollingAverage(values, 7);
  let totalDeviation = 0;

  for (let i = 0; i < values.length; i++) {
    const expected = smoothed[i] ?? values[i];
    const actual = values[i];
    const deviation = Math.abs(actual - expected) / Math.max(expected, 1);
    totalDeviation += deviation;
  }

  const avgDeviation = totalDeviation / values.length;

  // Lower deviation = higher consistency
  return Math.max(0, 100 - (avgDeviation * 100));
}

/**
 * Calculate risk score (0-100)
 * Higher = riskier / less reliable data
 */
function calculateRiskScore(
  cv: number,
  maxSwing: number,
  outlierCount: number,
  totalPoints: number
): number {
  // Risk factors:
  // 1. High CV (40%)
  // 2. Large max swing (30%)
  // 3. Many outliers (30%)

  const cvRisk = Math.min(100, cv * 2); // CV > 50 = max risk
  const swingRisk = Math.min(100, maxSwing * 2); // Swing > 50% = max risk
  const outlierRatio = (outlierCount / totalPoints) * 100;
  const outlierRisk = Math.min(100, outlierRatio * 10); // > 10% outliers = max risk

  return (cvRisk * 0.4) + (swingRisk * 0.3) + (outlierRisk * 0.3);
}

/**
 * Generate volatility description
 */
function generateVolatilityDescription(
  level: VolatilityLevel,
  cv: number,
  avgDailyChange: number
): string {
  const cvRounded = Math.round(cv);
  const changeRounded = Math.round(avgDailyChange);

  switch (level) {
    case 'highly-volatile':
      return `Highly volatile with ${cvRounded}% variation and ${changeRounded}% average daily swings`;

    case 'volatile':
      return `Volatile data showing ${cvRounded}% variation with frequent fluctuations`;

    case 'moderate':
      return `Moderate volatility with ${cvRounded}% variation and ${changeRounded}% daily changes`;

    case 'stable':
      return `Relatively stable with ${cvRounded}% variation and consistent patterns`;

    case 'very-stable':
      return `Very stable data with minimal variation (${cvRounded}%)`;

    default:
      return `Volatility: ${cvRounded}%`;
  }
}

/**
 * Generate comparison description
 */
function generateComparisonDescription(
  termA: string,
  termB: string,
  volA: VolatilityMetrics,
  volB: VolatilityMetrics
): string {
  const moreStable = volA.stability > volB.stability ? termA : termB;
  const lessStable = volA.stability > volB.stability ? termB : termA;

  const gap = Math.abs(volA.stability - volB.stability);

  if (gap < 10) {
    return `Both terms show similar volatility levels (${volA.level} vs ${volB.level})`;
  }

  return `${moreStable} is significantly more stable than ${lessStable} (${Math.round(gap)}% difference)`;
}

/**
 * Calculate Bollinger Bands (volatility bands around moving average)
 * Useful for detecting when values break out of normal range
 */
export function calculateBollingerBands(
  values: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): Array<{
  middle: number; // Moving average
  upper: number; // Upper band
  lower: number; // Lower band
  bandwidth: number; // Width of bands (volatility indicator)
}> {
  if (values.length < period) return [];

  const bands: Array<{
    middle: number;
    upper: number;
    lower: number;
    bandwidth: number;
  }> = [];

  for (let i = period - 1; i < values.length; i++) {
    const window = values.slice(i - period + 1, i + 1);
    const mean = calculateMean(window);
    const stdDev = calculateStdDev(window);

    const upper = mean + (stdDevMultiplier * stdDev);
    const lower = mean - (stdDevMultiplier * stdDev);
    const bandwidth = ((upper - lower) / mean) * 100;

    bands.push({
      middle: mean,
      upper,
      lower,
      bandwidth,
    });
  }

  return bands;
}

/**
 * Detect when values break out of Bollinger Bands
 * (Indicates unusual volatility or trend change)
 */
export function detectBollingerBreakouts(
  series: EnrichedDataPoint[],
  term: string,
  period: number = 20
): Array<{
  type: 'upper-breakout' | 'lower-breakout';
  date: string;
  value: number;
  bandValue: number;
  magnitude: number;
  description: string;
}> {
  if (series.length < period + 5) return [];

  const values = series.map(p => p[term] as number);
  const bands = calculateBollingerBands(values, period);

  const breakouts: Array<{
    type: 'upper-breakout' | 'lower-breakout';
    date: string;
    value: number;
    bandValue: number;
    magnitude: number;
    description: string;
  }> = [];

  // Check each point that has bands calculated
  for (let i = 0; i < bands.length; i++) {
    const dataIndex = i + period - 1;
    const value = values[dataIndex];
    const band = bands[i];

    // Upper breakout
    if (value > band.upper) {
      const magnitude = ((value - band.upper) / band.upper) * 100;
      breakouts.push({
        type: 'upper-breakout',
        date: series[dataIndex].date,
        value,
        bandValue: band.upper,
        magnitude,
        description: `Broke above upper band by ${Math.round(magnitude)}%`,
      });
    }
    // Lower breakout
    else if (value < band.lower) {
      const magnitude = ((band.lower - value) / band.lower) * 100;
      breakouts.push({
        type: 'lower-breakout',
        date: series[dataIndex].date,
        value,
        bandValue: band.lower,
        magnitude,
        description: `Broke below lower band by ${Math.round(magnitude)}%`,
      });
    }
  }

  // Return most significant breakouts (top 5)
  return breakouts
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, 5);
}
