/**
 * Stage A: Generate Signals from comparison data
 * 
 * Deterministic, pure function that analyzes time series, scores, and anomalies
 * to produce Signal objects matching the contracts.
 */

import type { Signal, SignalType, SignalSeverity } from './contracts/signals';
import type { SeriesPoint } from '../trends';
import type { TrendArcScore } from '../trendarc-score';
import { INSIGHT_VERSION } from './contracts/versions';
import { stableHash } from '../cache/hash';
import { memoize } from '@/lib/utils/memoize';

export interface GenerateSignalsInput {
  termA: string;
  termB: string;
  timeframe: string;
  series: SeriesPoint[];
  scores: {
    termA: TrendArcScore;
    termB: TrendArcScore;
  };
  anomalies?: {
    termA?: Array<{ date: string; value: number; type: string }>;
    termB?: Array<{ date: string; value: number; type: string }>;
  };
  peaks?: {
    termA?: Array<{ date: string; magnitude: number; duration: number }>;
    termB?: Array<{ date: string; magnitude: number; duration: number }>;
  };
  forecastSummary?: {
    termA?: { direction: 'rising' | 'falling' | 'stable'; confidence: number };
    termB?: { direction: 'rising' | 'falling' | 'stable'; confidence: number };
  };
  dataSource: string;
  lastUpdatedAt: string;
}

/**
 * Generate all signals from comparison data (internal, not memoized)
 */
function generateSignalsInternal(input: GenerateSignalsInput): Signal[] {
  const signals: Signal[] = [];
  const now = new Date().toISOString();
  const { termA, termB, series, scores, anomalies, peaks, forecastSummary, dataSource, lastUpdatedAt } = input;

  // Extract time series values
  const seriesA = extractSeriesValues(series, termA);
  const seriesB = extractSeriesValues(series, termB);

  // 1. Momentum shift signals
  signals.push(...detectMomentumShifts(termA, termB, seriesA, seriesB, scores, now, dataSource, lastUpdatedAt));

  // 2. Volatility spike signals
  signals.push(...detectVolatilitySpikes(termA, termB, seriesA, seriesB, now, dataSource, lastUpdatedAt));

  // 3. Correlation change signals
  signals.push(...detectCorrelationChanges(termA, termB, seriesA, seriesB, now, dataSource, lastUpdatedAt));

  // 4. Competitor crossover signals
  signals.push(...detectCompetitorCrossovers(termA, termB, seriesA, seriesB, scores, now, dataSource, lastUpdatedAt));

  // 5. Seasonal pattern signals
  signals.push(...detectSeasonalPatterns(termA, termB, seriesA, seriesB, now, dataSource, lastUpdatedAt));

  // 6. Anomaly signals
  if (anomalies) {
    signals.push(...detectAnomalies(termA, termB, anomalies, now, dataSource, lastUpdatedAt));
  }

  // 7. Volume surge signals (from forecast if available)
  if (forecastSummary) {
    signals.push(...detectVolumeSurges(termA, termB, forecastSummary, now, dataSource, lastUpdatedAt));
  }

  return signals;
}

/**
 * Memoized version of generateSignals
 * Memoized with 5-minute TTL
 */
export const generateSignals = memoize(
  generateSignalsInternal,
  5 * 60 * 1000, // 5 minutes TTL
  (input) => stableHash(input)
);

/**
 * Extract time series values for a term
 */
function extractSeriesValues(series: SeriesPoint[], term: string): Array<{ date: string; value: number }> {
  if (!series || series.length === 0) return [];

  // Find matching key in series
  const firstPoint = series[0];
  if (!firstPoint || typeof firstPoint !== 'object') return [];

  const availableKeys = Object.keys(firstPoint).filter(k => k !== 'date');
  const normalizeKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, '');

  const termKey = availableKeys.find(k => {
    const keyNormalized = normalizeKey(k);
    const termNormalized = normalizeKey(term);
    return (
      k.toLowerCase() === term.toLowerCase() ||
      keyNormalized === termNormalized ||
      k.toLowerCase().replace(/\s+/g, '-') === term.toLowerCase() ||
      k.toLowerCase().replace(/-/g, ' ') === term.toLowerCase()
    );
  });

  if (!termKey) return [];

  return series
    .map(point => ({
      date: String(point.date),
      value: Number(point[termKey] || 0),
    }))
    .filter(p => isFinite(p.value));
}

/**
 * Detect momentum shifts
 */
