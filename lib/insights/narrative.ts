/**
 * Narrative Generation
 * Converts statistical insights into human-readable content
 * NO AI - Rule-based text generation using actual data
 */

import type { InsightPackage } from './core/types';
import { formatDate } from './core/temporal';

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

  // Main trend description
  content += `${trend.description}. `;

  // Momentum details
  if (Math.abs(trend.momentum) > 10) {
    const direction = trend.momentum > 0 ? 'accelerating' : 'decelerating';
    content += `Current momentum is ${direction} at ${Math.abs(Math.round(trend.momentum))}%. `;
  }

  // Strength and confidence
  content += `Trend strength is ${getTrendStrengthLabel(trend.strength)} (${trend.strength}/100) `;
  content += `with ${getConfidenceLabel(trend.confidence)} confidence. `;

  // Volatility context
  if (volatility) {
    content += `Interest levels are ${volatility.level.replace('-', ' ')}, `;
    content += `showing ${Math.round(volatility.stability)}% stability. `;
  }

  // Trend changes
  if (trendChanges.length > 0) {
    content += 'Notable trend changes: ';
    const changes = trendChanges.slice(0, 2).map((tc: any) => {
      const date = formatDate(tc.date, 'short');
      return `${tc.description} on ${date}`;
    });
    content += changes.join('; ') + '. ';
  }

  // Projection (if available and strong trend)
  if (trend.projectedChange30d && trend.rSquared > 0.5) {
    const direction = trend.projectedChange30d > 0 ? 'increase' : 'decrease';
    content += `If current trends continue, expect a ${Math.abs(Math.round(trend.projectedChange30d))}% ${direction} over the next 30 days.`;
  }

  return {
    title: `Trend Analysis: ${term}`,
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

  // Leader
  if (comp.leader) {
    content += `${comp.leader} is currently trending stronger, `;
    content += `with a ${Math.round(comp.gap)}% momentum advantage. `;
  } else {
    content += `Both terms show similar momentum levels. `;
  }

  // Trend comparison
  if (comp.trend) {
    content += `The trends are ${comp.trend.convergence}, `;

    if (comp.trend.convergence === 'converging') {
      content += 'indicating the gap in popularity is narrowing. ';
    } else if (comp.trend.convergence === 'diverging') {
      content += 'with the leader pulling further ahead. ';
    } else {
      content += 'maintaining a relatively stable gap. ';
    }
  }

  // Correlation
  if (Math.abs(comp.correlation) > 0.7) {
    content += `High correlation (${Math.round(Math.abs(comp.correlation) * 100)}%) `;
    content += 'suggests these trends move together, likely influenced by similar factors. ';
  } else if (Math.abs(comp.correlation) < 0.3) {
    content += `Low correlation (${Math.round(Math.abs(comp.correlation) * 100)}%) `;
    content += 'indicates independent trends driven by different factors. ';
  }

  // Volatility comparison
  if (comp.volatility) {
    content += `${comp.volatility.moreStable} shows more consistent interest patterns `;
    content += `(${comp.volatility.stabilitygap}% more stable). `;
  }

  // Additional insights
  if (comp.insights && comp.insights.length > 0) {
    content += comp.insights.slice(0, 2).join('. ') + '.';
  }

  return {
    title: `${termA} vs ${termB}: Comparative Analysis`,
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

  let content = 'Detected recurring patterns in search interest: ';

  const descriptions: string[] = [];

  for (const pattern of seasonalPatterns.slice(0, 3)) {
    const { term, period, peakMonths, strength, confidence } = pattern as any;

    if (period === 'annual' && peakMonths) {
      const months = peakMonths.join(', ');
      descriptions.push(
        `${term} shows annual peaks during ${months} (${strength}% above average, ${Math.round(confidence * 100)}% confidence)`
      );
    } else if (period === 'weekly') {
      descriptions.push(
        `${term} exhibits weekly patterns (${strength}% variation)`
      );
    } else if (period === 'quarterly') {
      descriptions.push(
        `${term} follows quarterly cycles (${strength}% strength)`
      );
    }
  }

  content += descriptions.join('. ') + '. ';

  content += 'These patterns can help predict future interest and plan timing for related activities.';

  return {
    title: 'Seasonal Patterns',
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
  const events = insight.termInsights.flatMap(ti => [
    ...(ti.spikes || []).map((s: any) => ({ ...s, term: ti.term, eventType: 'spike' })),
    ...(ti.anomalies || []).map((a: any) => ({ ...a, term: ti.term, eventType: 'anomaly' })),
  ]);

  if (events.length === 0) return null;

  // Sort by magnitude
  events.sort((a, b) => b.magnitude - a.magnitude);

  let content = 'Notable interest surges and anomalies detected: ';

  const descriptions: string[] = [];

  for (const event of events.slice(0, 5)) {
    const date = formatDate(event.date, 'long');
    descriptions.push(
      `${event.term}: ${event.description}`
    );
  }

  content += descriptions.join('; ') + '. ';

  content += 'These events may represent product launches, news coverage, seasonal events, or other external factors driving interest.';

  return {
    title: 'Notable Events & Spikes',
    content,
    type: 'events',
    confidence: 85,
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

  // Overall trend
  for (const ti of insight.termInsights) {
    if (ti.trend && takeaways.length < 5) {
      takeaways.push(
        `${ti.term} is ${ti.trend.direction.replace('-', ' ')} with ${ti.trend.strength}% trend strength`
      );
    }
  }

  // Comparison winner
  if (insight.comparison?.leader && takeaways.length < 5) {
    takeaways.push(
      `${insight.comparison.leader} is currently trending ${Math.round(insight.comparison.gap)}% stronger`
    );
  }

  // Top spike
  for (const ti of insight.termInsights) {
    if (ti.spikes && ti.spikes.length > 0 && takeaways.length < 5) {
      const topSpike = ti.spikes[0];
      takeaways.push(
        `Largest spike: ${Math.round(topSpike.magnitude)}% surge in ${ti.term} on ${formatDate(topSpike.date, 'short')}`
      );
    }
  }

  // Seasonal pattern
  for (const ti of insight.termInsights) {
    if (ti.seasonal && ti.seasonal.length > 0 && takeaways.length < 5) {
      const pattern = ti.seasonal[0];
      takeaways.push(
        `${ti.term} shows ${pattern.period} seasonality with ${pattern.strength}% variation`
      );
    }
  }

  // Volatility
  for (const ti of insight.termInsights) {
    if (ti.volatility && takeaways.length < 5) {
      takeaways.push(
        `${ti.term} interest is ${ti.volatility.level.replace('-', ' ')} (${ti.volatility.stability}% stability score)`
      );
    }
  }

  return takeaways.slice(0, 5);
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
