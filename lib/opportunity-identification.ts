/**
 * Opportunity Identification Module
 * Identifies content, keyword, and timing opportunities
 */

export interface KeywordOpportunity {
  keyword: string;
  estimatedSearchVolume: number;
  competition: 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
  competitionScore: number; // 0-100
  difficulty: 'easy' | 'medium' | 'hard' | 'very-hard';
  trafficPotential: {
    minimum: number;
    maximum: number;
    confidence: number;
  };
  relevanceScore: number; // 0-100, how relevant to the peak
  priority: 'high' | 'medium' | 'low';
}

export interface ContentOpportunity {
  title: string;
  angle: string;
  timing: {
    publishWindow: { start: Date; end: Date };
    optimalDay: Date;
    urgency: 'critical' | 'high' | 'medium' | 'low';
  };
  targetKeywords: string[];
  estimatedTraffic: {
    minimum: number;
    maximum: number;
  };
  contentType: 'news' | 'analysis' | 'comparison' | 'guide' | 'tutorial' | 'opinion';
  strategicValue: string; // Why this content matters
}

export interface TimingOpportunity {
  type: 'pre-announcement' | 'breaking-news' | 'post-analysis' | 'evergreen';
  window: { start: Date; end: Date };
  daysRemaining: number;
  trafficPotential: number; // Percentage of total opportunity
  actionRequired: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

export interface OpportunityAnalysis {
  keywords: KeywordOpportunity[];
  content: ContentOpportunity[];
  timing: TimingOpportunity[];
  competitiveGaps: string[]; // What competitors are NOT covering
  contrarianAngles: string[]; // Opposite perspectives that get engagement
  summary: {
    highestROI: ContentOpportunity | null;
    quickestWin: ContentOpportunity | null;
    longestTail: ContentOpportunity | null;
  };
}

/**
 * Identify opportunities related to a peak
 */
export async function identifyOpportunities(
  primaryKeyword: string,
  peakDate: Date,
  peakValue: number,
  relatedQueries: string[],
  currentDate: Date = new Date()
): Promise<OpportunityAnalysis> {
  // Analyze keyword opportunities
  const keywords = analyzeKeywordOpportunities(primaryKeyword, relatedQueries, peakValue);

  // Generate content opportunities
  const content = generateContentOpportunities(primaryKeyword, peakDate, keywords, currentDate);

  // Identify timing opportunities
  const timing = identifyTimingOpportunities(peakDate, currentDate);

  // Find competitive gaps
  const competitiveGaps = identifyCompetitiveGaps(primaryKeyword, relatedQueries);

  // Generate contrarian angles
  const contrarianAngles = generateContrarianAngles(primaryKeyword);

  // Summarize opportunities
  const summary = summarizeOpportunities(content);

  return {
    keywords,
    content,
    timing,
    competitiveGaps,
    contrarianAngles,
    summary,
  };
}

/**
 * Analyze keyword opportunities
 */
function analyzeKeywordOpportunities(
  primaryKeyword: string,
  relatedQueries: string[],
  baseVolume: number
): KeywordOpportunity[] {
  // Common question patterns
  const questionPatterns = [
    `${primaryKeyword} vs`,
    `is ${primaryKeyword} worth it`,
    `should i buy ${primaryKeyword}`,
    `${primaryKeyword} review`,
    `${primaryKeyword} pros and cons`,
    `best ${primaryKeyword}`,
    `${primaryKeyword} alternative`,
    `how to choose ${primaryKeyword}`,
  ];

  const opportunities: KeywordOpportunity[] = questionPatterns.map(keyword => {
    // Estimate search volume (derived from base peak value)
    const volumeMultiplier = keyword.includes('vs') ? 0.15 : keyword.includes('review') ? 0.12 : keyword.includes('worth it') ? 0.08 : 0.05;

    const estimatedSearchVolume = Math.round(baseVolume * volumeMultiplier * 1000);

    // Estimate competition (question-based queries typically have lower competition)
    const isQuestion = keyword.includes('should') || keyword.includes('is') || keyword.includes('how to');
    const competitionScore = isQuestion ? 25 : 40;
    const competition = competitionScore < 20 ? 'very-low' : competitionScore < 40 ? 'low' : competitionScore < 60 ? 'medium' : competitionScore < 80 ? 'high' : 'very-high';

    // Difficulty assessment
    const difficulty = competitionScore < 30 ? 'easy' : competitionScore < 50 ? 'medium' : competitionScore < 70 ? 'hard' : 'very-hard';

    // Traffic potential
    const trafficPotential = {
      minimum: Math.round(estimatedSearchVolume * 0.05), // 5% conversion
      maximum: Math.round(estimatedSearchVolume * 0.25), // 25% conversion if well-ranked
      confidence: isQuestion ? 75 : 60,
    };

    // Relevance score (how directly related to the peak)
    const relevanceScore = keyword.includes('vs') ? 95 : keyword.includes('review') ? 85 : keyword.includes('worth') ? 80 : 70;

    // Priority
    const priority = relevanceScore >= 85 && competitionScore < 40 ? 'high' : relevanceScore >= 70 || competitionScore < 50 ? 'medium' : 'low';

    return {
      keyword,
      estimatedSearchVolume,
      competition,
      competitionScore,
      difficulty,
      trafficPotential,
      relevanceScore,
      priority,
    };
  });

  // Sort by priority and traffic potential
  return opportunities
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.trafficPotential.maximum - a.trafficPotential.maximum;
    })
    .slice(0, 6); // Top 6 opportunities
}

