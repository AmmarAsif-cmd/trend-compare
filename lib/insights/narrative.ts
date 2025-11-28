/**
 * Narrative Generation
 * Converts statistical insights into human-readable content
 * NO AI - Rule-based text generation using actual data
 */

import type { InsightPackage } from './core/types';
import { formatDate } from './core/temporal';
import { deduplicateEvents, sortByImportance, isMeaningfulInsight } from './utils/dedup';

export type NarrativeSection = {
  title: string;
  content: string;
  type: 'overview' | 'trend' | 'seasonal' | 'events' | 'comparison' | 'forecast';
  confidence: number; // 0-100
};

export type GeneratedNarrative = {
  headline: string; // Main title for the page
  subtitle: string; // Subheading
  sections: NarrativeSection[];
  keyTakeaways: string[]; // Bullet points (3-5)
  seoDescription: string; // Meta description
  uniquenessScore: number; // 0-100 (how unique is this content?)
};

/**
 * Generate complete narrative from insights
 */
export function generateNarrative(insight: InsightPackage): GeneratedNarrative {
  const sections: NarrativeSection[] = [];

  // Overview section
  sections.push(generateOverviewSection(insight));

  // Trend analysis section (for each term)
  for (const ti of insight.termInsights) {
    if (ti.trend) {
      sections.push(generateTrendSection(ti));
    }
  }

  // Comparison section (if 2 terms)
  if (insight.comparison && insight.terms.length === 2) {
    sections.push(generateComparisonSection(insight));
  }

  // Seasonal patterns section
  const seasonalSection = generateSeasonalSection(insight);
  if (seasonalSection) {
    sections.push(seasonalSection);
  }

  // Notable events section (spikes, anomalies)
  const eventsSection = generateEventsSection(insight);
  if (eventsSection) {
    sections.push(eventsSection);
  }

  // Generate headline and subtitle
  const { headline, subtitle } = generateHeadlines(insight);

  // Key takeaways (3-5 bullets)
  const keyTakeaways = generateKeyTakeaways(insight, sections);

  // SEO description
  const seoDescription = generateSEODescription(insight, keyTakeaways);

  // Calculate uniqueness score
  const uniquenessScore = calculateUniqueness(insight, sections);

  return {
    headline,
    subtitle,
    sections,
    keyTakeaways,
    seoDescription,
    uniquenessScore,
  };
}

/**
 * Generate overview section
 */
function generateOverviewSection(insight: InsightPackage): NarrativeSection {
  const { terms, dataPoints, dateRange } = insight;
  const startDate = formatDate(dateRange.start, 'long');
  const endDate = formatDate(dateRange.end, 'long');

  let content = '';

  // Opening sentence
  if (terms.length === 1) {
    content += `Analysis of search interest for "${terms[0]}" from ${startDate} to ${endDate}, based on ${dataPoints} data points. `;
  } else {
    content += `Comparative analysis of "${terms[0]}" vs "${terms[1]}" from ${startDate} to ${endDate}, based on ${dataPoints} data points. `;
  }

  // Add summary insights
  content += insight.summary + ' ';

  // Data quality note
  if (insight.confidence > 80) {
    content += 'High confidence analysis based on consistent data patterns.';
  } else if (insight.confidence > 60) {
    content += 'Moderate confidence analysis with some data variability.';
  } else {
    content += 'Analysis based on available data, though patterns show some inconsistency.';
  }

  return {
    title: 'Overview',
    content,
    type: 'overview',
    confidence: insight.confidence,
  };
}

/**
 * Generate trend section for a term
 */
