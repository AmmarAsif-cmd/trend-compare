/**
 * Stage B: Generate Interpretations from Signals
 * 
 * Deterministic, pure function that uses strict rule-based logic to translate
 * Signals into Interpretations with explicit reasons.
 */

import type { Signal } from './contracts/signals';
import type { Interpretation, InterpretationCategory } from './contracts/interpretations';
import { INSIGHT_VERSION } from './contracts/versions';
import { stableHash } from '../cache/hash';
import { memoize } from '@/lib/utils/memoize';

export interface GenerateInterpretationsInput {
  termA: string;
  termB: string;
  signals: Signal[];
  scores: {
    termA: { overall: number; breakdown: { searchInterest: number; socialBuzz: number; authority: number; momentum: number } };
    termB: { overall: number; breakdown: { searchInterest: number; socialBuzz: number; authority: number; momentum: number } };
  };
  seriesLength: number;
  dataSource: string;
  lastUpdatedAt: string;
}

export type SeriesClassification = 
  | 'Stable'
  | 'Seasonal'
  | 'EventDriven'
  | 'Volatile';

export type SustainabilityClassification = 
  | 'Sustainable'
  | 'Uncertain'
  | 'AtRisk';

export type LeaderChangeRisk = 
  | 'Low'
  | 'Medium'
  | 'High';

/**
 * Generate all interpretations from signals (internal, not memoized)
 */