/**
 * Generate content opportunities
 */
function generateContentOpportunities(
  primaryKeyword: string,
  peakDate: Date,
  keywords: KeywordOpportunity[],
  currentDate: Date
): ContentOpportunity[] {
  const daysSincePeak = Math.round((currentDate.getTime() - peakDate.getTime()) / (1000 * 60 * 60 * 24));

  const opportunities: ContentOpportunity[] = [];

  // News coverage (Days 0-2)
  if (daysSincePeak <= 2) {
    opportunities.push({
      title: `${primaryKeyword}: Breaking News and What It Means`,
      angle: 'Real-time news coverage with immediate analysis',
      timing: {
        publishWindow: { start: peakDate, end: new Date(peakDate.getTime() + 48 * 60 * 60 * 1000) },
        optimalDay: peakDate,
        urgency: 'critical',
      },
      targetKeywords: [primaryKeyword, `${primaryKeyword} news`, `${primaryKeyword} announcement`],
      estimatedTraffic: {
        minimum: 5000,
        maximum: 15000,
      },
      contentType: 'news',
      strategicValue: 'Capture 80% of traffic surge during peak Days 0-2. High competition but massive volume.',
    });
  }

  // Comparison content (Days 1-7)
  if (daysSincePeak <= 7) {
    const comparisonKeyword = keywords.find(k => k.keyword.includes('vs'));
    opportunities.push({
      title: `${primaryKeyword} Comparison: Complete Analysis`,
      angle: 'Data-driven comparison addressing user decision-making',
      timing: {
        publishWindow: { start: new Date(peakDate.getTime() + 24 * 60 * 60 * 1000), end: new Date(peakDate.getTime() + 7 * 24 * 60 * 60 * 1000) },
        optimalDay: new Date(peakDate.getTime() + 2 * 24 * 60 * 60 * 1000),
        urgency: daysSincePeak <= 3 ? 'high' : 'medium',
      },
      targetKeywords: comparisonKeyword ? [comparisonKeyword.keyword] : [`${primaryKeyword} vs`],
      estimatedTraffic: {
        minimum: comparisonKeyword?.trafficPotential.minimum || 1000,
        maximum: comparisonKeyword?.trafficPotential.maximum || 5000,
      },
      contentType: 'comparison',
      strategicValue: 'Users researching decisions post-announcement. Lower competition than news, sustained traffic.',
    });
  }

  // Analysis/Review (Days 3-14)
  if (daysSincePeak >= 3 && daysSincePeak <= 14) {
    const reviewKeyword = keywords.find(k => k.keyword.includes('review') || k.keyword.includes('worth'));
    opportunities.push({
      title: `${primaryKeyword} Deep Dive: Is It Worth It?`,
      angle: 'Analytical review with pros/cons and recommendations',
      timing: {
        publishWindow: { start: new Date(peakDate.getTime() + 3 * 24 * 60 * 60 * 1000), end: new Date(peakDate.getTime() + 14 * 24 * 60 * 60 * 1000) },
        optimalDay: new Date(peakDate.getTime() + 5 * 24 * 60 * 60 * 1000),
        urgency: daysSincePeak <= 10 ? 'medium' : 'low',
      },
      targetKeywords: reviewKeyword ? [reviewKeyword.keyword] : [`${primaryKeyword} review`],
      estimatedTraffic: {
        minimum: reviewKeyword?.trafficPotential.minimum || 800,
        maximum: reviewKeyword?.trafficPotential.maximum || 3000,
      },
      contentType: 'analysis',
      strategicValue: 'Capture users in consideration phase. Medium competition, good conversion rates.',
    });
  }

  // Evergreen guide (Days 7+)
  opportunities.push({
    title: `Complete Guide to ${primaryKeyword} [${peakDate.getFullYear()}]`,
    angle: 'Comprehensive evergreen resource with latest data',
    timing: {
      publishWindow: { start: new Date(peakDate.getTime() + 7 * 24 * 60 * 60 * 1000), end: new Date(peakDate.getTime() + 60 * 24 * 60 * 60 * 1000) },
      optimalDay: new Date(peakDate.getTime() + 14 * 24 * 60 * 60 * 1000),
      urgency: 'low',
    },
    targetKeywords: [`best ${primaryKeyword}`, `${primaryKeyword} guide`, `how to choose ${primaryKeyword}`],
    estimatedTraffic: {
      minimum: 500,
      maximum: 2000,
    },
    contentType: 'guide',
    strategicValue: 'Long-tail SEO play. Sustained monthly traffic for 6-12 months. Update yearly.',
  });

  // Contrarian opinion (any time, but effective Days 3-7)
  if (daysSincePeak >= 3 && daysSincePeak <= 14) {
    opportunities.push({
      title: `Why You Should Skip ${primaryKeyword} (Unpopular Opinion)`,
      angle: 'Contrarian take highlighting drawbacks and alternatives',
      timing: {
        publishWindow: { start: new Date(peakDate.getTime() + 3 * 24 * 60 * 60 * 1000), end: new Date(peakDate.getTime() + 14 * 24 * 60 * 60 * 1000) },
        optimalDay: new Date(peakDate.getTime() + 5 * 24 * 60 * 60 * 1000),
        urgency: 'medium',
      },
      targetKeywords: [`${primaryKeyword} alternative`, `should i skip ${primaryKeyword}`, `${primaryKeyword} problems`],
      estimatedTraffic: {
        minimum: 1000,
        maximum: 4000,
      },
      contentType: 'opinion',
      strategicValue: 'Contrarian content gets 3x more engagement (negativity bias). Targets skeptics.',
    });
  }

  return opportunities.filter(o => o.timing.publishWindow.end >= currentDate); // Only future opportunities
}