function detectMomentumShifts(
  termA: string,
  termB: string,
  seriesA: Array<{ date: string; value: number }>,
  seriesB: Array<{ date: string; value: number }>,
  scores: { termA: TrendArcScore; termB: TrendArcScore },
  generatedAt: string,
  dataSource: string,
  lastUpdatedAt: string
): Signal[] {
  const signals: Signal[] = [];

  if (seriesA.length < 2 || seriesB.length < 2) return signals;

  // Calculate momentum for each term
  const momentumA = calculateMomentum(seriesA);
  const momentumB = calculateMomentum(seriesB);

  // Detect significant momentum shift for termA
  if (Math.abs(momentumA) > 15) {
    const severity: SignalSeverity = Math.abs(momentumA) > 30 ? 'high' : Math.abs(momentumA) > 20 ? 'medium' : 'low';
    signals.push({
      id: `momentum-${termA}-${stableHash({ term: termA, momentum: momentumA, generatedAt })}`,
      type: 'momentum_shift',
      severity,
      term: 'termA',
      description: momentumA > 0
        ? `${termA} showing strong upward momentum (${momentumA.toFixed(1)}% change)`
        : `${termA} showing downward momentum (${momentumA.toFixed(1)}% change)`,
      detectedAt: seriesA[seriesA.length - 1].date,
      confidence: Math.min(95, 60 + Math.abs(momentumA) * 0.5),
      dataPoints: seriesA.slice(-10), // Last 10 points
      source: {
        provider: dataSource,
        lastUpdatedAt,
      },
      generatedAt,
    });
  }

  // Detect significant momentum shift for termB
  if (Math.abs(momentumB) > 15) {
    const severity: SignalSeverity = Math.abs(momentumB) > 30 ? 'high' : Math.abs(momentumB) > 20 ? 'medium' : 'low';
    signals.push({
      id: `momentum-${termB}-${stableHash({ term: termB, momentum: momentumB, generatedAt })}`,
      type: 'momentum_shift',
      severity,
      term: 'termB',
      description: momentumB > 0
        ? `${termB} showing strong upward momentum (${momentumB.toFixed(1)}% change)`
        : `${termB} showing downward momentum (${momentumB.toFixed(1)}% change)`,
      detectedAt: seriesB[seriesB.length - 1].date,
      confidence: Math.min(95, 60 + Math.abs(momentumB) * 0.5),
      dataPoints: seriesB.slice(-10),
      source: {
        provider: dataSource,
        lastUpdatedAt,
      },
      generatedAt,
    });
  }

  // Detect momentum divergence (both terms moving in opposite directions)
  if ((momentumA > 10 && momentumB < -10) || (momentumA < -10 && momentumB > 10)) {
    signals.push({
      id: `momentum-divergence-${stableHash({ termA, termB, momentumA, momentumB, generatedAt })}`,
      type: 'momentum_shift',
      severity: 'high',
      term: 'both',
      description: `Momentum divergence: ${termA} ${momentumA > 0 ? 'rising' : 'falling'} while ${termB} ${momentumB > 0 ? 'rising' : 'falling'}`,
      detectedAt: seriesA[seriesA.length - 1].date,
      confidence: 75,
      source: {
        provider: dataSource,
        lastUpdatedAt,
      },
      generatedAt,
    });
  }

  return signals;
}

/**
 * Calculate momentum (percentage change over recent period)
 */
function calculateMomentum(series: Array<{ date: string; value: number }>): number {
  if (series.length < 2) return 0;

  const recent = series.slice(-7); // Last 7 points
  const older = series.slice(-14, -7); // Previous 7 points

  if (older.length === 0) {
    // Compare first half vs second half of recent period
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));

    if (firstHalf.length === 0 || secondHalf.length === 0) return 0;

    const avgFirst = firstHalf.reduce((sum, p) => sum + p.value, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, p) => sum + p.value, 0) / secondHalf.length;

    if (avgFirst === 0) return avgSecond > 0 ? 100 : -100;
    return ((avgSecond - avgFirst) / avgFirst) * 100;
  }

  const avgOlder = older.reduce((sum, p) => sum + p.value, 0) / older.length;
  const avgRecent = recent.reduce((sum, p) => sum + p.value, 0) / recent.length;

  if (avgOlder === 0) return avgRecent > 0 ? 100 : -100;
  return ((avgRecent - avgOlder) / avgOlder) * 100;
}

/**
 * Detect volatility spikes
 */
