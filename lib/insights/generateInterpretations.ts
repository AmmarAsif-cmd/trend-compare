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
  | 'Noisy'
  | 'RegimeShift';

export type SustainabilityClassification = 
  | 'Sustainable'
  | 'Unsustainable'
  | 'Uncertain';

export type LeaderChangeRisk = 
  | 'Low'
  | 'Medium'
  | 'High';

/**
 * Generate all interpretations from signals
 */
export function generateInterpretations(input: GenerateInterpretationsInput): Interpretation[] {
  const interpretations: Interpretation[] = [];
  const now = new Date().toISOString();
  const { termA, termB, signals, scores, seriesLength, dataSource, lastUpdatedAt } = input;

  // Classify series patterns
  const classificationA = classifySeries(signals.filter(s => s.term === 'termA'), scores.termA);
  const classificationB = classifySeries(signals.filter(s => s.term === 'termB'), scores.termB);

  // Generate trend analysis interpretations
  interpretations.push(...generateTrendAnalysis(termA, termB, signals, scores, classificationA, classificationB, now, dataSource, lastUpdatedAt));

  // Generate competitive dynamics interpretations
  interpretations.push(...generateCompetitiveDynamics(termA, termB, signals, scores, now, dataSource, lastUpdatedAt));

  // Generate market positioning interpretations
  interpretations.push(...generateMarketPositioning(termA, termB, signals, scores, now, dataSource, lastUpdatedAt));

  // Generate growth/decline pattern interpretations
  interpretations.push(...generateGrowthDeclinePatterns(termA, termB, signals, scores, classificationA, classificationB, now, dataSource, lastUpdatedAt));

  // Generate stability analysis interpretations
  interpretations.push(...generateStabilityAnalysis(termA, termB, signals, scores, classificationA, classificationB, now, dataSource, lastUpdatedAt));

  return interpretations;
}

/**
 * Classify series pattern based on signals
 */
function classifySeries(signals: Signal[], score: { overall: number; breakdown: any }): SeriesClassification {
  const hasSeasonal = signals.some(s => s.type === 'seasonal_pattern');
  const hasAnomaly = signals.some(s => s.type === 'anomaly_detected');
  const hasVolatility = signals.some(s => s.type === 'volatility_spike' && s.severity === 'high');
  const hasMomentumShift = signals.some(s => s.type === 'momentum_shift' && Math.abs(parseFloat(s.description.match(/-?\d+\.?\d*/)?.[0] || '0')) > 30);
  const hasCorrelationChange = signals.some(s => s.type === 'correlation_change');

  if (hasSeasonal) return 'Seasonal';
  if (hasAnomaly && !hasVolatility) return 'EventDriven';
  if (hasVolatility && !hasSeasonal) return 'Noisy';
  if (hasMomentumShift && hasCorrelationChange) return 'RegimeShift';
  return 'Stable';
}

/**
 * Classify sustainability based on signals and scores
 */
function classifySustainability(
  signals: Signal[],
  score: { overall: number; breakdown: { momentum: number } }
): SustainabilityClassification {
  const momentumSignals = signals.filter(s => s.type === 'momentum_shift' && s.term !== 'both');
  const hasStrongMomentum = momentumSignals.some(s => {
    const match = s.description.match(/-?\d+\.?\d*/);
    return match && Math.abs(parseFloat(match[0])) > 25;
  });

  const momentum = score.breakdown.momentum;
  const isRising = momentum > 55;
  const isFalling = momentum < 45;

  if (hasStrongMomentum && isRising) return 'Sustainable';
  if (hasStrongMomentum && isFalling) return 'Unsustainable';
  if (momentum >= 45 && momentum <= 55) return 'Uncertain';
  return 'Uncertain';
}

/**
 * Assess leader change risk
 */
function assessLeaderChangeRisk(
  signals: Signal[],
  scores: { termA: { overall: number }; termB: { overall: number } }
): LeaderChangeRisk {
  const margin = Math.abs(scores.termA.overall - scores.termB.overall);
  const hasCrossover = signals.some(s => s.type === 'competitor_crossover');
  const hasMomentumDivergence = signals.some(s => s.type === 'momentum_shift' && s.term === 'both');

  if (hasCrossover) return 'High';
  if (hasMomentumDivergence && margin < 10) return 'High';
  if (margin < 5) return 'High';
  if (margin < 10 && hasMomentumDivergence) return 'Medium';
  if (margin < 15) return 'Medium';
  return 'Low';
}

