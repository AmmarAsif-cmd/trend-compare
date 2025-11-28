/**
 * Main Insights Analyzer
 * Orchestrates all pattern detection and generates complete insights
 * NO AI - Pure statistical analysis
 */

import type { SeriesPoint } from '@/lib/trends';
import type {
  EnrichedDataPoint,
  InsightPackage,
  SeasonalPattern,
  SpikeEvent,
} from './core/types';
import { enrichWithTemporalFeatures } from './core/temporal';
import { detectSeasonalPatterns } from './patterns/seasonal';
import { detectSpikes, detectAnomalies } from './patterns/spikes';
import { analyzeTrend, compareTrends, detectTrendChanges } from './patterns/trends';
import {
  analyzeVolatility,
  compareVolatility,
  detectVolatilityPeriods,
  detectBollingerBreakouts,
} from './patterns/volatility';

export type AnalyzerConfig = {
  // Thresholds
  minDataPoints?: number; // Minimum data needed (default: 30)
  seasonalityMinConfidence?: number; // 0-1 (default: 0.7)
  spikeThresholdStdDev?: number; // Standard deviations (default: 2)
  minSpikeMagnitude?: number; // Percentage (default: 20)

  // Feature flags
  enableSeasonality?: boolean; // Default: true
  enableSpikes?: boolean; // Default: true
  enableTrends?: boolean; // Default: true
  enableVolatility?: boolean; // Default: true
  enableComparison?: boolean; // Default: true (for 2-term comparisons)

  // Performance
  maxInsightsPerType?: number; // Limit insights per category (default: 5)
};

const DEFAULT_CONFIG: Required<AnalyzerConfig> = {
  minDataPoints: 30,
  seasonalityMinConfidence: 0.7,
  spikeThresholdStdDev: 2,
  minSpikeMagnitude: 20,
  enableSeasonality: true,
  enableSpikes: true,
  enableTrends: true,
  enableVolatility: true,
  enableComparison: true,
  maxInsightsPerType: 5,
};

/**
 * Main entry point: Analyze a comparison and generate insights
 */
