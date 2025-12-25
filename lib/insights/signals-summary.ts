/**
 * Signals Summary
 * 
 * Creates a structured summary object from Signal array
 * for easier consumption in API responses
 * 
 * This is the canonical signals structure used in InsightsPack
 */

import type { Signal } from './contracts/signals';

export type SeriesType = 'stable' | 'seasonal' | 'eventDriven' | 'noisy' | 'regimeShift';

export interface SignalsSummary {
  winner: 'termA' | 'termB' | 'tie';
  marginPoints: number;
  momentumA: number;
  momentumB: number;
  volatilityA: 'low' | 'medium' | 'high';
  volatilityB: 'low' | 'medium' | 'high';
  seriesTypeA: SeriesType;
  seriesTypeB: SeriesType;
  leaderChangeRisk: 'low' | 'medium' | 'high';
  confidenceOverall: number;
  computedAt: string; // ISO 8601 date string
  dataFreshness: {
    lastUpdatedAt: string;
    source: string;
  };
}

/**
 * Classify series type based on signals (matches generateInterpretations logic)
 */
function classifySeriesType(signals: Signal[]): SeriesType {
  const hasSeasonal = signals.some(s => s.type === 'seasonal_pattern');
  const hasAnomaly = signals.some(s => s.type === 'anomaly_detected');
  const hasVolatility = signals.some(s => s.type === 'volatility_spike' && s.severity === 'high');
  const hasMomentumShift = signals.some(s => {
    const match = s.description.match(/-?\d+\.?\d*/);
    return s.type === 'momentum_shift' && match && Math.abs(parseFloat(match[0])) > 30;
  });
  const hasCorrelationChange = signals.some(s => s.type === 'correlation_change');

  if (hasSeasonal) return 'seasonal';
  if (hasAnomaly && !hasVolatility) return 'eventDriven';
  if (hasVolatility && !hasSeasonal) return 'noisy';
  if (hasMomentumShift && hasCorrelationChange) return 'regimeShift';
  return 'stable';
}

/**
 * Create a structured signals summary from Signal array
 */
export function createSignalsSummary(
  signals: Signal[],
  scores: {
    termA: { overall: number; breakdown: { momentum: number } };
    termB: { overall: number; breakdown: { momentum: number } };
  },
  dataSource: string,
  lastUpdatedAt: string
): SignalsSummary {
  const scoreA = scores.termA.overall;
  const scoreB = scores.termB.overall;
  const margin = Math.abs(scoreA - scoreB);
  
  // Determine winner
  let winner: 'termA' | 'termB' | 'tie' = 'tie';
  if (scoreA > scoreB) winner = 'termA';
  else if (scoreB > scoreA) winner = 'termB';
  
  // Calculate momentum
  const momentumA = scores.termA.breakdown.momentum || 50;
  const momentumB = scores.termB.breakdown.momentum || 50;
  
  // Analyze volatility from signals
  const volatilitySignalsA = signals.filter(s => 
    s.term === 'termA' && s.type === 'volatility_spike'
  );
  const volatilitySignalsB = signals.filter(s => 
    s.term === 'termB' && s.type === 'volatility_spike'
  );
  
  const volatilityA: 'low' | 'medium' | 'high' = 
    volatilitySignalsA.length >= 3 ? 'high' :
    volatilitySignalsA.length >= 1 ? 'medium' : 'low';
    
  const volatilityB: 'low' | 'medium' | 'high' = 
    volatilitySignalsB.length >= 3 ? 'high' :
    volatilitySignalsB.length >= 1 ? 'medium' : 'low';
  
  // Classify series type using same logic as generateInterpretations
  const signalsA = signals.filter(s => s.term === 'termA');
  const signalsB = signals.filter(s => s.term === 'termB');
  const seriesTypeA = classifySeriesType(signalsA);
  const seriesTypeB = classifySeriesType(signalsB);
  
  // Calculate leader change risk
  const crossoverSignals = signals.filter(s => s.type === 'competitor_crossover');
  const momentumShiftSignals = signals.filter(s => 
    s.type === 'momentum_shift' && s.severity !== 'low'
  );
  
  let leaderChangeRisk: 'low' | 'medium' | 'high' = 'low';
  if (crossoverSignals.length > 0 || margin < 5) {
    leaderChangeRisk = 'high';
  } else if (momentumShiftSignals.length > 0 || margin < 10) {
    leaderChangeRisk = 'medium';
  }
  
  // Calculate overall confidence
  const signalConfidences = signals.map(s => s.confidence || 50);
  const avgConfidence = signalConfidences.length > 0
    ? signalConfidences.reduce((a, b) => a + b, 0) / signalConfidences.length
    : 50;
  
  // Factor in margin for confidence (larger margin = higher confidence)
  const marginConfidence = Math.min(100, 50 + (margin * 2));
  const confidenceOverall = (avgConfidence + marginConfidence) / 2;
  
  return {
    winner,
    marginPoints: Math.round(margin),
    momentumA: Math.round(momentumA),
    momentumB: Math.round(momentumB),
    volatilityA,
    volatilityB,
    seriesTypeA,
    seriesTypeB,
    leaderChangeRisk,
    confidenceOverall: Math.round(confidenceOverall * 100) / 100,
    computedAt: new Date().toISOString(),
    dataFreshness: {
      lastUpdatedAt,
      source: dataSource,
    },
  };
}