function generateTrendSection(termInsight: any): NarrativeSection {
  const { term, trend, volatility, trendChanges } = termInsight;

  let content = '';

  // Main trend description - simplify it
  const simplifiedTrend = trend.description
    .replace(/with \d+% growth and \d+% momentum/gi, 'with steady growth')
    .replace(/showing \d+% growth/gi, 'showing growth')
    .replace(/with \d+% decline/gi, 'with declining interest')
    .replace(/Relatively stable with \d+% variation/gi, 'Search interest is fairly stable');

  content += `${simplifiedTrend}. `;

  // Momentum details - more human
  if (Math.abs(trend.momentum) > 10) {
    const direction = trend.momentum > 0 ? 'picking up steam' : 'slowing down';
    content += `The trend is ${direction}. `;
  }

  // Volatility context - simplify
  if (volatility) {
    const level = volatility.level.replace('-', ' ');
    if (level.includes('stable')) {
      content += 'Search volume stays pretty consistent from day to day. ';
    } else if (level.includes('volatile')) {
      content += 'Search volume tends to jump around quite a bit. ';
    } else {
      content += 'Search volume has some ups and downs, but nothing too extreme. ';
    }
  }

  // Trend changes - simplify
  if (trendChanges.length > 0) {
    content += 'We noticed some shifts: ';
    const changes = trendChanges.slice(0, 2).map((tc: any) => {
      const date = formatDate(tc.date, 'short');
      const desc = tc.description
        .replace(/Trend reversed from/gi, 'switched from')
        .replace(/acceleration/gi, 'growth sped up')
        .replace(/deceleration/gi, 'growth slowed');
      return `${desc} around ${date}`;
    });
    content += changes.join(', and ') + '. ';
  }

  // Projection - make it clearer
  if (trend.projectedChange30d && trend.rSquared > 0.5) {
    const change = Math.abs(Math.round(trend.projectedChange30d));
    if (trend.projectedChange30d > 0) {
      content += `If things keep going this way, we might see about ${change}% more searches in the next month.`;
    } else {
      content += `If the current pattern continues, searches could drop by around ${change}% in the next month.`;
    }
  }

  return {
    title: `${term}`,
    content,
    type: 'trend',
    confidence: trend.confidence,
  };
}

/**
 * Generate comparison section
 */
function generateComparisonSection(insight: InsightPackage): NarrativeSection {
  const [termA, termB] = insight.terms;
  const comp = insight.comparison!;

  let content = '';

  // Leader - make it clear and simple
  if (comp.leader) {
    const gap = Math.round(comp.gap);
    content += `Right now, ${comp.leader} is getting about ${gap}% more searches than the other. `;
  } else {
    content += `Both terms are getting a similar amount of searches. `;
  }

  // Trend comparison - simplify
  if (comp.trend) {
    if (comp.trend.convergence === 'converging') {
      content += 'The gap between them is getting smaller over time. ';
    } else if (comp.trend.convergence === 'diverging') {
      content += 'The gap between them is getting bigger. ';
    } else {
      content += 'The gap between them has stayed about the same. ';
    }
  }

  // Correlation
  if (Math.abs(comp.correlation) > 0.7) {
    content += 'These two terms tend to rise and fall together, ';
    content += 'which means they\'re likely influenced by similar events or factors. ';
  } else if (Math.abs(comp.correlation) < 0.3) {
    content += 'These trends move independently of each other, ';
    content += 'suggesting different factors drive interest in each term. ';
  }

  // Volatility comparison
  if (comp.volatility) {
    content += `${comp.volatility.moreStable} has more consistent search volumes, `;
    content += 'with less ups and downs over time. ';
  }

  // Additional insights
  if (comp.insights && comp.insights.length > 0) {
    content += comp.insights.slice(0, 2).join('. ') + '.';
  }

  return {
    title: `${termA} vs ${termB}`,
    content,
    type: 'comparison',
    confidence: 75, // Default confidence for comparison
  };
}

/**
 * Generate seasonal patterns section
 */
function generateSeasonalSection(insight: InsightPackage): NarrativeSection | null {
  const seasonalPatterns = insight.termInsights.flatMap(ti => ti.seasonal || []);

  if (seasonalPatterns.length === 0) return null;

  let content = 'We found some repeating patterns in when people search for these terms. ';

  const descriptions: string[] = [];

  for (const pattern of seasonalPatterns.slice(0, 3)) {
    const { term, period, peakMonths, strength } = pattern as any;

    if (period === 'annual' && peakMonths) {
      const months = peakMonths.join(' and ');
      descriptions.push(
        `${term} gets significantly more searches during ${months}, with interest about ${strength}% higher than usual`
      );
    } else if (period === 'weekly') {
      descriptions.push(
        `${term} shows a weekly pattern, where certain days of the week get noticeably more or less searches`
      );
    } else if (period === 'quarterly') {
      descriptions.push(
        `${term} follows a quarterly pattern throughout the year`
      );
    }
  }

  content += descriptions.join('. ') + '. ';

  content += 'Knowing these patterns can help you understand when interest typically peaks.';

  return {
    title: 'Recurring Patterns',
    content,
    type: 'seasonal',
    confidence: 70,
  };
}

