/**
 * Stage C: Generate Decision Guidance from Signals and Interpretations
 * 
 * Deterministic, template-based generation of role-specific recommendations
 * for Marketers and Founders.
 */

import type { Signal } from './contracts/signals';
import type { Interpretation } from './contracts/interpretations';
import type { DecisionGuidance, DecisionRole, DecisionAction } from './contracts/decision-guidance';
import { stableHash } from '../cache/hash';

export interface GenerateDecisionGuidanceInput {
  termA: string;
  termB: string;
  signals: Signal[];
  interpretations: Interpretation[];
  scores: {
    termA: { overall: number; breakdown: { momentum: number } };
    termB: { overall: number; breakdown: { momentum: number } };
  };
  dataSource: string;
  lastUpdatedAt: string;
}

export type RiskLevel = 'low' | 'medium' | 'high';

/**
 * Generate decision guidance for both roles
 */
export function generateDecisionGuidance(input: GenerateDecisionGuidanceInput): {
  marketer: DecisionGuidance[];
  founder: DecisionGuidance[];
} {
  const { termA, termB, signals, interpretations, scores, dataSource, lastUpdatedAt } = input;

  return {
    marketer: generateMarketerGuidance(termA, termB, signals, interpretations, scores, dataSource, lastUpdatedAt),
    founder: generateFounderGuidance(termA, termB, signals, interpretations, scores, dataSource, lastUpdatedAt),
  };
}

/**
 * Generate guidance for Marketer role
 */
