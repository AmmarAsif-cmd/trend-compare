/**
 * Competitive Analysis Module
 * Analyzes competitive dynamics and timing patterns
 */

import type { HistoricalPeak } from './pattern-analysis';

export interface CompetitorData {
  name: string;
  keyword: string;
  peakDate: Date;
  peakValue: number;
  timingRelativeToLeader: number; // Days after leader's announcement (-ve = before)
}

export interface CompetitiveAnalysis {
  marketLeader: {
    name: string;
    keyword: string;
    dominance: number; // Percentage of total search volume
  } | null;
  competitorTiming: {
    competitor: string;
    daysAfter: number;
    strategy: 'pre-empt' | 'immediate-counter' | 'delayed-counter' | 'independent';
    confidence: number;
  }[];
  searchInterestComparison: {
    keyword: string;
    peakValue: number;
    percentageOfLeader: number;
    interpretation: string;
  }[];
  competitiveInsights: string[];
  recommendedTiming: {
    avoid: string[]; // Time periods to avoid
    opportunity: string[]; // Time windows with less competition
    reasoning: string;
  };
}

/**
 * Analyze competitive dynamics
 */
export async function analyzeCompetition(
  primaryKeyword: string,
  primaryPeakDate: Date,
  primaryPeakValue: number,
  competitorKeywords: string[],
  historicalData: HistoricalPeak[]
): Promise<CompetitiveAnalysis> {
  // Find competitor peaks around the same time (±60 days)
  const timeWindow = 60 * 24 * 60 * 60 * 1000; // 60 days in milliseconds
  const primaryTime = primaryPeakDate.getTime();

  const competitorPeaks = competitorKeywords
    .map(keyword => {
      const peaks = historicalData
        .filter(p => p.keyword.toLowerCase() === keyword.toLowerCase())
        .filter(p => Math.abs(p.date.getTime() - primaryTime) <= timeWindow)
        .sort((a, b) => b.value - a.value); // Sort by magnitude

      return peaks.length > 0
        ? {
            name: keyword,
            keyword: keyword,
            peakDate: peaks[0].date,
            peakValue: peaks[0].magnitude,
            timingRelativeToLeader: Math.round(
              (peaks[0].date.getTime() - primaryTime) / (24 * 60 * 60 * 1000)
            ),
          }
        : null;
    })
    .filter(Boolean) as CompetitorData[];

  // Identify market leader (highest search volume)
  const allPeaks = [
    { name: primaryKeyword, value: primaryPeakValue },
    ...competitorPeaks.map(c => ({ name: c.name, value: c.peakValue })),
  ];

  const totalVolume = allPeaks.reduce((sum, p) => sum + p.value, 0);
  const leader = allPeaks.reduce((max, p) => (p.value > max.value ? p : max));

  const marketLeader = {
    name: leader.name,
    keyword: leader.name,
    dominance: Math.round((leader.value / totalVolume) * 100),
  };

  // Analyze competitor timing strategies
  const competitorTiming = competitorPeaks.map(comp => {
    let strategy: 'pre-empt' | 'immediate-counter' | 'delayed-counter' | 'independent';
    let confidence = 80;

    if (Math.abs(comp.timingRelativeToLeader) > 30) {
      strategy = 'independent';
      confidence = 60; // Lower confidence - might be coincidence
    } else if (comp.timingRelativeToLeader < -7) {
      strategy = 'pre-empt';
    } else if (comp.timingRelativeToLeader >= -7 && comp.timingRelativeToLeader <= 7) {
      strategy = 'immediate-counter';
    } else {
      strategy = 'delayed-counter';
    }

    return {
      competitor: comp.name,
      daysAfter: comp.timingRelativeToLeader,
      strategy,
      confidence,
    };
  });

  // Compare search interest
  const searchInterestComparison = competitorPeaks.map(comp => {
    const percentageOfLeader = Math.round((comp.peakValue / leader.value) * 100);
    let interpretation = '';

    if (percentageOfLeader >= 80) {
      interpretation = 'Highly competitive - near-parity in search interest';
    } else if (percentageOfLeader >= 50) {
      interpretation = 'Moderately competitive - significant but lower interest';
    } else if (percentageOfLeader >= 25) {
      interpretation = 'Secondary player - notable presence but limited';
    } else {
      interpretation = 'Niche player - minimal search interest compared to leader';
    }

    return {
      keyword: comp.keyword,
      peakValue: comp.peakValue,
      percentageOfLeader,
      interpretation,
    };
  });

  // Generate competitive insights
  const competitiveInsights = generateCompetitiveInsights(
    primaryKeyword,
    marketLeader,
    competitorTiming,
    searchInterestComparison
  );

  // Recommend timing strategy
  const recommendedTiming = generateTimingRecommendations(
    primaryKeyword,
    marketLeader,
    competitorTiming,
    primaryPeakDate
  );

  return {
    marketLeader,
    competitorTiming,
    searchInterestComparison,
    competitiveInsights,
    recommendedTiming,
  };
}