/**
 * Generate notable events section
 */
function generateEventsSection(insight: InsightPackage): NarrativeSection | null {
  // Collect all spikes and anomalies
  let events = insight.termInsights.flatMap(ti => [
    ...(ti.spikes || []).map((s: any) => ({ ...s, term: ti.term, eventType: 'spike' })),
    ...(ti.anomalies || []).map((a: any) => ({ ...a, term: ti.term, eventType: 'anomaly' })),
  ]);

  if (events.length === 0) return null;

  // DEDUPLICATE - remove duplicate events
  events = deduplicateEvents(events);

  // SORT by importance (magnitude + context + recency)
  events = sortByImportance(events);

  // Only show events with context (real explanations), or top 3 without context
  const eventsWithContext = events.filter(e => e.context);
  const eventsWithoutContext = events.filter(e => !e.context);

  const finalEvents = [
    ...eventsWithContext.slice(0, 3),
    ...eventsWithoutContext.slice(0, Math.max(0, 3 - eventsWithContext.length)),
  ];

  if (finalEvents.length === 0) return null;

  let content = 'Here are the most notable moments when search interest jumped significantly: ';

  const descriptions: string[] = [];

  for (const event of finalEvents) {
    const date = formatDate(event.date, 'long');
    // The description now includes the event context from our database
    const friendlyDesc = event.description
      .replace(/surge/gi, 'increase in searches')
      .replace(/drop/gi, 'decrease in searches')
      .replace(/detected/gi, 'happened');

    descriptions.push(
      `On ${date}, ${event.term} - ${friendlyDesc}`
    );
  }

  content += descriptions.join('. ') + '. ';

  if (eventsWithContext.length > 0) {
    content += 'These spikes are linked to real product launches, announcements, and industry events.';
  } else {
    content += 'These spikes may be related to news events, product launches, or trending topics - we\'re working on identifying the specific causes.';
  }

  return {
    title: 'Standout Moments',
    content,
    type: 'events',
    confidence: eventsWithContext.length > 0 ? 90 : 70,
  };
}

/**
 * Generate headlines
 */
function generateHeadlines(insight: InsightPackage): { headline: string; subtitle: string } {
  const { terms } = insight;

  let headline = '';
  let subtitle = '';

  if (terms.length === 1) {
    const ti = insight.termInsights[0];

    // Headline based on trend
    if (ti.trend) {
      const direction = ti.trend.direction;
      const strength = ti.trend.strength;

      if (direction === 'strong-growth') {
        headline = `${terms[0]}: Surging Interest with ${strength}% Trend Strength`;
      } else if (direction === 'growth') {
        headline = `${terms[0]}: Growing Search Interest`;
      } else if (direction === 'strong-decline') {
        headline = `${terms[0]}: Declining Interest Trends`;
      } else {
        headline = `${terms[0]}: Search Interest Analysis`;
      }

      subtitle = ti.trend.description;
    } else {
      headline = `${terms[0]}: Search Interest Trends`;
      subtitle = insight.summary;
    }
  } else {
    // Two-term comparison
    const [termA, termB] = terms;

    if (insight.comparison?.leader) {
      headline = `${termA} vs ${termB}: ${insight.comparison.leader} Leading in Search Interest`;
      subtitle = `${insight.comparison.leader} shows ${Math.round(insight.comparison.gap)}% stronger momentum`;
    } else {
      headline = `${termA} vs ${termB}: Head-to-Head Trend Comparison`;
      subtitle = insight.summary;
    }
  }

  return { headline, subtitle };
}

/**
 * Generate key takeaways
 */