function generateMarketerGuidance(
  termA: string,
  termB: string,
  signals: Signal[],
  interpretations: Interpretation[],
  scores: { termA: any; termB: any },
  dataSource: string,
  lastUpdatedAt: string
): DecisionGuidance[] {
  const guidance: DecisionGuidance[] = [];
  const now = new Date().toISOString();
  const margin = Math.abs(scores.termA.overall - scores.termB.overall);
  const winner = scores.termA.overall >= scores.termB.overall ? termA : termB;
  const loser = scores.termA.overall >= scores.termB.overall ? termB : termA;

  // Get relevant signals and interpretations
  const momentumSignals = signals.filter(s => s.type === 'momentum_shift');
  const crossoverSignals = signals.filter(s => s.type === 'competitor_crossover');
  const volatilitySignals = signals.filter(s => s.type === 'volatility_spike');
  const trendInterpretations = interpretations.filter(i => i.category === 'trend_analysis');
  const competitiveInterpretations = interpretations.filter(i => i.category === 'competitive_dynamics');

  // Recommendation 1: Focus allocation based on current leader
  if (margin >= 10) {
    const momentumA = scores.termA.breakdown.momentum;
    const momentumB = scores.termB.breakdown.momentum;
    const isWinnerRising = (scores.termA.overall >= scores.termB.overall && momentumA > 55) ||
                          (scores.termB.overall > scores.termA.overall && momentumB > 55);

    const riskLevel: RiskLevel = margin >= 20 ? 'low' : margin >= 15 ? 'low' : 'medium';
    const riskNotes: string[] = [];
    if (margin < 15) {
      riskNotes.push(`${loser} momentum is ${scores.termA.overall >= scores.termB.overall ? scores.termB.breakdown.momentum : scores.termA.breakdown.momentum}%, which could indicate potential for competitive shifts`);
    }
    if (crossoverSignals.length > 0) {
      riskNotes.push('Recent crossover signals detected - monitor for leadership changes');
    }
    if (riskNotes.length === 0) {
      riskNotes.push('Market position appears stable, but continue monitoring competitor activity');
    }

    guidance.push({
      id: `marketer-focus-${stableHash({ termA, termB, role: 'marketer', type: 'focus', now })}`,
      role: 'marketer',
      action: isWinnerRising ? 'invest_more' : 'maintain',
      term: scores.termA.overall >= scores.termB.overall ? 'termA' : 'termB',
      recommendation: `Focus marketing efforts on ${winner} for the next 2-4 weeks. Current data shows ${winner} has a ${margin}-point advantage and ${isWinnerRising ? 'positive momentum' : 'stable performance'}. Consider allocating 60-70% of budget to ${winner} and 30-40% to ${loser} for balanced coverage.`,
      rationale: `Market position analysis indicates ${winner} leads with ${margin} points. ${isWinnerRising ? 'Upward momentum suggests' : 'Stable performance indicates'} this is a good time to capitalize on current market position.`,
      priority: margin >= 20 ? 5 : margin >= 15 ? 4 : 3,
      timeframe: 'next 2-4 weeks',
      riskLevel,
      riskNotes: riskNotes.slice(0, 2),
      nextCheck: margin >= 20 ? 'Re-check in 14 days' : 'Re-check in 7 days',
      relatedInterpretations: trendInterpretations.map(i => i.id).slice(0, 2),
      generatedAt: now,
      dataFreshness: {
        lastUpdatedAt,
        source: dataSource,
      },
    });
  }

  // Recommendation 2: Monitor competitive dynamics
  if (crossoverSignals.length > 0 || margin < 15) {
    const riskLevel: RiskLevel = crossoverSignals.length > 0 ? 'high' : margin < 10 ? 'medium' : 'low';
    const riskNotes = crossoverSignals.length > 0
      ? 'Recent crossover detected indicates market dynamics are shifting'
      : margin < 10
      ? 'Narrow margin suggests potential for leadership change'
      : 'Monitor for early signs of competitive shifts';

    const riskNotesArray: string[] = [];
    if (crossoverSignals.length > 0) {
      riskNotesArray.push('Recent crossover detected indicates market dynamics are shifting');
    }
    if (margin < 10) {
      riskNotesArray.push('Narrow margin suggests potential for leadership change');
    }
    if (riskNotesArray.length === 0) {
      riskNotesArray.push('Monitor for early signs of competitive shifts');
    }

    guidance.push({
      id: `marketer-monitor-${stableHash({ termA, termB, role: 'marketer', type: 'monitor', now })}`,
      role: 'marketer',
      action: 'monitor',
      term: 'both',
      recommendation: `Monitor competitive dynamics between ${termA} and ${termB} closely. ${crossoverSignals.length > 0 ? 'Recent crossover signals suggest market position may be changing.' : 'Current margin is narrow, indicating potential for shifts.'} Set up weekly trend tracking to catch changes early.`,
      rationale: `${competitiveInterpretations.length > 0 ? competitiveInterpretations[0].text : 'Competitive landscape shows activity.'} Regular monitoring will help identify shifts early.`,
      priority: riskLevel === 'high' ? 5 : riskLevel === 'medium' ? 4 : 3,
      timeframe: 'next 1-2 weeks',
      riskLevel,
      riskNotes: riskNotesArray.slice(0, 2),
      nextCheck: riskLevel === 'high' ? 'Re-check in 3 days' : 'Re-check in 7 days',
      relatedInterpretations: competitiveInterpretations.map(i => i.id).slice(0, 2),
      generatedAt: now,
      dataFreshness: {
        lastUpdatedAt,
        source: dataSource,
      },
    });
  }

  // Recommendation 3: Optimize based on volatility
  if (volatilitySignals.length > 0) {
    const highVolatilityTerm = volatilitySignals.find(s => s.severity === 'high')?.term || 'both';
    const termName = highVolatilityTerm === 'termA' ? termA : highVolatilityTerm === 'termB' ? termB : 'both terms';

    const volatilityRiskLevel: RiskLevel = volatilitySignals.some(s => s.severity === 'high') ? 'high' : 'medium';
    const volatilityRiskNotes: string[] = [
      `High volatility detected for ${termName} - market conditions are unpredictable`,
      'Rapid changes may require frequent strategy adjustments'
    ];

    guidance.push({
      id: `marketer-optimize-${stableHash({ termA, termB, role: 'marketer', type: 'optimize', now })}`,
      role: 'marketer',
      action: 'optimize',
      term: highVolatilityTerm === 'both' ? 'both' : highVolatilityTerm,
      recommendation: `Optimize marketing approach for ${termName} due to detected volatility. Consider A/B testing messaging and timing to adapt to changing market conditions. Test 2-3 different messaging angles to find what resonates.`,
      rationale: `High volatility signals indicate unpredictable market behavior. Flexible marketing strategies that can adapt quickly will perform better in volatile conditions.`,
      priority: 3,
      timeframe: 'next 3-4 weeks',
      riskLevel: volatilityRiskLevel,
      riskNotes: volatilityRiskNotes,
      nextCheck: 'Re-check in 7 days to assess test results',
      relatedInterpretations: interpretations.filter(i => i.category === 'stability_analysis').map(i => i.id).slice(0, 1),
      generatedAt: now,
      dataFreshness: {
        lastUpdatedAt,
        source: dataSource,
      },
    });
  }

  // Recommendation 4: Scale successful campaigns (if strong momentum)
  const strongMomentumSignals = momentumSignals.filter(s => {
    const match = s.description.match(/-?\d+\.?\d*/);
    return match && Math.abs(parseFloat(match[0])) > 25;
  });

  if (strongMomentumSignals.length > 0 && guidance.length < 3) {
    const signal = strongMomentumSignals[0];
    const isRising = signal.description.includes('upward') || signal.description.includes('rising');
    const term = signal.term === 'both' ? 'both' : signal.term;
    const termName = term === 'termA' ? termA : term === 'termB' ? termB : `${termA} and ${termB}`;

    if (isRising) {
      const scaleRiskLevel: RiskLevel = 'low';
      const scaleRiskNotes: string[] = [
        'Momentum may not sustain - monitor for signs of slowdown',
        'Increased investment should be proportional to momentum strength'
      ];

      guidance.push({
        id: `marketer-scale-${stableHash({ termA, termB, role: 'marketer', type: 'scale', now })}`,
        role: 'marketer',
        action: 'scale',
        term,
        recommendation: `Scale marketing efforts for ${termName} over the next 2-3 weeks. Strong upward momentum (${signal.description.match(/-?\d+\.?\d*/)?.[0]}% change) indicates favorable conditions for increased investment. Increase budget allocation by 20-30% for this term.`,
        rationale: `Momentum analysis shows significant upward trend. Scaling successful campaigns during positive momentum periods typically yields better ROI.`,
        priority: 4,
        timeframe: 'next 2-3 weeks',
        riskLevel: scaleRiskLevel,
        riskNotes: scaleRiskNotes,
        nextCheck: 'Re-check in 7 days to validate momentum continues',
        relatedInterpretations: [signal.id],
        generatedAt: now,
        dataFreshness: {
          lastUpdatedAt,
          source: dataSource,
        },
      });
    }
  }

  // Ensure at least 2 recommendations
  if (guidance.length === 0) {
    // Default recommendation when no strong signals
    guidance.push({
      id: `marketer-default-${stableHash({ termA, termB, role: 'marketer', now })}`,
      role: 'marketer',
      action: 'maintain',
      term: 'both',
      recommendation: `Maintain current marketing strategy for both ${termA} and ${termB}. Market conditions appear stable with no significant shifts detected. Keep 50/50 budget allocation unless new signals emerge.`,
      rationale: `Current data shows balanced market conditions. Maintaining existing strategy allows for continued monitoring while avoiding unnecessary changes.`,
      priority: 2,
      timeframe: 'next 2-4 weeks',
      riskLevel: 'low',
      riskNotes: ['Stable conditions may change - continue monitoring', 'No immediate action required but stay alert to shifts'],
      nextCheck: 'Re-check in 14 days',
      generatedAt: now,
      dataFreshness: {
        lastUpdatedAt,
        source: dataSource,
      },
    });

    guidance.push({
      id: `marketer-monitor-default-${stableHash({ termA, termB, role: 'marketer', type: 'monitor-default', now })}`,
      role: 'marketer',
      action: 'monitor',
      term: 'both',
      recommendation: `Continue monitoring market trends for ${termA} and ${termB}. Regular data review will help identify opportunities or risks early. Set up weekly trend alerts.`,
      rationale: `Ongoing monitoring provides early warning of market changes. This enables proactive strategy adjustments when needed.`,
      priority: 2,
      timeframe: 'ongoing',
      riskLevel: 'low',
      riskNotes: ['Monitoring is preventive - no immediate risks detected'],
      nextCheck: 'Re-check in 7 days',
      generatedAt: now,
      dataFreshness: {
        lastUpdatedAt,
        source: dataSource,
      },
    });
  }

  // Limit to 3 recommendations
  return guidance.slice(0, 3);
}