export async function analyzeComparison(
  terms: string[],
  series: SeriesPoint[],
  config: AnalyzerConfig = {}
): Promise<InsightPackage | null> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Validate input
  if (terms.length === 0 || series.length < cfg.minDataPoints) {
    return null;
  }

  // Enrich data with temporal features for ML-ready analysis
  const enrichedSeries = enrichWithTemporalFeatures(series);

  // Analyze each term individually
  const termInsights = await Promise.all(
    terms.slice(0, 2).map(term => analyzeTerm(term, enrichedSeries, cfg, terms))
  );

  // If we have 2 terms, do comparative analysis
  let comparison = null;
  if (terms.length === 2 && cfg.enableComparison) {
    comparison = analyzeComparison2Terms(
      terms[0],
      terms[1],
      enrichedSeries,
      cfg
    );
  }

  // Generate summary
  const summary = generateSummary(terms, termInsights, comparison);

  // Calculate overall confidence (based on data quality and pattern strength)
  const confidence = calculateOverallConfidence(enrichedSeries, termInsights);

  return {
    terms,
    dataPoints: series.length,
    dateRange: {
      start: series[0].date,
      end: series[series.length - 1].date,
    },
    summary,
    confidence: Math.round(confidence),
    termInsights,
    comparison,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Analyze a single term
 */
async function analyzeTerm(
  term: string,
  series: EnrichedDataPoint[],
  config: Required<AnalyzerConfig>,
  allTerms: string[] = []
) {
  const insights: {
    seasonal: SeasonalPattern[];
    spikes: SpikeEvent[];
    anomalies: SpikeEvent[];
    trend: any;
    volatility: any;
    trendChanges: any[];
    volatilityPeriods: any[];
    bollingerBreakouts: any[];
  } = {
    seasonal: [],
    spikes: [],
    anomalies: [],
    trend: null,
    volatility: null,
    trendChanges: [],
    volatilityPeriods: [],
    bollingerBreakouts: [],
  };

  try {
    // Seasonal patterns
    if (config.enableSeasonality && series.length >= 60) {
      insights.seasonal = detectSeasonalPatterns(
        series,
        term,
        config.seasonalityMinConfidence
      ).slice(0, config.maxInsightsPerType);
    }

    // Spikes and anomalies
    if (config.enableSpikes) {
      insights.spikes = detectSpikes(
        series,
        term,
        config.spikeThresholdStdDev,
        config.minSpikeMagnitude,
        allTerms // Pass all terms for better event matching
      ).slice(0, config.maxInsightsPerType);

      insights.anomalies = detectAnomalies(
        series,
        term,
        allTerms // Pass all terms for better event matching
      ).slice(0, config.maxInsightsPerType);
    }

    // Trend analysis
    if (config.enableTrends) {
      insights.trend = analyzeTrend(series, term);
      insights.trendChanges = detectTrendChanges(series, term)
        .slice(0, config.maxInsightsPerType);
    }

    // Volatility analysis
    if (config.enableVolatility) {
      insights.volatility = analyzeVolatility(series, term);
      insights.volatilityPeriods = detectVolatilityPeriods(series, term)
        .slice(0, config.maxInsightsPerType);
      insights.bollingerBreakouts = detectBollingerBreakouts(series, term)
        .slice(0, config.maxInsightsPerType);
    }
  } catch (error) {
    console.error(`Error analyzing term "${term}":`, error);
  }

  return {
    term,
    ...insights,
  };
}

/**
 * Comparative analysis for 2 terms
 */
function analyzeComparison2Terms(
  termA: string,
  termB: string,
  series: EnrichedDataPoint[],
  config: Required<AnalyzerConfig>
) {
  const comparison: {
    trend: any;
    volatility: any;
    leader: string | null;
    gap: number;
    correlation: number;
    insights: string[];
  } = {
    trend: null,
    volatility: null,
    leader: null,
    gap: 0,
    correlation: 0,
    insights: [],
  };

  try {
    // Trend comparison
    if (config.enableTrends) {
      comparison.trend = compareTrends(series, termA, termB);

      if (comparison.trend) {
        comparison.leader = comparison.trend.winner;
        comparison.gap = comparison.trend.gap;
        comparison.correlation = comparison.trend.correlation;
      }
    }

    // Volatility comparison
    if (config.enableVolatility) {
      comparison.volatility = compareVolatility(series, termA, termB);
    }

    // Generate comparative insights
    comparison.insights = generateComparativeInsights(
      termA,
      termB,
      comparison
    );
  } catch (error) {
    console.error(`Error in comparative analysis:`, error);
  }

  return comparison;
}

/**
 * Generate summary text
 */
function generateSummary(
  terms: string[],
  termInsights: any[],
  comparison: any
): string {
  const parts: string[] = [];

  // Overall trend
  if (terms.length === 1 && termInsights[0]?.trend) {
    const trend = termInsights[0].trend;
    parts.push(`${terms[0]} shows ${trend.direction} trend with ${trend.strength}% strength`);
  } else if (terms.length === 2 && comparison?.leader) {
    parts.push(`${comparison.leader} is trending stronger`);
  } else if (terms.length === 2) {
    parts.push(`${terms[0]} vs ${terms[1]} showing similar momentum`);
  }

  // Notable patterns
  for (const ti of termInsights) {
    // Strongest seasonal pattern
    if (ti.seasonal && ti.seasonal.length > 0) {
      const strongest = ti.seasonal[0];
      parts.push(`${ti.term} shows ${strongest.period} seasonality`);
    }

    // Significant spikes
    if (ti.spikes && ti.spikes.length > 0) {
      const topSpike = ti.spikes[0];
      parts.push(`Notable spike in ${ti.term}: ${Math.round(topSpike.magnitude)}% surge`);
    }

    // Volatility
    if (ti.volatility) {
      parts.push(`${ti.term} volatility: ${ti.volatility.level}`);
    }
  }

  // Limit to 3-4 key insights
  return parts.slice(0, 4).join('. ') + '.';
}

/**
 * Generate comparative insights
 */
function generateComparativeInsights(
  termA: string,
  termB: string,
  comparison: any
): string[] {
  const insights: string[] = [];

  // Trend insights
  if (comparison.trend) {
    const { winner, convergence, correlation } = comparison.trend;

    if (winner) {
      insights.push(`${winner} is gaining momentum faster`);
    }

    if (convergence === 'converging') {
      insights.push(`The gap between ${termA} and ${termB} is narrowing`);
    } else if (convergence === 'diverging') {
      insights.push(`${termA} and ${termB} are diverging in popularity`);
    }

    if (Math.abs(correlation) > 0.7) {
      insights.push(`Highly correlated trends (${Math.round(correlation * 100)}%)`);
    } else if (Math.abs(correlation) < 0.3) {
      insights.push(`Independent trends with low correlation`);
    }
  }

  // Volatility insights
  if (comparison.volatility) {
    const { moreStable, stabilitygap } = comparison.volatility;

    if (stabilitygap > 20) {
      insights.push(`${moreStable} shows significantly more stable interest`);
    }
  }

  return insights.slice(0, 3);
}

/**
 * Calculate overall confidence score (0-100)
 * Based on data quality and pattern strength
 */
function calculateOverallConfidence(
  series: EnrichedDataPoint[],
  termInsights: any[]
): number {
  let confidence = 0;

  // Data quantity (up to 30 points)
  const dataScore = Math.min(30, (series.length / 200) * 30);
  confidence += dataScore;

  // Pattern detection success (up to 40 points)
  let patternScore = 0;
  for (const ti of termInsights) {
    if (ti.trend?.confidence) {
      patternScore += ti.trend.confidence * 0.2;
    }
    if (ti.volatility?.consistency) {
      patternScore += ti.volatility.consistency * 0.1;
    }
    if (ti.seasonal.length > 0) {
      patternScore += 10;
    }
  }
  confidence += Math.min(40, patternScore);

  // Data quality (up to 30 points)
  let qualityScore = 30;
  for (const ti of termInsights) {
    if (ti.volatility?.riskScore > 70) {
      qualityScore -= 10; // High risk reduces confidence
    }
  }
  confidence += Math.max(0, qualityScore);

  return Math.min(100, confidence);
}

/**
 * Quick analysis (faster, fewer features)
 * Use for real-time or preview purposes
 */
export async function analyzeComparisonQuick(
  terms: string[],
  series: SeriesPoint[]
): Promise<InsightPackage | null> {
  return analyzeComparison(terms, series, {
    minDataPoints: 7,
    enableSeasonality: false, // Skip for speed
    enableSpikes: true,
    enableTrends: true,
    enableVolatility: false, // Skip for speed
    maxInsightsPerType: 3,
  });
}

/**
 * Deep analysis (all features, maximum insights)
 * Use for cached/pre-generated content
 */
export async function analyzeComparisonDeep(
  terms: string[],
  series: SeriesPoint[]
): Promise<InsightPackage | null> {
  return analyzeComparison(terms, series, {
    minDataPoints: 30,
    seasonalityMinConfidence: 0.6, // Lower threshold for more insights
    enableSeasonality: true,
    enableSpikes: true,
    enableTrends: true,
    enableVolatility: true,
    enableComparison: true,
    maxInsightsPerType: 10,
  });
}

/**
 * Export analysis results to ML-ready format
 * For future predictive modeling
 */
export function exportForML(insight: InsightPackage): {
  features: Record<string, any>;
  metadata: Record<string, any>;
} {
  const features: Record<string, any> = {};
  const metadata: Record<string, any> = {
    terms: insight.terms,
    dataPoints: insight.dataPoints,
    dateRange: insight.dateRange,
    confidence: insight.confidence,
  };

  // Extract numerical features for ML
  for (const ti of insight.termInsights) {
    const prefix = `${ti.term}_`;

    // Trend features
    if (ti.trend) {
      features[`${prefix}momentum`] = ti.trend.momentum;
      features[`${prefix}acceleration`] = ti.trend.acceleration;
      features[`${prefix}slope`] = ti.trend.slope;
      features[`${prefix}r_squared`] = ti.trend.rSquared;
      features[`${prefix}trend_strength`] = ti.trend.strength;
    }

    // Volatility features
    if (ti.volatility) {
      features[`${prefix}volatility_cv`] = ti.volatility.coefficientOfVariation;
      features[`${prefix}stability`] = ti.volatility.stability;
      features[`${prefix}consistency`] = ti.volatility.consistency;
      features[`${prefix}risk_score`] = ti.volatility.riskScore;
    }

    // Pattern counts
    features[`${prefix}seasonal_patterns`] = ti.seasonal.length;
    features[`${prefix}spike_count`] = ti.spikes.length;
    features[`${prefix}anomaly_count`] = ti.anomalies.length;
  }

  // Comparison features
  if (insight.comparison) {
    if (insight.comparison.trend) {
      features.comparison_gap = insight.comparison.gap;
      features.comparison_correlation = insight.comparison.correlation;
    }
  }

  return { features, metadata };
}
