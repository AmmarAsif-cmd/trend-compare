/**
 * Stage E: Build InsightsPack from all components
 * 
 * Assembles Signals, Interpretations, DecisionGuidance, Forecasts, Peaks, and AI Insights
 * into the final InsightsPack structure matching contracts.
 */

import type { InsightsPack } from './contracts/insights-pack';
import type { Interpretation } from './contracts/interpretations';
import type { DecisionGuidance } from './contracts/decision-guidance';
import type { ForecastBundleSummary } from './contracts/forecast-bundle-summary';
import type { PeakNote } from './contracts/peak-note';
import type { AIInsights } from './contracts/ai-insights';
import type { SignalsSummary } from './signals-summary';
import { INSIGHT_VERSION } from './contracts/versions';
import { stableHash } from '../cache/hash';

export interface BuildInsightsPackInput {
  slug: string;
  termA: string;
  termB: string;
  timeframe: string;
  geo: string;
  category?: string;
  signals: SignalsSummary; // Structured signals summary (not Signal[])
  interpretations: Interpretation[];
  decisionGuidance?: {
    marketer?: DecisionGuidance[];
    founder?: DecisionGuidance[];
  };
  forecasts?: {
    termA?: ForecastBundleSummary;
    termB?: ForecastBundleSummary;
  };
  peaks?: {
    termA?: PeakNote[];
    termB?: PeakNote[];
  };
  aiInsights?: AIInsights;
  dataHash: string;
  dataSource: string;
  lastUpdatedAt: string;
}

/**
 * Build the final InsightsPack from all components
 */
export function buildInsightsPack(input: BuildInsightsPackInput): InsightsPack {
  const {
    slug,
    termA,
    termB,
    timeframe,
    geo,
    category,
    signals,
    interpretations,
    decisionGuidance,
    forecasts,
    peaks,
    aiInsights,
    dataHash,
    dataSource,
    lastUpdatedAt,
  } = input;

  const now = new Date().toISOString();

  // Compute insightsHash from all components
  const insightsHash = computeInsightsHash({
    signals,
    interpretations,
    decisionGuidance,
    forecasts,
    peaks,
    aiInsights,
  });

  // Build the InsightsPack
  const pack: InsightsPack = {
    version: INSIGHT_VERSION,
    slug,
    terms: {
      termA,
      termB,
    },
    timeframe,
    geo,
    category,
    signals,
    interpretations,
    decisionGuidance: decisionGuidance || undefined,
    forecasts: forecasts || {},
    peaks: {
      termA: peaks?.termA || [],
      termB: peaks?.termB || [],
    },
    aiInsights: aiInsights || undefined,
    insightsHash,
    dataHash,
    generatedAt: now,
    dataFreshness: {
      lastUpdatedAt,
      source: dataSource,
    },
  };

  return pack;
}

/**
 * Compute stable hash of insights pack content
 */
function computeInsightsHash(input: {
  signals: SignalsSummary;
  interpretations: Interpretation[];
  decisionGuidance?: {
    marketer?: DecisionGuidance[];
    founder?: DecisionGuidance[];
  };
  forecasts?: {
    termA?: ForecastBundleSummary;
    termB?: ForecastBundleSummary;
  };
  peaks?: {
    termA?: PeakNote[];
    termB?: PeakNote[];
  };
  aiInsights?: AIInsights;
}): string {
  // Create a stable representation of all insights
  const hashInput = {
    signals: {
      winner: input.signals.winner,
      marginPoints: input.signals.marginPoints,
      seriesTypeA: input.signals.seriesTypeA,
      seriesTypeB: input.signals.seriesTypeB,
      leaderChangeRisk: input.signals.leaderChangeRisk,
      confidenceOverall: input.signals.confidenceOverall,
    },
    interpretations: input.interpretations.map(i => ({
      id: i.id,
      category: i.category,
      term: i.term,
    })),
    decisionGuidance: input.decisionGuidance ? {
      marketer: input.decisionGuidance.marketer?.map(g => ({
        id: g.id,
        action: g.action,
        term: g.term,
      })),
      founder: input.decisionGuidance.founder?.map(g => ({
        id: g.id,
        action: g.action,
        term: g.term,
      })),
    } : undefined,
    forecasts: input.forecasts ? {
      termA: input.forecasts.termA?.forecastHash,
      termB: input.forecasts.termB?.forecastHash,
    } : undefined,
    peaks: input.peaks ? {
      termA: input.peaks.termA?.map(p => p.peakHash),
      termB: input.peaks.termB?.map(p => p.peakHash),
    } : undefined,
    aiInsights: input.aiInsights?.aiInsightsHash,
  };

  return stableHash(hashInput);
}