/**
 * Generate guidance for Founder role
 */
function generateFounderGuidance(
  termA: string,
  termB: string,
  signals: Signal[],
  interpretations: Interpretation[],
  scores: { termA: any; termB: any },
  dataSource: string,
  lastUpdatedAt: string
): DecisionGuidance[] {
  const guidance: DecisionGuidance[] = [];
  const now = new Date().toISOString();
  const margin = Math.abs(scores.termA.overall - scores.termB.overall);
  const winner = scores.termA.overall >= scores.termB.overall ? termA : termB;
  const loser = scores.termA.overall >= scores.termB.overall ? termB : termA;

  // Get relevant signals and interpretations
  const momentumSignals = signals.filter(s => s.type === 'momentum_shift');
  const crossoverSignals = signals.filter(s => s.type === 'competitor_crossover');
  const volatilitySignals = signals.filter(s => s.type === 'volatility_spike');
  const regimeShiftSignals = signals.filter(s => 
    s.type === 'momentum_shift' && s.term === 'both' ||
    (s.type === 'correlation_change' && s.severity === 'high')
  );
  const trendInterpretations = interpretations.filter(i => i.category === 'trend_analysis');
  const competitiveInterpretations = interpretations.filter(i => i.category === 'competitive_dynamics');

  // Recommendation 1: Strategic positioning
  if (margin >= 15) {
    const momentumA = scores.termA.breakdown.momentum;
    const momentumB = scores.termB.breakdown.momentum;
    const winnerMomentum = scores.termA.overall >= scores.termB.overall ? momentumA : momentumB;
    const isSustainable = winnerMomentum > 55;

    const strategicRiskLevel: RiskLevel = margin >= 20 ? 'low' : 'medium';
    const strategicRiskNotes: string[] = [];
    if (margin < 20) {
      strategicRiskNotes.push(`${loser} could gain ground if momentum shifts - monitor competitor activity`);
    }
    if (!isSustainable) {
      strategicRiskNotes.push('Momentum is not strongly positive - focus on maintaining current position');
    }
    if (strategicRiskNotes.length === 0) {
      strategicRiskNotes.push('Strong position but continue monitoring for competitive threats');
    }

    guidance.push({
      id: `founder-strategic-${stableHash({ termA, termB, role: 'founder', type: 'strategic', now })}`,
      role: 'founder',
      action: isSustainable ? 'invest_more' : 'maintain',
      term: scores.termA.overall >= scores.termB.overall ? 'termA' : 'termB',
      recommendation: `${winner} shows strong market position with ${margin}-point lead. ${isSustainable ? 'Positive momentum suggests this is a good time to strengthen market position through strategic initiatives like product enhancements or market expansion.' : 'Current position is stable, maintain focus on core strengths and differentiation.'}`,
      rationale: `Market analysis indicates ${winner} has established leadership. ${isSustainable ? 'Sustained momentum' : 'Stable performance'} suggests the current strategy is effective. Strategic investments should align with maintaining or extending this advantage.`,
      priority: margin >= 20 ? 5 : 4,
      timeframe: 'next 4-8 weeks',
      riskLevel: strategicRiskLevel,
      riskNotes: strategicRiskNotes.slice(0, 2),
      nextCheck: margin >= 20 ? 'Re-check in 30 days' : 'Re-check in 14 days',
      relatedInterpretations: trendInterpretations.map(i => i.id).slice(0, 2),
      generatedAt: now,
      dataFreshness: {
        lastUpdatedAt,
        source: dataSource,
      },
    });
  }

  // Recommendation 2: Pivot consideration for regime shifts
  if (regimeShiftSignals.length > 0 || (crossoverSignals.length > 0 && margin < 10)) {
    const riskLevel: RiskLevel = regimeShiftSignals.length > 0 ? 'high' : 'medium';
    const riskNotes = regimeShiftSignals.length > 0
      ? 'Regime shift detected - market fundamentals may be changing'
      : 'Competitive crossover suggests market dynamics are shifting';

    const pivotRiskNotes: string[] = [];
    if (regimeShiftSignals.length > 0) {
      pivotRiskNotes.push('Regime shift detected - market fundamentals may be changing');
    }
    if (crossoverSignals.length > 0) {
      pivotRiskNotes.push('Competitive crossover suggests market dynamics are shifting');
    }
    if (pivotRiskNotes.length === 0) {
      pivotRiskNotes.push('Market conditions are changing - strategic review recommended');
    }

    guidance.push({
      id: `founder-pivot-${stableHash({ termA, termB, role: 'founder', type: 'pivot', now })}`,
      role: 'founder',
      action: 'pivot',
      term: 'both',
      recommendation: `Market signals indicate significant shifts in competitive dynamics. ${regimeShiftSignals.length > 0 ? 'Regime shift patterns suggest fundamental market changes.' : 'Recent crossovers indicate changing market position.'} Review strategic positioning and consider adjustments to strategy. Schedule a strategic review meeting within 2 weeks.`,
      rationale: `${competitiveInterpretations.length > 0 ? competitiveInterpretations[0].text : 'Competitive analysis shows significant activity.'} These patterns typically indicate market transitions that may require strategic response.`,
      priority: riskLevel === 'high' ? 5 : 4,
      timeframe: 'next 2-6 weeks',
      riskLevel,
      riskNotes: pivotRiskNotes.slice(0, 2),
      nextCheck: riskLevel === 'high' ? 'Re-check in 3 days' : 'Re-check in 7 days',
      relatedInterpretations: competitiveInterpretations.map(i => i.id).slice(0, 2),
      generatedAt: now,
      dataFreshness: {
        lastUpdatedAt,
        source: dataSource,
      },
    });
  }

  // Recommendation 3: Risk management for volatility
  if (volatilitySignals.length > 0) {
    const highVolatilityCount = volatilitySignals.filter(s => s.severity === 'high').length;
    const riskLevel: RiskLevel = highVolatilityCount >= 2 ? 'high' : 'medium';
    const riskNotes = highVolatilityCount >= 2
      ? 'Multiple high-volatility signals indicate unstable market conditions'
      : 'Volatility detected - market conditions are less predictable';

    const volatilityRiskNotesArray: string[] = [];
    if (highVolatilityCount >= 2) {
      volatilityRiskNotesArray.push('Multiple high-volatility signals indicate unstable market conditions');
    } else {
      volatilityRiskNotesArray.push('Volatility detected - market conditions are less predictable');
    }
    volatilityRiskNotesArray.push('Rapid market changes may require quick strategic adjustments');

    guidance.push({
      id: `founder-risk-${stableHash({ termA, termB, role: 'founder', type: 'risk', now })}`,
      role: 'founder',
      action: 'monitor',
      term: 'both',
      recommendation: `High volatility detected in market data. ${highVolatilityCount >= 2 ? 'Multiple volatility signals suggest' : 'Volatility patterns indicate'} unpredictable market conditions. Implement risk management strategies and maintain flexibility in planning. Consider scenario planning for different market outcomes.`,
      rationale: `Volatility analysis shows ${highVolatilityCount >= 2 ? 'multiple high-severity' : 'significant'} volatility signals. In volatile markets, maintaining strategic flexibility and robust risk management becomes critical.`,
      priority: riskLevel === 'high' ? 5 : 4,
      timeframe: 'next 4-12 weeks',
      riskLevel,
      riskNotes: volatilityRiskNotesArray.slice(0, 2),
      nextCheck: riskLevel === 'high' ? 'Re-check in 7 days' : 'Re-check in 14 days',
      relatedInterpretations: interpretations.filter(i => i.category === 'stability_analysis').map(i => i.id).slice(0, 2),
      generatedAt: now,
      dataFreshness: {
        lastUpdatedAt,
        source: dataSource,
      },
    });
  }

  // Recommendation 4: Growth opportunity (if strong momentum)
  const strongMomentumSignals = momentumSignals.filter(s => {
    const match = s.description.match(/-?\d+\.?\d*/);
    return match && Math.abs(parseFloat(match[0])) > 25 && 
           (s.description.includes('upward') || s.description.includes('rising'));
  });

  if (strongMomentumSignals.length > 0 && guidance.length < 3) {
    const signal = strongMomentumSignals[0];
    const term = signal.term === 'both' ? 'both' : signal.term;
    const termName = term === 'termA' ? termA : term === 'termB' ? termB : `${termA} and ${termB}`;

    const growthRiskLevel: RiskLevel = 'low';
    const growthRiskNotes: string[] = [
      'Momentum may not sustain long-term - monitor for signs of slowdown',
      'Scaling should be proportional to momentum strength and market capacity'
    ];

    guidance.push({
      id: `founder-growth-${stableHash({ termA, termB, role: 'founder', type: 'growth', now })}`,
      role: 'founder',
      action: 'scale',
      term,
      recommendation: `Strong growth momentum detected for ${termName}. Consider scaling operations or expanding market presence to capitalize on positive trend. Momentum analysis shows ${signal.description.match(/-?\d+\.?\d*/)?.[0]}% change, indicating favorable conditions. Allocate 15-25% additional resources to this area.`,
      rationale: `Momentum signals indicate significant upward trend. Scaling during positive momentum periods can help capture market share and build sustainable competitive advantage.`,
      priority: 4,
      timeframe: 'next 4-8 weeks',
      riskLevel: growthRiskLevel,
      riskNotes: growthRiskNotes,
      nextCheck: 'Re-check in 14 days to validate momentum continues',
      relatedInterpretations: trendInterpretations.filter(i => i.category === 'growth_pattern').map(i => i.id).slice(0, 1),
      generatedAt: now,
      dataFreshness: {
        lastUpdatedAt,
        source: dataSource,
      },
    });
  }

  // Ensure at least 2 recommendations
  if (guidance.length === 0) {
    // Default recommendation when no strong signals
    guidance.push({
      id: `founder-default-${stableHash({ termA, termB, role: 'founder', now })}`,
      role: 'founder',
      action: 'maintain',
      term: 'both',
      recommendation: `Maintain current strategic direction for ${termA} and ${termB}. Market analysis shows stable conditions with no significant shifts requiring immediate action. Keep balanced resource allocation unless new signals emerge.`,
      rationale: `Current market data indicates balanced conditions. Maintaining existing strategy allows for continued growth while avoiding unnecessary risks from premature changes.`,
      priority: 2,
      timeframe: 'next 4-8 weeks',
      riskLevel: 'low',
      riskNotes: ['Stable conditions may change - continue monitoring', 'No immediate strategic pivot required'],
      nextCheck: 'Re-check in 30 days',
      generatedAt: now,
      dataFreshness: {
        lastUpdatedAt,
        source: dataSource,
      },
    });

    guidance.push({
      id: `founder-monitor-default-${stableHash({ termA, termB, role: 'founder', type: 'monitor-default', now })}`,
      role: 'founder',
      action: 'monitor',
      term: 'both',
      recommendation: `Continue strategic monitoring of market trends for ${termA} and ${termB}. Regular review of competitive dynamics will help identify opportunities or risks early. Set up monthly strategic review meetings.`,
      rationale: `Ongoing strategic monitoring provides early warning of market changes. This enables proactive decision-making when market conditions shift.`,
      priority: 2,
      timeframe: 'ongoing',
      riskLevel: 'low',
      riskNotes: ['Monitoring is preventive - no immediate strategic risks detected'],
      nextCheck: 'Re-check in 14 days',
      generatedAt: now,
      dataFreshness: {
        lastUpdatedAt,
        source: dataSource,
      },
    });
  }

  // Limit to 3 recommendations
  return guidance.slice(0, 3);
}