function detectVolatilitySpikes(
  termA: string,
  termB: string,
  seriesA: Array<{ date: string; value: number }>,
  seriesB: Array<{ date: string; value: number }>,
  generatedAt: string,
  dataSource: string,
  lastUpdatedAt: string
): Signal[] {
  const signals: Signal[] = [];

  const volatilityA = calculateVolatility(seriesA);
  const volatilityB = calculateVolatility(seriesB);

  // High volatility threshold: coefficient of variation > 0.5
  if (volatilityA > 0.5) {
    const severity: SignalSeverity = volatilityA > 1.0 ? 'high' : volatilityA > 0.7 ? 'medium' : 'low';
    signals.push({
      id: `volatility-${termA}-${stableHash({ term: termA, volatility: volatilityA, generatedAt })}`,
      type: 'volatility_spike',
      severity,
      term: 'termA',
      description: `${termA} showing high volatility (CV: ${volatilityA.toFixed(2)})`,
      detectedAt: seriesA[seriesA.length - 1]?.date || new Date().toISOString(),
      confidence: Math.min(90, 50 + volatilityA * 20),
      source: {
        provider: dataSource,
        lastUpdatedAt,
      },
      generatedAt,
    });
  }

  if (volatilityB > 0.5) {
    const severity: SignalSeverity = volatilityB > 1.0 ? 'high' : volatilityB > 0.7 ? 'medium' : 'low';
    signals.push({
      id: `volatility-${termB}-${stableHash({ term: termB, volatility: volatilityB, generatedAt })}`,
      type: 'volatility_spike',
      severity,
      term: 'termB',
      description: `${termB} showing high volatility (CV: ${volatilityB.toFixed(2)})`,
      detectedAt: seriesB[seriesB.length - 1]?.date || new Date().toISOString(),
      confidence: Math.min(90, 50 + volatilityB * 20),
      source: {
        provider: dataSource,
        lastUpdatedAt,
      },
      generatedAt,
    });
  }

  return signals;
}

/**
 * Calculate volatility (coefficient of variation)
 */
function calculateVolatility(series: Array<{ date: string; value: number }>): number {
  if (series.length < 2) return 0;

  const values = series.map(p => p.value);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  if (mean === 0) return 0;

  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return stdDev / mean; // Coefficient of variation
}

/**
 * Detect correlation changes
 */
function detectCorrelationChanges(
  termA: string,
  termB: string,
  seriesA: Array<{ date: string; value: number }>,
  seriesB: Array<{ date: string; value: number }>,
  generatedAt: string,
  dataSource: string,
  lastUpdatedAt: string
): Signal[] {
  const signals: Signal[] = [];

  if (seriesA.length < 10 || seriesB.length < 10) return signals;

  // Calculate correlation over recent vs older period
  const recentCorrelation = calculateCorrelation(
    seriesA.slice(-10),
    seriesB.slice(-10)
  );
  const olderCorrelation = calculateCorrelation(
    seriesA.slice(-20, -10),
    seriesB.slice(-20, -10)
  );

  // Detect significant correlation change
  const correlationChange = Math.abs(recentCorrelation - olderCorrelation);
  if (correlationChange > 0.3) {
    const severity: SignalSeverity = correlationChange > 0.5 ? 'high' : 'medium';
    signals.push({
      id: `correlation-${stableHash({ termA, termB, change: correlationChange, generatedAt })}`,
      type: 'correlation_change',
      severity,
      term: 'both',
      description: `Correlation between ${termA} and ${termB} changed by ${correlationChange.toFixed(2)} (from ${olderCorrelation.toFixed(2)} to ${recentCorrelation.toFixed(2)})`,
      detectedAt: seriesA[seriesA.length - 1]?.date || new Date().toISOString(),
      confidence: Math.min(90, 60 + correlationChange * 50),
      source: {
        provider: dataSource,
        lastUpdatedAt,
      },
      generatedAt,
    });
  }

  return signals;
}

/**
 * Calculate Pearson correlation coefficient
 */
function calculateCorrelation(
  seriesA: Array<{ date: string; value: number }>,
  seriesB: Array<{ date: string; value: number }>
): number {
  if (seriesA.length !== seriesB.length || seriesA.length < 2) return 0;

  // Align by date
  const aligned: Array<{ a: number; b: number }> = [];
  const dateMapA = new Map(seriesA.map(p => [p.date, p.value]));
  const dateMapB = new Map(seriesB.map(p => [p.date, p.value]));

  for (const date of dateMapA.keys()) {
    if (dateMapB.has(date)) {
      aligned.push({ a: dateMapA.get(date)!, b: dateMapB.get(date)! });
    }
  }

  if (aligned.length < 2) return 0;

  const meanA = aligned.reduce((sum, p) => sum + p.a, 0) / aligned.length;
  const meanB = aligned.reduce((sum, p) => sum + p.b, 0) / aligned.length;

  let numerator = 0;
  let sumSqA = 0;
  let sumSqB = 0;

  for (const { a, b } of aligned) {
    const diffA = a - meanA;
    const diffB = b - meanB;
    numerator += diffA * diffB;
    sumSqA += diffA * diffA;
    sumSqB += diffB * diffB;
  }

  const denominator = Math.sqrt(sumSqA * sumSqB);
  if (denominator === 0) return 0;

  return numerator / denominator;
}