/**
 * Generate competitive insights
 */
function generateCompetitiveInsights(
  primaryKeyword: string,
  marketLeader: CompetitiveAnalysis['marketLeader'],
  competitorTiming: CompetitiveAnalysis['competitorTiming'],
  searchComparison: CompetitiveAnalysis['searchInterestComparison']
): string[] {
  const insights: string[] = [];

  // Market leader insight
  if (marketLeader) {
    if (marketLeader.keyword === primaryKeyword) {
      insights.push(
        `${marketLeader.name} is the market leader with ${marketLeader.dominance}% of search interest. This is your keyword - you're setting the narrative.`
      );
    } else {
      insights.push(
        `${marketLeader.name} dominates with ${marketLeader.dominance}% of search interest. ${primaryKeyword} is responding to ${marketLeader.name}'s moves.`
      );
    }
  }

  // Timing pattern insights
  const preemptors = competitorTiming.filter(c => c.strategy === 'pre-empt');
  const immediateCounters = competitorTiming.filter(c => c.strategy === 'immediate-counter');
  const delayedCounters = competitorTiming.filter(c => c.strategy === 'delayed-counter');

  if (preemptors.length > 0) {
    insights.push(
      `${preemptors.map(c => c.competitor).join(', ')} announced ${Math.abs(preemptors[0].daysAfter)} days BEFORE ${marketLeader?.name}, attempting to steal thunder.`
    );
  }

  if (immediateCounters.length > 0) {
    insights.push(
      `${immediateCounters.map(c => c.competitor).join(', ')} responded within ${Math.max(...immediateCounters.map(c => Math.abs(c.daysAfter)))} days - aggressive counter-positioning.`
    );
  }

  if (delayedCounters.length > 0) {
    const avgDelay = Math.round(
      delayedCounters.reduce((sum, c) => sum + c.daysAfter, 0) / delayedCounters.length
    );
    insights.push(
      `${delayedCounters.map(c => c.competitor).join(', ')} waited ${avgDelay} days to announce - avoiding direct competition for attention.`
    );
  }

  // Search volume insights
  const strongCompetitors = searchComparison.filter(c => c.percentageOfLeader >= 50);
  if (strongCompetitors.length > 0) {
    insights.push(
      `Strong competition: ${strongCompetitors.map(c => c.keyword).join(', ')} achieved ${strongCompetitors[0].percentageOfLeader}%+ of leader's search volume.`
    );
  }

  return insights;
}

/**
 * Generate timing recommendations
 */
