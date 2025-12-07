/**
 * Seasonal Pattern Detection
 * Detects recurring patterns at fixed intervals (annual, monthly, weekly)
 * NO HARDCODED KEYWORD RULES - Pure data analysis
 */

import type { EnrichedDataPoint, SeasonalPattern } from '../core/types';
import { calculateMean, calculateStdDev, calculateCorrelation } from '../core/statistics';
import {
  enrichWithTemporalFeatures,
  groupByMonth,
  groupByDayOfWeek,
  groupByQuarter,
  getMonthName,
  getDayName,
  getQuarterName,
} from '../core/temporal';

/**
 * Main seasonal detection function
 * Works for ANY keyword without hardcoding
 */
export function detectSeasonalPatterns(
  series: EnrichedDataPoint[],
  term: string,
  minConfidence: number = 0.7
): SeasonalPattern[] {
  const patterns: SeasonalPattern[] = [];

  // Only detect seasonality if we have enough data
  if (series.length < 60) {
    return patterns; // Need at least 2 months of data
  }

  // Detect different seasonal periods
  const annualPattern = detectAnnualSeasonality(series, term, minConfidence);
  if (annualPattern) patterns.push(annualPattern);

  const quarterlyPattern = detectQuarterlySeasonality(series, term, minConfidence);
  if (quarterlyPattern) patterns.push(quarterlyPattern);

  const weeklyPattern = detectWeeklySeasonality(series, term, minConfidence);
  if (weeklyPattern) patterns.push(weeklyPattern);

  return patterns;
}

/**
 * Detect annual seasonality (monthly patterns)
 */
function detectAnnualSeasonality(
  series: EnrichedDataPoint[],
  term: string,
  minConfidence: number
): SeasonalPattern | null {
  // Need at least 6 months of data
  if (series.length < 180) return null;

  // Group by month and calculate averages
  const monthlyData = groupByMonth(series, term);

  if (monthlyData.size < 6) return null; // Need data from at least 6 different months

  // Calculate average for each month
  const monthlyAverages = Array.from(monthlyData.entries()).map(([month, values]) => ({
    month,
    average: calculateMean(values),
    stdDev: calculateStdDev(values),
    count: values.length,
    consistency: calculateConsistency(values),
  }));

  // Calculate overall baseline
  const overallMean = calculateMean(monthlyAverages.map(m => m.average));
  const overallStdDev = calculateStdDev(monthlyAverages.map(m => m.average));

  // Find peak months (significantly above average)
  const peakMonths = monthlyAverages.filter(m => {
    const zScore = (m.average - overallMean) / (overallStdDev || 1);
    return zScore > 1.0 && m.consistency > minConfidence;
  });

  // Need at least one clear peak to consider it seasonal
  if (peakMonths.length === 0) return null;

  // Sort peaks by strength
  peakMonths.sort((a, b) => b.average - a.average);

  // Calculate cyclical strength (how repeatable is this pattern?)
  const cyclicStrength = calculateCyclicStrength(monthlyData, term);

  if (cyclicStrength < minConfidence) return null;

  // Build pattern description
  const topPeak = peakMonths[0];
  const increasePercent = Math.round(((topPeak.average - overallMean) / overallMean) * 100);

  return {
    type: 'seasonal',
    period: 'annual',
    peakPeriods: peakMonths.slice(0, 3).map(p => ({
      name: getMonthName(p.month),
      value: p.month,
      avgIncrease: Math.round(((p.average - overallMean) / overallMean) * 100),
    })),
    cyclicStrength,
    confidence: Math.round(cyclicStrength * 100),
    strength: increasePercent,
    description: `Consistently ${increasePercent}% higher during ${getMonthName(topPeak.month)}`,
    dataPoints: [], // Could add specific indices if needed
    metadata: {
      overallMean,
      peakMonth: topPeak.month,
      monthlyData: monthlyAverages,
    },
  };
}

/**
 * Detect quarterly seasonality
 */
function detectQuarterlySeasonality(
  series: EnrichedDataPoint[],
  term: string,
  minConfidence: number
): SeasonalPattern | null {
  // Need at least 6 months of data
  if (series.length < 180) return null;

  const quarterlyData = groupByQuarter(series, term);

  if (quarterlyData.size < 3) return null;

  const quarterlyAverages = Array.from(quarterlyData.entries()).map(([quarter, values]) => ({
    quarter,
    average: calculateMean(values),
    consistency: calculateConsistency(values),
  }));

  const overallMean = calculateMean(quarterlyAverages.map(q => q.average));
  const overallStdDev = calculateStdDev(quarterlyAverages.map(q => q.average));

  // Find peak quarters
  const peakQuarters = quarterlyAverages.filter(q => {
    const zScore = (q.average - overallMean) / (overallStdDev || 1);
    return zScore > 1.0 && q.consistency > minConfidence;
  });

  if (peakQuarters.length === 0) return null;

  peakQuarters.sort((a, b) => b.average - a.average);
  const topPeak = peakQuarters[0];
  const increasePercent = Math.round(((topPeak.average - overallMean) / overallMean) * 100);

  return {
    type: 'seasonal',
    period: 'quarterly',
    peakPeriods: peakQuarters.map(q => ({
      name: getQuarterName(q.quarter),
      value: q.quarter,
      avgIncrease: Math.round(((q.average - overallMean) / overallMean) * 100),
    })),
    cyclicStrength: topPeak.consistency,
    confidence: Math.round(topPeak.consistency * 100),
    strength: increasePercent,
    description: `Peaks during ${getQuarterName(topPeak.quarter)} (${increasePercent}% above average)`,
    dataPoints: [],
    metadata: {
      overallMean,
      quarterlyData: quarterlyAverages,
    },
  };
}