/**
 * Detect competitor crossovers
 */
function detectCompetitorCrossovers(
  termA: string,
  termB: string,
  seriesA: Array<{ date: string; value: number }>,
  seriesB: Array<{ date: string; value: number }>,
  scores: { termA: TrendArcScore; termB: TrendArcScore },
  generatedAt: string,
  dataSource: string,
  lastUpdatedAt: string
): Signal[] {
  const signals: Signal[] = [];

  if (seriesA.length < 2 || seriesB.length < 2) return signals;

  // Check if scores crossed over
  const currentWinner = scores.termA.overall >= scores.termB.overall ? 'termA' : 'termB';
  
  // Check recent trend in series
  const recentA = seriesA.slice(-5);
  const recentB = seriesB.slice(-5);
  const avgA = recentA.reduce((sum, p) => sum + p.value, 0) / recentA.length;
  const avgB = recentB.reduce((sum, p) => sum + p.value, 0) / recentB.length;

  // Detect if series values crossed over
  const olderA = seriesA.slice(-10, -5);
  const olderB = seriesB.slice(-10, -5);
  if (olderA.length > 0 && olderB.length > 0) {
    const olderAvgA = olderA.reduce((sum, p) => sum + p.value, 0) / olderA.length;
    const olderAvgB = olderB.reduce((sum, p) => sum + p.value, 0) / olderB.length;

    const wasAhead = olderAvgA >= olderAvgB;
    const isAhead = avgA >= avgB;

    if (wasAhead !== isAhead) {
      const severity: SignalSeverity = Math.abs(avgA - avgB) > 10 ? 'high' : 'medium';
      signals.push({
        id: `crossover-${stableHash({ termA, termB, generatedAt })}`,
        type: 'competitor_crossover',
        severity,
        term: 'both',
        description: `${isAhead ? termA : termB} has overtaken ${isAhead ? termB : termA} in recent trend`,
        detectedAt: seriesA[seriesA.length - 1]?.date || new Date().toISOString(),
        confidence: 70,
        dataPoints: [
          ...recentA.map(p => ({ date: p.date, value: p.value })),
          ...recentB.map(p => ({ date: p.date, value: p.value })),
        ],
        source: {
          provider: dataSource,
          lastUpdatedAt,
        },
        generatedAt,
      });
    }
  }

  return signals;
}

/**
 * Detect seasonal patterns
 */
function detectSeasonalPatterns(
  termA: string,
  termB: string,
  seriesA: Array<{ date: string; value: number }>,
  seriesB: Array<{ date: string; value: number }>,
  generatedAt: string,
  dataSource: string,
  lastUpdatedAt: string
): Signal[] {
  const signals: Signal[] = [];

  // Need at least 12 months of data for seasonal detection
  if (seriesA.length < 12 || seriesB.length < 12) return signals;

  const seasonalityA = detectSeasonality(seriesA);
  const seasonalityB = detectSeasonality(seriesB);

  if (seasonalityA > 0.3) {
    signals.push({
      id: `seasonal-${termA}-${stableHash({ term: termA, seasonality: seasonalityA, generatedAt })}`,
      type: 'seasonal_pattern',
      severity: seasonalityA > 0.6 ? 'high' : 'medium',
      term: 'termA',
      description: `${termA} shows seasonal pattern (strength: ${seasonalityA.toFixed(2)})`,
      detectedAt: seriesA[seriesA.length - 1]?.date || new Date().toISOString(),
      confidence: Math.min(85, 50 + seasonalityA * 50),
      source: {
        provider: dataSource,
        lastUpdatedAt,
      },
      generatedAt,
    });
  }

  if (seasonalityB > 0.3) {
    signals.push({
      id: `seasonal-${termB}-${stableHash({ term: termB, seasonality: seasonalityB, generatedAt })}`,
      type: 'seasonal_pattern',
      severity: seasonalityB > 0.6 ? 'high' : 'medium',
      term: 'termB',
      description: `${termB} shows seasonal pattern (strength: ${seasonalityB.toFixed(2)})`,
      detectedAt: seriesB[seriesB.length - 1]?.date || new Date().toISOString(),
      confidence: Math.min(85, 50 + seasonalityB * 50),
      source: {
        provider: dataSource,
        lastUpdatedAt,
      },
      generatedAt,
    });
  }

  return signals;
}