function generateTimingRecommendations(
  primaryKeyword: string,
  marketLeader: CompetitiveAnalysis['marketLeader'],
  competitorTiming: CompetitiveAnalysis['competitorTiming'],
  primaryPeakDate: Date
): CompetitiveAnalysis['recommendedTiming'] {
  const avoid: string[] = [];
  const opportunity: string[] = [];
  let reasoning = '';

  if (!marketLeader) {
    return {
      avoid: [],
      opportunity: ['No clear competitive pattern detected - timing flexibility high'],
      reasoning: 'Insufficient competitive data for timing recommendations.',
    };
  }

  // Identify congested periods (avoid)
  const congestedPeriod = new Date(primaryPeakDate);
  congestedPeriod.setDate(congestedPeriod.getDate() - 7);
  const congestedEnd = new Date(primaryPeakDate);
  congestedEnd.setDate(congestedEnd.getDate() + 14);

  avoid.push(
    `${congestedPeriod.toLocaleDateString()} - ${congestedEnd.toLocaleDateString()} (congested with ${marketLeader.name} announcement and ${competitorTiming.length} competitor responses)`
  );

  // Identify opportunity windows
  const preemptWindow = new Date(primaryPeakDate);
  preemptWindow.setDate(preemptWindow.getDate() - 30);
  const preemptEnd = new Date(primaryPeakDate);
  preemptEnd.setDate(preemptEnd.getDate() - 14);

  opportunity.push(
    `${preemptWindow.toLocaleDateString()} - ${preemptEnd.toLocaleDateString()} (2-4 weeks before ${marketLeader.name} - steal thunder strategy)`
  );

  const delayedWindow = new Date(primaryPeakDate);
  delayedWindow.setDate(delayedWindow.getDate() + 21);
  const delayedEnd = new Date(primaryPeakDate);
  delayedEnd.setDate(delayedEnd.getDate() + 45);

  opportunity.push(
    `${delayedWindow.toLocaleDateString()} - ${delayedEnd.toLocaleDateString()} (3-6 weeks after ${marketLeader.name} - avoid noise, differentiate on analysis)`
  );

  // Generate reasoning
  if (marketLeader.keyword === primaryKeyword) {
    reasoning = `As the market leader, you set the timing. Expect ${competitorTiming.length} competitors to respond within 21 days. Maintain first-mover advantage by announcing early and often.`;
  } else {
    const avgResponseTime = Math.round(
      competitorTiming.reduce((sum, c) => sum + Math.abs(c.daysAfter), 0) / competitorTiming.length
    );
    reasoning = `${marketLeader.name} sets the cadence. Competitors typically respond in ${avgResponseTime} days. Either pre-empt (14+ days before) or differentiate (21+ days after) to avoid direct competition for attention.`;
  }

  return {
    avoid,
    opportunity,
    reasoning,
  };
}

/**
 * Format competitive analysis for display
 */
export function formatCompetitiveAnalysis(analysis: CompetitiveAnalysis): string {
  return `
🎯 COMPETITIVE INTELLIGENCE

Market Leadership:
${analysis.marketLeader ? `→ ${analysis.marketLeader.name} dominates with ${analysis.marketLeader.dominance}% of search interest` : '→ No clear market leader'}

Search Interest Comparison:
${analysis.searchInterestComparison
  .map(
    c =>
      `→ ${c.keyword}: ${c.peakValue} (${c.percentageOfLeader}% of leader)\n   ${c.interpretation}`
  )
  .join('\n')}

Competitive Timing:
${analysis.competitorTiming
  .map(c => {
    const timing = c.daysAfter === 0 ? 'same day' : c.daysAfter < 0 ? `${Math.abs(c.daysAfter)} days before` : `${c.daysAfter} days after`;
    return `→ ${c.competitor}: ${timing} (${c.strategy.replace('-', ' ')})`;
  })
  .join('\n')}

Key Insights:
${analysis.competitiveInsights.map(i => `• ${i}`).join('\n')}

📅 RECOMMENDED TIMING STRATEGY

⚠️  Avoid These Periods:
${analysis.recommendedTiming.avoid.map(a => `→ ${a}`).join('\n')}

💡 Opportunity Windows:
${analysis.recommendedTiming.opportunity.map(o => `→ ${o}`).join('\n')}

Strategy: ${analysis.recommendedTiming.reasoning}
`.trim();
}