/**
 * Detect weekly seasonality (day-of-week patterns)
 */
function detectWeeklySeasonality(
  series: EnrichedDataPoint[],
  term: string,
  minConfidence: number
): SeasonalPattern | null {
  // Need at least 4 weeks of data
  if (series.length < 28) return null;

  const weeklyData = groupByDayOfWeek(series, term);

  if (weeklyData.size < 7) return null;

  const dailyAverages = Array.from(weeklyData.entries()).map(([day, values]) => ({
    day,
    average: calculateMean(values),
    consistency: calculateConsistency(values),
  }));

  const overallMean = calculateMean(dailyAverages.map(d => d.average));
  const overallStdDev = calculateStdDev(dailyAverages.map(d => d.average));

  // Find peak days
  const peakDays = dailyAverages.filter(d => {
    const zScore = (d.average - overallMean) / (overallStdDev || 1);
    return zScore > 0.5 && d.consistency > minConfidence;
  });

  // Also find low days (for complete pattern)
  const lowDays = dailyAverages.filter(d => {
    const zScore = (d.average - overallMean) / (overallStdDev || 1);
    return zScore < -0.5 && d.consistency > minConfidence;
  });

  // Need significant variation to call it a pattern
  if (peakDays.length === 0 || overallStdDev < overallMean * 0.1) return null;

  peakDays.sort((a, b) => b.average - a.average);
  const topPeak = peakDays[0];
  const increasePercent = Math.round(((topPeak.average - overallMean) / overallMean) * 100);

  // Build description
  const peakDayNames = peakDays.map(d => getDayName(d.day));
  const lowDayNames = lowDays.map(d => getDayName(d.day));

  let description = `${increasePercent}% higher on ${peakDayNames.join(', ')}`;
  if (lowDayNames.length > 0) {
    description += `, lower on ${lowDayNames.join(', ')}`;
  }

  return {
    type: 'seasonal',
    period: 'weekly',
    peakPeriods: peakDays.map(d => ({
      name: getDayName(d.day),
      value: d.day,
      avgIncrease: Math.round(((d.average - overallMean) / overallMean) * 100),
    })),
    cyclicStrength: topPeak.consistency,
    confidence: Math.round(topPeak.consistency * 100),
    strength: increasePercent,
    description,
    dataPoints: [],
    metadata: {
      overallMean,
      dailyData: dailyAverages,
      peakDays: peakDayNames,
      lowDays: lowDayNames,
    },
  };
}

/**
 * Calculate consistency (how reliable is this pattern?)
 * Returns 0-1, where 1 = very consistent
 */
function calculateConsistency(values: number[]): number {
  if (values.length < 2) return 0;

  const mean = calculateMean(values);
  const stdDev = calculateStdDev(values);

  // Coefficient of variation (normalized volatility)
  const cv = mean === 0 ? 1 : stdDev / Math.abs(mean);

  // Convert to consistency score (inverse of volatility)
  // Lower CV = higher consistency
  return Math.max(0, 1 - Math.min(cv, 1));
}

/**
 * Calculate cyclic strength (how repeatable across cycles?)
 * Uses autocorrelation
 */
function calculateCyclicStrength(
  groupedData: Map<number, number[]>,
  term: string
): number {
  // Get averages per period
  const averages = Array.from(groupedData.values()).map(calculateMean);

  if (averages.length < 3) return 0;

  // Calculate consistency across cycles
  const consistencies = Array.from(groupedData.values()).map(calculateConsistency);
  const avgConsistency = calculateMean(consistencies);

  // Also check if pattern repeats (using correlation if we have multiple cycles)
  // For now, use average consistency as proxy
  return avgConsistency;
}

/**
 * Determine if a seasonal pattern is significant
 */
export function isSignificantSeasonalPattern(pattern: SeasonalPattern): boolean {
  return (
    pattern.confidence >= 70 &&
    pattern.strength >= 15 &&
    pattern.cyclicStrength >= 0.6
  );
}
