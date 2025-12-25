/**
 * InsightsPack is the final assembled object containing all insights
 * This is the canonical structure used by UI and exports
 */

import type { Signal } from './signals';
import type { Interpretation } from './interpretations';
import type { DecisionGuidance } from './decision-guidance';
import type { ForecastBundleSummary } from './forecast-bundle-summary';
import type { PeakNote } from './peak-note';
import type { AIInsights } from './ai-insights';
import type { SignalsSummary } from '../signals-summary';
import { INSIGHT_VERSION } from './versions';

export interface InsightsPack {
  /** Version of the insight framework used */
  version: string;
  
  /** Comparison identifier (slug) */
  slug: string;
  
  /** Terms being compared */
  terms: {
    termA: string;
    termB: string;
  };
  
  /** Timeframe of the comparison */
  timeframe: string;
  
  /** Geographic region */
  geo: string;
  
  /** Category of the comparison */
  category?: string;
  
  /** Detected signals (structured summary - single source of truth) */
  signals: SignalsSummary;
  
  /** Interpretations of the signals */
  interpretations: Interpretation[];
  
  /** Decision guidance (role-specific, optional) */
  decisionGuidance?: {
    marketer?: DecisionGuidance[];
    founder?: DecisionGuidance[];
  };
  
  /** Forecast summaries for both terms */
  forecasts: {
    termA?: ForecastBundleSummary;
    termB?: ForecastBundleSummary;
  };
  
  /** Peak notes for both terms */
  peaks: {
    termA: PeakNote[];
    termB: PeakNote[];
  };
  
  /** Optional AI-enhanced insights */
  aiInsights?: AIInsights;
  
  /** Hash of the entire insights pack for cache invalidation */
  insightsHash: string;
  
  /** Hash of the underlying data used to generate insights */
  dataHash: string;
  
  /** When this insights pack was generated */
  generatedAt: string; // ISO 8601 date string
  
  /** Data freshness information */
  dataFreshness: {
    /** When the underlying data was last updated */
    lastUpdatedAt: string;
    /** Source of the data */
    source: string;
  };
}

/**
 * Create an empty InsightsPack with default values
 */
export function createEmptyInsightsPack(
  slug: string,
  termA: string,
  termB: string,
  timeframe: string,
  geo: string
): InsightsPack {
  return {
    version: INSIGHT_VERSION,
    slug,
    terms: { termA, termB },
    timeframe,
    geo,
    signals: {
      winner: 'tie',
      marginPoints: 0,
      momentumA: 50,
      momentumB: 50,
      volatilityA: 'low',
      volatilityB: 'low',
      seriesTypeA: 'stable',
      seriesTypeB: 'stable',
      leaderChangeRisk: 'low',
      confidenceOverall: 50,
      computedAt: new Date().toISOString(),
      dataFreshness: {
        lastUpdatedAt: new Date().toISOString(),
        source: 'unknown',
      },
    },
    interpretations: [],
    forecasts: {},
    peaks: {
      termA: [],
      termB: [],
    },
    insightsHash: '',
    dataHash: '',
    generatedAt: new Date().toISOString(),
    dataFreshness: {
      lastUpdatedAt: new Date().toISOString(),
      source: 'unknown',
    },
  };
}