/**
 * Generate trend analysis interpretations
 */
function generateTrendAnalysis(
  termA: string,
  termB: string,
  signals: Signal[],
  scores: { termA: any; termB: any },
  classificationA: SeriesClassification,
  classificationB: SeriesClassification,
  generatedAt: string,
  dataSource: string,
  lastUpdatedAt: string
): Interpretation[] {
  const interpretations: Interpretation[] = [];

  const momentumSignalsA = signals.filter(s => s.type === 'momentum_shift' && s.term === 'termA');
  const momentumSignalsB = signals.filter(s => s.type === 'momentum_shift' && s.term === 'termB');

  // Term A trend interpretation
  if (momentumSignalsA.length > 0) {
    const signal = momentumSignalsA[0];
    const isRising = signal.description.includes('upward') || signal.description.includes('rising');
    const sustainability = classifySustainability(
      signals.filter(s => s.term === 'termA'),
      scores.termA
    );

    interpretations.push({
      id: `trend-${termA}-${stableHash({ term: termA, type: 'trend', generatedAt })}`,
      category: 'trend_analysis',
      term: 'termA',
      text: `${termA} is ${isRising ? 'trending upward' : 'trending downward'} with ${classificationA.toLowerCase()} pattern. Sustainability: ${sustainability.toLowerCase()}.`,
      evidence: [
        `Momentum signal: ${signal.description}`,
        `Current score: ${scores.termA.overall}/100`,
        `Pattern classification: ${classificationA}`,
      ],
      relatedSignals: [signal.id],
      confidence: signal.confidence,
      generatedAt,
      dataFreshness: {
        lastUpdatedAt,
        source: dataSource,
      },
    });
  }

  // Term B trend interpretation
  if (momentumSignalsB.length > 0) {
    const signal = momentumSignalsB[0];
    const isRising = signal.description.includes('upward') || signal.description.includes('rising');
    const sustainability = classifySustainability(
      signals.filter(s => s.term === 'termB'),
      scores.termB
    );

    interpretations.push({
      id: `trend-${termB}-${stableHash({ term: termB, type: 'trend', generatedAt })}`,
      category: 'trend_analysis',
      term: 'termB',
      text: `${termB} is ${isRising ? 'trending upward' : 'trending downward'} with ${classificationB.toLowerCase()} pattern. Sustainability: ${sustainability.toLowerCase()}.`,
      evidence: [
        `Momentum signal: ${signal.description}`,
        `Current score: ${scores.termB.overall}/100`,
        `Pattern classification: ${classificationB}`,
      ],
      relatedSignals: [signal.id],
      confidence: signal.confidence,
      generatedAt,
      dataFreshness: {
        lastUpdatedAt,
        source: dataSource,
      },
    });
  }

  // Comparative trend interpretation
  const margin = Math.abs(scores.termA.overall - scores.termB.overall);
  const winner = scores.termA.overall >= scores.termB.overall ? termA : termB;
  const loser = scores.termA.overall >= scores.termB.overall ? termB : termA;

  if (margin >= 10) {
    interpretations.push({
      id: `trend-comparison-${stableHash({ termA, termB, generatedAt })}`,
      category: 'trend_analysis',
      term: 'comparison',
      text: `${winner} leads with a ${margin}-point advantage over ${loser}. The gap suggests ${winner} has stronger market position currently.`,
      evidence: [
        `${winner} score: ${scores.termA.overall >= scores.termB.overall ? scores.termA.overall : scores.termB.overall}/100`,
        `${loser} score: ${scores.termA.overall < scores.termB.overall ? scores.termA.overall : scores.termB.overall}/100`,
        `Margin: ${margin} points`,
      ],
      confidence: Math.min(90, 60 + margin),
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
 * Generate competitive dynamics interpretations
 */
function generateCompetitiveDynamics(
  termA: string,
  termB: string,
  signals: Signal[],
  scores: { termA: any; termB: any },
  generatedAt: string,
  dataSource: string,
  lastUpdatedAt: string
): Interpretation[] {
  const interpretations: Interpretation[] = [];

  const crossoverSignals = signals.filter(s => s.type === 'competitor_crossover');
  const correlationSignals = signals.filter(s => s.type === 'correlation_change');
  const leaderChangeRisk = assessLeaderChangeRisk(signals, scores);

  // Crossover interpretation
  if (crossoverSignals.length > 0) {
    const signal = crossoverSignals[0];
    interpretations.push({
      id: `competitive-crossover-${stableHash({ termA, termB, generatedAt })}`,
      category: 'competitive_dynamics',
      term: 'comparison',
      text: `Competitive shift detected: ${signal.description}. This indicates a change in market dynamics between ${termA} and ${termB}.`,
      evidence: [
        signal.description,
        `Current scores: ${termA} (${scores.termA.overall}), ${termB} (${scores.termB.overall})`,
      ],
      relatedSignals: [signal.id],
      confidence: signal.confidence,
      generatedAt,
      dataFreshness: {
        lastUpdatedAt,
        source: dataSource,
      },
    });
  }

  // Correlation change interpretation
  if (correlationSignals.length > 0) {
    const signal = correlationSignals[0];
    interpretations.push({
      id: `competitive-correlation-${stableHash({ termA, termB, generatedAt })}`,
      category: 'competitive_dynamics',
      term: 'comparison',
      text: `Correlation between ${termA} and ${termB} has changed, suggesting they are ${signal.description.includes('increased') ? 'becoming more' : 'becoming less'} related in market behavior.`,
      evidence: [signal.description],
      relatedSignals: [signal.id],
      confidence: signal.confidence,
      generatedAt,
      dataFreshness: {
        lastUpdatedAt,
        source: dataSource,
      },
    });
  }

  // Leader change risk interpretation
  if (leaderChangeRisk !== 'Low') {
    const margin = Math.abs(scores.termA.overall - scores.termB.overall);
    interpretations.push({
      id: `competitive-risk-${stableHash({ termA, termB, risk: leaderChangeRisk, generatedAt })}`,
      category: 'competitive_dynamics',
      term: 'comparison',
      text: `Leader change risk is ${leaderChangeRisk.toLowerCase()}. Current margin is ${margin} points, which ${leaderChangeRisk === 'High' ? 'indicates high volatility' : 'suggests potential shifts'}.`,
      evidence: [
        `Score margin: ${margin} points`,
        `Risk level: ${leaderChangeRisk}`,
        `Current leader: ${scores.termA.overall >= scores.termB.overall ? termA : termB}`,
      ],
      confidence: leaderChangeRisk === 'High' ? 75 : 65,
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
 * Generate market positioning interpretations
 */
function generateMarketPositioning(
  termA: string,
  termB: string,
  signals: Signal[],
  scores: { termA: any; termB: any },
  generatedAt: string,
  dataSource: string,
  lastUpdatedAt: string
): Interpretation[] {
  const interpretations: Interpretation[] = [];

  const breakdownA = scores.termA.breakdown;
  const breakdownB = scores.termB.breakdown;

  // Search interest positioning
  if (Math.abs(breakdownA.searchInterest - breakdownB.searchInterest) > 10) {
    const leader = breakdownA.searchInterest >= breakdownB.searchInterest ? termA : termB;
    const margin = Math.abs(breakdownA.searchInterest - breakdownB.searchInterest);
    interpretations.push({
      id: `positioning-search-${stableHash({ termA, termB, generatedAt })}`,
      category: 'market_positioning',
      term: 'comparison',
      text: `${leader} has ${margin}-point advantage in search interest, indicating stronger brand awareness and consumer intent.`,
      evidence: [
        `${termA} search interest: ${breakdownA.searchInterest}/100`,
        `${termB} search interest: ${breakdownB.searchInterest}/100`,
      ],
      confidence: Math.min(85, 60 + margin),
      generatedAt,
      dataFreshness: {
        lastUpdatedAt,
        source: dataSource,
      },
    });
  }

  // Social buzz positioning
  if (Math.abs(breakdownA.socialBuzz - breakdownB.socialBuzz) > 10) {
    const leader = breakdownA.socialBuzz >= breakdownB.socialBuzz ? termA : termB;
    const margin = Math.abs(breakdownA.socialBuzz - breakdownB.socialBuzz);
    interpretations.push({
      id: `positioning-social-${stableHash({ termA, termB, generatedAt })}`,
      category: 'market_positioning',
      term: 'comparison',
      text: `${leader} leads in social engagement by ${margin} points, suggesting stronger community presence and viral potential.`,
      evidence: [
        `${termA} social buzz: ${breakdownA.socialBuzz}/100`,
        `${termB} social buzz: ${breakdownB.socialBuzz}/100`,
      ],
      confidence: Math.min(85, 60 + margin),
      generatedAt,
      dataFreshness: {
        lastUpdatedAt,
        source: dataSource,
      },
    });
  }

  // Authority positioning
  if (Math.abs(breakdownA.authority - breakdownB.authority) > 10) {
    const leader = breakdownA.authority >= breakdownB.authority ? termA : termB;
    const margin = Math.abs(breakdownA.authority - breakdownB.authority);
    interpretations.push({
      id: `positioning-authority-${stableHash({ termA, termB, generatedAt })}`,
      category: 'market_positioning',
      term: 'comparison',
      text: `${leader} has ${margin}-point advantage in authority metrics, indicating better ratings, reviews, or industry recognition.`,
      evidence: [
        `${termA} authority: ${breakdownA.authority}/100`,
        `${termB} authority: ${breakdownB.authority}/100`,
      ],
      confidence: Math.min(85, 60 + margin),
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
 * Generate growth/decline pattern interpretations
 */
function generateGrowthDeclinePatterns(
  termA: string,
  termB: string,
  signals: Signal[],
  scores: { termA: any; termB: any },
  classificationA: SeriesClassification,
  classificationB: SeriesClassification,
  generatedAt: string,
  dataSource: string,
  lastUpdatedAt: string
): Interpretation[] {
  const interpretations: Interpretation[] = [];

  const momentumA = scores.termA.breakdown.momentum;
  const momentumB = scores.termB.breakdown.momentum;

  // Term A growth/decline
  if (momentumA > 55) {
    interpretations.push({
      id: `growth-${termA}-${stableHash({ term: termA, momentum: momentumA, generatedAt })}`,
      category: 'growth_pattern',
      term: 'termA',
      text: `${termA} shows growth pattern with momentum of ${momentumA}/100. Pattern type: ${classificationA}.`,
      evidence: [
        `Momentum score: ${momentumA}/100`,
        `Overall score: ${scores.termA.overall}/100`,
        `Pattern: ${classificationA}`,
      ],
      confidence: Math.min(85, 50 + (momentumA - 50) * 0.7),
      generatedAt,
      dataFreshness: {
        lastUpdatedAt,
        source: dataSource,
      },
    });
  } else if (momentumA < 45) {
    interpretations.push({
      id: `decline-${termA}-${stableHash({ term: termA, momentum: momentumA, generatedAt })}`,
      category: 'decline_pattern',
      term: 'termA',
      text: `${termA} shows decline pattern with momentum of ${momentumA}/100. Pattern type: ${classificationA}.`,
      evidence: [
        `Momentum score: ${momentumA}/100`,
        `Overall score: ${scores.termA.overall}/100`,
        `Pattern: ${classificationA}`,
      ],
      confidence: Math.min(85, 50 + (50 - momentumA) * 0.7),
      generatedAt,
      dataFreshness: {
        lastUpdatedAt,
        source: dataSource,
      },
    });
  }

  // Term B growth/decline
  if (momentumB > 55) {
    interpretations.push({
      id: `growth-${termB}-${stableHash({ term: termB, momentum: momentumB, generatedAt })}`,
      category: 'growth_pattern',
      term: 'termB',
      text: `${termB} shows growth pattern with momentum of ${momentumB}/100. Pattern type: ${classificationB}.`,
      evidence: [
        `Momentum score: ${momentumB}/100`,
        `Overall score: ${scores.termB.overall}/100`,
        `Pattern: ${classificationB}`,
      ],
      confidence: Math.min(85, 50 + (momentumB - 50) * 0.7),
      generatedAt,
      dataFreshness: {
        lastUpdatedAt,
        source: dataSource,
      },
    });
  } else if (momentumB < 45) {
    interpretations.push({
      id: `decline-${termB}-${stableHash({ term: termB, momentum: momentumB, generatedAt })}`,
      category: 'decline_pattern',
      term: 'termB',
      text: `${termB} shows decline pattern with momentum of ${momentumB}/100. Pattern type: ${classificationB}.`,
      evidence: [
        `Momentum score: ${momentumB}/100`,
        `Overall score: ${scores.termB.overall}/100`,
        `Pattern: ${classificationB}`,
      ],
      confidence: Math.min(85, 50 + (50 - momentumB) * 0.7),
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
 * Generate stability analysis interpretations
 */
function generateStabilityAnalysis(
  termA: string,
  termB: string,
  signals: Signal[],
  scores: { termA: any; termB: any },
  classificationA: SeriesClassification,
  classificationB: SeriesClassification,
  generatedAt: string,
  dataSource: string,
  lastUpdatedAt: string
): Interpretation[] {
  const interpretations: Interpretation[] = [];

  const volatilitySignalsA = signals.filter(s => s.type === 'volatility_spike' && s.term === 'termA');
  const volatilitySignalsB = signals.filter(s => s.type === 'volatility_spike' && s.term === 'termB');

  // Term A stability
  if (volatilitySignalsA.length > 0) {
    const signal = volatilitySignalsA[0];
    interpretations.push({
      id: `stability-${termA}-${stableHash({ term: termA, generatedAt })}`,
      category: 'stability_analysis',
      term: 'termA',
      text: `${termA} shows ${classificationA === 'Noisy' ? 'high volatility' : 'moderate volatility'} with ${classificationA.toLowerCase()} pattern. This suggests ${classificationA === 'Noisy' ? 'unpredictable' : 'somewhat predictable'} market behavior.`,
      evidence: [
        signal.description,
        `Pattern classification: ${classificationA}`,
        `Volatility signal severity: ${signal.severity}`,
      ],
      relatedSignals: [signal.id],
      confidence: signal.confidence,
      generatedAt,
      dataFreshness: {
        lastUpdatedAt,
        source: dataSource,
      },
    });
  } else if (classificationA === 'Stable') {
    interpretations.push({
      id: `stability-stable-${termA}-${stableHash({ term: termA, generatedAt })}`,
      category: 'stability_analysis',
      term: 'termA',
      text: `${termA} shows stable pattern with low volatility, indicating predictable and consistent market behavior.`,
      evidence: [
        `Pattern classification: ${classificationA}`,
        `Overall score: ${scores.termA.overall}/100`,
        `No significant volatility signals detected`,
      ],
      confidence: 70,
      generatedAt,
      dataFreshness: {
        lastUpdatedAt,
        source: dataSource,
      },
    });
  }

  // Term B stability
  if (volatilitySignalsB.length > 0) {
    const signal = volatilitySignalsB[0];
    interpretations.push({
      id: `stability-${termB}-${stableHash({ term: termB, generatedAt })}`,
      category: 'stability_analysis',
      term: 'termB',
      text: `${termB} shows ${classificationB === 'Noisy' ? 'high volatility' : 'moderate volatility'} with ${classificationB.toLowerCase()} pattern. This suggests ${classificationB === 'Noisy' ? 'unpredictable' : 'somewhat predictable'} market behavior.`,
      evidence: [
        signal.description,
        `Pattern classification: ${classificationB}`,
        `Volatility signal severity: ${signal.severity}`,
      ],
      relatedSignals: [signal.id],
      confidence: signal.confidence,
      generatedAt,
      dataFreshness: {
        lastUpdatedAt,
        source: dataSource,
      },
    });
  } else if (classificationB === 'Stable') {
    interpretations.push({
      id: `stability-stable-${termB}-${stableHash({ term: termB, generatedAt })}`,
      category: 'stability_analysis',
      term: 'termB',
      text: `${termB} shows stable pattern with low volatility, indicating predictable and consistent market behavior.`,
      evidence: [
        `Pattern classification: ${classificationB}`,
        `Overall score: ${scores.termB.overall}/100`,
        `No significant volatility signals detected`,
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