/**
 * Identify timing opportunities
 */
function identifyTimingOpportunities(peakDate: Date, currentDate: Date): TimingOpportunity[] {
  const daysSincePeak = Math.round((currentDate.getTime() - peakDate.getTime()) / (1000 * 60 * 60 * 24));

  const opportunities: TimingOpportunity[] = [];

  // Breaking news window (Days 0-2)
  const breakingNewsEnd = new Date(peakDate.getTime() + 2 * 24 * 60 * 60 * 1000);
  if (currentDate <= breakingNewsEnd) {
    opportunities.push({
      type: 'breaking-news',
      window: { start: peakDate, end: breakingNewsEnd },
      daysRemaining: Math.max(0, Math.round((breakingNewsEnd.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))),
      trafficPotential: 80,
      actionRequired: 'Publish news coverage immediately. Update every 6-12 hours if story develops.',
      urgency: 'critical',
    });
  }

  // Analysis window (Days 3-14)
  const analysisStart = new Date(peakDate.getTime() + 3 * 24 * 60 * 60 * 1000);
  const analysisEnd = new Date(peakDate.getTime() + 14 * 24 * 60 * 60 * 1000);
  if (currentDate >= analysisStart && currentDate <= analysisEnd) {
    opportunities.push({
      type: 'post-analysis',
      window: { start: analysisStart, end: analysisEnd },
      daysRemaining: Math.max(0, Math.round((analysisEnd.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))),
      trafficPotential: 15,
      actionRequired: 'Publish in-depth analysis, comparisons, and reviews. Focus on helping decision-making.',
      urgency: daysSincePeak <= 7 ? 'high' : 'medium',
    });
  }

  // Evergreen window (Days 7+)
  const evergreenStart = new Date(peakDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  if (currentDate >= evergreenStart) {
    opportunities.push({
      type: 'evergreen',
      window: { start: evergreenStart, end: new Date(peakDate.getTime() + 365 * 24 * 60 * 60 * 1000) },
      daysRemaining: 365,
      trafficPotential: 5,
      actionRequired: 'Create comprehensive evergreen content. Optimize for long-tail SEO.',
      urgency: 'low',
    });
  }

  return opportunities;
}

/**
 * Identify competitive gaps
 */
function identifyCompetitiveGaps(primaryKeyword: string, relatedQueries: string[]): string[] {
  return [
    `In-depth cost-of-ownership analysis (most coverage focuses on purchase price, not total cost)`,
    `Long-term reliability data (3-5 year ownership experience)`,
    `Niche use-case comparisons (e.g., "${primaryKeyword} for photographers" vs generic reviews)`,
    `Localized analysis (pricing, availability, and support vary by region)`,
    `Accessibility features (often ignored in mainstream coverage)`,
    `Environmental impact / sustainability analysis (growing user concern)`,
  ];
}

/**
 * Generate contrarian angles
 */
function generateContrarianAngles(primaryKeyword: string): string[] {
  return [
    `"Why ${primaryKeyword} is NOT worth upgrading" - Targets skeptics, gets 3x engagement`,
    `"The hidden costs of ${primaryKeyword} nobody talks about" - Exposes overlooked expenses`,
    `"I returned my ${primaryKeyword} - Here's why" - Personal narrative, high credibility`,
    `"${primaryKeyword} vs [older model]: Is the upgrade actually worth it?" - Challenges conventional wisdom`,
    `"What ${primaryKeyword} gets WRONG" - Critical analysis, balanced perspective`,
  ];
}

/**
 * Summarize opportunities
 */
function summarizeOpportunities(
  content: ContentOpportunity[]
): OpportunityAnalysis['summary'] {
  if (content.length === 0) {
    return {
      highestROI: null,
      quickestWin: null,
      longestTail: null,
    };
  }

  // Highest ROI: Best traffic potential vs effort
  const highestROI = content.reduce((best, curr) =>
    curr.estimatedTraffic.maximum > best.estimatedTraffic.maximum ? curr : best
  );

  // Quickest win: Shortest time to publish + reasonable traffic
  const quickestWin = content
    .filter(c => c.timing.urgency === 'critical' || c.timing.urgency === 'high')
    .sort((a, b) => a.timing.optimalDay.getTime() - b.timing.optimalDay.getTime())[0] || content[0];

  // Longest tail: Evergreen content
  const longestTail = content.find(c => c.contentType === 'guide') || content[content.length - 1];

  return {
    highestROI,
    quickestWin,
    longestTail,
  };
}

/**
 * Format opportunity analysis for display
 */
export function formatOpportunityAnalysis(analysis: OpportunityAnalysis): string {
  return `
💡 OPPORTUNITY IDENTIFICATION

🎯 High-Value Keywords (Top 6):
${analysis.keywords
  .map(
    (k, i) =>
      `${i + 1}. "${k.keyword}"
   → Est. searches: ${k.estimatedSearchVolume.toLocaleString()}/month | ${k.competition} competition
   → Traffic potential: ${k.trafficPotential.minimum.toLocaleString()}-${k.trafficPotential.maximum.toLocaleString()} visitors
   → Difficulty: ${k.difficulty} | Priority: ${k.priority.toUpperCase()}`
  )
  .join('\n\n')}

📝 Content Opportunities:
${analysis.content
  .map(
    c =>
      `• ${c.title}
   Type: ${c.contentType} | Urgency: ${c.timing.urgency}
   Publish: ${c.timing.optimalDay.toLocaleDateString()}
   Traffic: ${c.estimatedTraffic.minimum.toLocaleString()}-${c.estimatedTraffic.maximum.toLocaleString()} visitors
   Value: ${c.strategicValue}`
  )
  .join('\n\n')}

📅 Timing Windows:
${analysis.timing
  .map(
    t =>
      `${t.type.toUpperCase()}:
   → ${t.daysRemaining} days remaining | ${t.trafficPotential}% of total traffic
   → ${t.actionRequired}`
  )
  .join('\n\n')}

🔍 Competitive Gaps (Underserved Topics):
${analysis.competitiveGaps.map((g, i) => `${i + 1}. ${g}`).join('\n')}

⚡ Contrarian Angles (3x Engagement):
${analysis.contrarianAngles.map((a, i) => `${i + 1}. ${a}`).join('\n')}

🏆 TOP RECOMMENDATIONS:
${analysis.summary.highestROI ? `→ Highest ROI: "${analysis.summary.highestROI.title}" (${analysis.summary.highestROI.estimatedTraffic.maximum.toLocaleString()} max traffic)` : ''}
${analysis.summary.quickestWin ? `→ Quickest Win: "${analysis.summary.quickestWin.title}" (${analysis.summary.quickestWin.timing.urgency} urgency)` : ''}
${analysis.summary.longestTail ? `→ Long-tail SEO: "${analysis.summary.longestTail.title}" (sustained traffic)` : ''}
`.trim();
}