function generateKeyTakeaways(insight: InsightPackage, sections: NarrativeSection[]): string[] {
  const takeaways: string[] = [];

  // Comparison winner (most important)
  if (insight.comparison?.leader && takeaways.length < 5) {
    const gap = Math.round(insight.comparison.gap);
    if (gap >= 10) { // Only show if gap is significant
      takeaways.push(
        `${insight.comparison.leader} is currently trending ${gap}% stronger`
      );
    }
  }

  // Top spike (with context if available)
  for (const ti of insight.termInsights) {
    if (ti.spikes && ti.spikes.length > 0 && takeaways.length < 5) {
      const topSpike = ti.spikes[0];
      if (topSpike.magnitude >= 30) { // Only show significant spikes
        takeaways.push(
          `Biggest jump: ${Math.round(topSpike.magnitude)}% increase in searches in ${ti.term} on ${formatDate(topSpike.date, 'short')}`
        );
      }
    }
  }

  // Overall trend (ONLY if strength > 10%)
  for (const ti of insight.termInsights) {
    if (ti.trend && ti.trend.strength > 10 && takeaways.length < 5) {
      const direction = ti.trend.direction;
      if (direction.includes('growth')) {
        takeaways.push(
          `${ti.term} is showing ${ti.trend.strength}% growth trend`
        );
      } else if (direction.includes('decline')) {
        takeaways.push(
          `${ti.term} is showing ${ti.trend.strength}% decline`
        );
      }
    }
  }

  // Seasonal pattern (only if strong)
  for (const ti of insight.termInsights) {
    if (ti.seasonal && ti.seasonal.length > 0 && takeaways.length < 5) {
      const pattern = ti.seasonal[0];
      if (pattern.strength >= 20) { // Only show strong seasonal patterns
        takeaways.push(
          `${ti.term} shows ${pattern.period} seasonality with ${pattern.strength}% variation`
        );
      }
    }
  }

  // Filter out weak/meaningless takeaways
  const filtered = takeaways.filter(t => isMeaningfulInsight(t));

  return filtered.slice(0, 5);
}

/**
 * Generate SEO description
 */
function generateSEODescription(insight: InsightPackage, takeaways: string[]): string {
  const { terms, dateRange } = insight;

  let desc = '';

  if (terms.length === 1) {
    desc = `Comprehensive search interest analysis for ${terms[0]}. `;
  } else {
    desc = `Compare search trends: ${terms[0]} vs ${terms[1]}. `;
  }

  // Add first takeaway
  if (takeaways.length > 0) {
    desc += takeaways[0] + '. ';
  }

  // Add date range
  const startMonth = new Date(dateRange.start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const endMonth = new Date(dateRange.end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  desc += `Data from ${startMonth} to ${endMonth}.`;

  // Trim to 160 characters for SEO
  if (desc.length > 160) {
    desc = desc.substring(0, 157) + '...';
  }

  return desc;
}

/**
 * Calculate uniqueness score (0-100)
 * Higher = more unique content
 */
function calculateUniqueness(insight: InsightPackage, sections: NarrativeSection[]): number {
  let score = 0;

  // Data-driven content (not generic)
  score += 20;

  // Number of specific dates/numbers mentioned
  const totalContent = sections.map(s => s.content).join(' ');
  const dateMatches = totalContent.match(/\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2} \w+ \d{4}/g);
  const numberMatches = totalContent.match(/\d+%/g);

  score += Math.min(20, (dateMatches?.length || 0) * 5);
  score += Math.min(20, (numberMatches?.length || 0) * 2);

  // Unique patterns detected
  const uniquePatterns = insight.termInsights.reduce((sum, ti) => {
    return sum + (ti.seasonal?.length || 0) + (ti.spikes?.length || 0);
  }, 0);

  score += Math.min(20, uniquePatterns * 5);

  // Content length (more detail = more unique)
  const totalLength = sections.reduce((sum, s) => sum + s.content.length, 0);
  score += Math.min(20, (totalLength / 1000) * 10);

  return Math.min(100, score);
}

/**
 * Helper: Get trend strength label
 */
function getTrendStrengthLabel(strength: number): string {
  if (strength > 75) return 'very high';
  if (strength > 50) return 'high';
  if (strength > 25) return 'moderate';
  return 'low';
}

/**
 * Helper: Get confidence label
 */
function getConfidenceLabel(confidence: number): string {
  if (confidence > 80) return 'high';
  if (confidence > 60) return 'moderate';
  return 'limited';
}