/**
 * Detect seasonality using autocorrelation
 */
function detectSeasonality(series: Array<{ date: string; value: number }>): number {
  if (series.length < 12) return 0;

  const values = series.map(p => p.value);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;

  // Calculate autocorrelation at lag 12 (monthly pattern)
  const lag = Math.min(12, Math.floor(series.length / 2));
  let numerator = 0;
  let denominator = 0;

  for (let i = lag; i < values.length; i++) {
    const diff1 = values[i] - mean;
    const diff2 = values[i - lag] - mean;
    numerator += diff1 * diff2;
    denominator += diff1 * diff1;
  }

  if (denominator === 0) return 0;
  return Math.abs(numerator / denominator);
}

/**
 * Detect anomalies
 */
function detectAnomalies(
  termA: string,
  termB: string,
  anomalies: {
    termA?: Array<{ date: string; value: number; type: string }>;
    termB?: Array<{ date: string; value: number; type: string }>;
  },
  generatedAt: string,
  dataSource: string,
  lastUpdatedAt: string
): Signal[] {
  const signals: Signal[] = [];

  if (anomalies.termA && anomalies.termA.length > 0) {
    for (const anomaly of anomalies.termA) {
      signals.push({
        id: `anomaly-${termA}-${stableHash({ term: termA, date: anomaly.date, generatedAt })}`,
        type: 'anomaly_detected',
        severity: 'medium',
        term: 'termA',
        description: `Anomaly detected for ${termA} on ${anomaly.date}: ${anomaly.type}`,
        detectedAt: anomaly.date,
        confidence: 75,
        dataPoints: [{ date: anomaly.date, value: anomaly.value }],
        source: {
          provider: dataSource,
          lastUpdatedAt,
        },
        generatedAt,
      });
    }
  }

  if (anomalies.termB && anomalies.termB.length > 0) {
    for (const anomaly of anomalies.termB) {
      signals.push({
        id: `anomaly-${termB}-${stableHash({ term: termB, date: anomaly.date, generatedAt })}`,
        type: 'anomaly_detected',
        severity: 'medium',
        term: 'termB',
        description: `Anomaly detected for ${termB} on ${anomaly.date}: ${anomaly.type}`,
        detectedAt: anomaly.date,
        confidence: 75,
        dataPoints: [{ date: anomaly.date, value: anomaly.value }],
        source: {
          provider: dataSource,
          lastUpdatedAt,
        },
        generatedAt,
      });
    }
  }

  return signals;
}

/**
 * Detect volume surges from forecast
 */
function detectVolumeSurges(
  termA: string,
  termB: string,
  forecastSummary: {
    termA?: { direction: 'rising' | 'falling' | 'stable'; confidence: number };
    termB?: { direction: 'rising' | 'falling' | 'stable'; confidence: number };
  },
  generatedAt: string,
  dataSource: string,
  lastUpdatedAt: string
): Signal[] {
  const signals: Signal[] = [];

  if (forecastSummary.termA && forecastSummary.termA.direction === 'rising' && forecastSummary.termA.confidence > 70) {
    signals.push({
      id: `volume-surge-${termA}-${stableHash({ term: termA, generatedAt })}`,
      type: 'volume_surge',
      severity: forecastSummary.termA.confidence > 85 ? 'high' : 'medium',
      term: 'termA',
      description: `${termA} forecasted to surge (confidence: ${forecastSummary.termA.confidence}%)`,
      detectedAt: new Date().toISOString(),
      confidence: forecastSummary.termA.confidence,
      source: {
        provider: dataSource,
        lastUpdatedAt,
      },
      generatedAt,
    });
  }

  if (forecastSummary.termB && forecastSummary.termB.direction === 'rising' && forecastSummary.termB.confidence > 70) {
    signals.push({
      id: `volume-surge-${termB}-${stableHash({ term: termB, generatedAt })}`,
      type: 'volume_surge',
      severity: forecastSummary.termB.confidence > 85 ? 'high' : 'medium',
      term: 'termB',
      description: `${termB} forecasted to surge (confidence: ${forecastSummary.termB.confidence}%)`,
      detectedAt: new Date().toISOString(),
      confidence: forecastSummary.termB.confidence,
      source: {
        provider: dataSource,
        lastUpdatedAt,
      },
      generatedAt,
    });
  }

  return signals;
}