function generateInterpretationsInternal(input: GenerateInterpretationsInput): Interpretation[] {
  const { termA, termB, signals, scores, seriesLength, dataSource, lastUpdatedAt } = input;
  const interpretations: Interpretation[] = [];
  const now = new Date().toISOString();
  const generatedAt = now;

  // Helper to classify series pattern
  function classifySeries(term: string): SeriesClassification {
    // Simplified classification - in production, use more sophisticated analysis
    const termSignals = signals.filter(s => s.term === term);
    const hasSpike = termSignals.some(s => s.type === 'volatility_spike' || s.type === 'volume_surge');
    const hasDecline = termSignals.some(s => s.type === 'momentum_shift' || s.type === 'sentiment_shift');
    
    if (hasSpike && hasDecline) return 'Volatile';
    if (hasSpike) return 'EventDriven';
    return 'Stable';
  }

  // Helper to assess sustainability
  function assessSustainability(term: string): SustainabilityClassification {
    const termScore = term === termA ? scores.termA.overall : scores.termB.overall;
    const termSignals = signals.filter(s => s.term === term);
    const hasNegativeSignals = termSignals.some(s => s.severity === 'high' && (s.type === 'momentum_shift' || s.type === 'sentiment_shift' || s.type === 'competitor_crossover'));
    
    if (termScore >= 70 && !hasNegativeSignals) return 'Sustainable';
    if (termScore < 50 || hasNegativeSignals) return 'AtRisk';
    return 'Uncertain';
  }

  // Helper to assess leader change risk
  function assessLeaderChangeRisk(): LeaderChangeRisk {
    const margin = Math.abs(scores.termA.overall - scores.termB.overall);
    const volatilitySignals = signals.filter(s => s.type === 'volatility_spike' || s.type === 'anomaly_detected');
    
    if (margin < 10 && volatilitySignals.length > 2) return 'High';
    if (margin < 20 && volatilitySignals.length > 0) return 'Medium';
    return 'Low';
  }

  // 1. Overall trend interpretation
  const winner = scores.termA.overall >= scores.termB.overall ? termA : termB;
  const loser = winner === termA ? termB : termA;
  const margin = Math.abs(scores.termA.overall - scores.termB.overall);

  interpretations.push({
    id: `overall-${stableHash({ termA, termB, generatedAt })}`,
    category: 'trend_analysis',
    term: 'comparison',
    text: `${winner} is leading with a ${margin.toFixed(1)}-point advantage over ${loser} based on multi-source analysis.`,
    evidence: [
      `Search interest: ${scores.termA.overall >= scores.termB.overall ? termA : termB} leads`,
      `Social buzz: ${scores.termA.breakdown.socialBuzz >= scores.termB.breakdown.socialBuzz ? termA : termB} leads`,
      `Authority: ${scores.termA.breakdown.authority >= scores.termB.breakdown.authority ? termA : termB} leads`,
    ],
    confidence: margin > 20 ? 85 : margin > 10 ? 75 : 65,
    generatedAt,
    dataFreshness: {
      lastUpdatedAt,
      source: dataSource,
    },
  });

  // 2. Momentum interpretation
  const momentumA = scores.termA.breakdown.momentum;
  const momentumB = scores.termB.breakdown.momentum;
  const momentumLeader = momentumA >= momentumB ? termA : termB;
  const momentumMargin = Math.abs(momentumA - momentumB);

  if (momentumMargin > 5) {
    interpretations.push({
      id: `momentum-${stableHash({ termA, termB, generatedAt })}`,
      category: 'growth_pattern',
      term: momentumLeader === termA ? 'termA' : 'termB',
      text: `${momentumLeader} has stronger momentum with ${momentumMargin.toFixed(1)}-point higher momentum, indicating faster growth.`,
      evidence: [
        `Recent trend analysis favors ${momentumLeader}`,
        `Growth rate is ${momentumMargin > 15 ? 'significantly' : 'moderately'} higher`,
      ],
      confidence: 70,
      generatedAt,
      dataFreshness: {
        lastUpdatedAt,
        source: dataSource,
      },
    });
  }

  // 3. Series classification
  const seriesClassA = classifySeries(termA);
  const seriesClassB = classifySeries(termB);

  if (seriesClassA !== 'Stable' || seriesClassB !== 'Stable') {
    interpretations.push({
      id: `series-pattern-${stableHash({ termA, termB, generatedAt })}`,
      category: 'stability_analysis',
      term: 'comparison',
      text: `Series pattern: ${termA} shows ${seriesClassA.toLowerCase()} pattern, while ${termB} shows ${seriesClassB.toLowerCase()} pattern.`,
      evidence: [
        `Analysis of ${seriesLength} data points`,
        `Pattern classification based on signal detection`,
      ],
      confidence: 65,
      generatedAt,
      dataFreshness: {
        lastUpdatedAt,
        source: dataSource,
      },
    });
  }

  // 4. Sustainability assessment
  const sustainabilityA = assessSustainability(termA);
  const sustainabilityB = assessSustainability(termB);

  if (sustainabilityA !== 'Sustainable' || sustainabilityB !== 'Sustainable') {
    interpretations.push({
      id: `sustainability-${stableHash({ termA, termB, generatedAt })}`,
      category: sustainabilityA === 'AtRisk' || sustainabilityB === 'AtRisk' ? 'decline_pattern' : 'stability_analysis',
      term: 'comparison',
      text: `Sustainability: ${termA} is ${sustainabilityA.toLowerCase()}, while ${termB} is ${sustainabilityB.toLowerCase()}.`,
      evidence: [
        `Based on score analysis and signal patterns`,
        `Risk assessment from detected signals`,
      ],
      confidence: 70,
      generatedAt,
      dataFreshness: {
        lastUpdatedAt,
        source: dataSource,
      },
    });
  }

  // 5. Leader change risk
  const changeRisk = assessLeaderChangeRisk();
  if (changeRisk !== 'Low') {
    interpretations.push({
      id: `change-risk-${stableHash({ termA, termB, generatedAt })}`,
      category: 'competitive_dynamics',
      term: 'comparison',
      text: `Leader change risk: ${changeRisk}. The current leader position may change due to ${changeRisk.toLowerCase()} volatility.`,
      evidence: [
        `Margin analysis: ${margin.toFixed(1)} points`,
        `Volatility signals detected: ${signals.filter(s => s.type === 'volatility_spike' || s.type === 'anomaly_detected').length}`,
      ],
      confidence: 70,
      generatedAt,
      dataFreshness: {
        lastUpdatedAt,
        source: dataSource,
      },
    });
  }

  return interpretations;
}

/**
 * Memoized version of generateInterpretations
 * Memoized with 5-minute TTL
 */
export const generateInterpretations = memoize(
  generateInterpretationsInternal,
  5 * 60 * 1000, // 5 minutes TTL
  (input) => stableHash(input)
);
