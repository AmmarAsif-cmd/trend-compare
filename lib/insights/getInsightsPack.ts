/**
 * Stage E: Get or Build InsightsPack with caching
 * 
 * Computes stable dataHash, uses cache with TTL 24h/stale 7d,
 * and returns InsightsPack with needsWarmup flag.
 */

import type { InsightsPack } from './contracts/insights-pack';
import type { Signal } from './contracts/signals';
import type { Interpretation } from './contracts/interpretations';
import type { DecisionGuidance } from './contracts/decision-guidance';
import type { ForecastBundleSummary } from './contracts/forecast-bundle-summary';
import type { PeakNote } from './contracts/peak-note';
import type { AIInsights } from './contracts/ai-insights';
import type { SeriesPoint } from '../trends';
import { buildInsightsPack, type BuildInsightsPackInput } from './buildInsightsPack';
import { createSignalsSummary } from './signals-summary';
import { computeDataHash } from '../forecast/dataHash';
import { createCacheKey } from '../cache/hash';
import { getOrSet } from '../cache';

export interface GetInsightsPackInput {
  slug: string;
  termA: string;
  termB: string;
  timeframe: string;
  geo: string;
  category?: string;
  series: SeriesPoint[];
  signals: Signal[]; // Signal array (will be converted to SignalsSummary)
  interpretations: Interpretation[];
  scores: {
    termA: { overall: number; breakdown: { momentum: number } };
    termB: { overall: number; breakdown: { momentum: number } };
  };
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
  dataSource: string;
  lastUpdatedAt: string;
}

export interface GetInsightsPackResult {
  pack: InsightsPack;
  needsWarmup: boolean;
}

/**
 * Get or build InsightsPack with caching
 * 
 * - Computes stable dataHash from cleaned series + timeframe + engine versions
 * - Uses cache.getOrSet with TTL 24h, stale 7d
 * - Returns cached InsightsPack if available
 * - If AI content missing, still returns deterministic InsightsPack with aiSections null
 * - Sets needsWarmup flag if forecast or AI sections missing
 */
export async function getInsightsPack(input: GetInsightsPackInput): Promise<GetInsightsPackResult> {
  const {
    slug,
    termA,
    termB,
    timeframe,
    geo,
    category,
    series,
    signals,
    interpretations,
    scores,
    decisionGuidance,
    forecasts,
    peaks,
    aiInsights,
    dataSource,
    lastUpdatedAt,
  } = input;

  // Compute stable dataHash from cleaned series points + timeframe + engine versions
  // Use shared computeDataHash function for consistency
  const dataHash = computeDataHash(series, timeframe, termA, termB);

  // Create cache key
  const cacheKey = createCacheKey('insights-pack', slug, dataHash);

  // Check if forecasts or AI insights are missing
  const hasForecasts = forecasts && (forecasts.termA || forecasts.termB);
  const hasAIInsights = aiInsights !== undefined && aiInsights !== null;

  // Determine if warmup is needed
  const needsWarmup = !hasForecasts || !hasAIInsights;

  // Convert Signal[] to SignalsSummary (structured object)
  const signalsSummary = createSignalsSummary(signals, scores, dataSource, lastUpdatedAt);

  // Build InsightsPack
  const buildPack = (): InsightsPack => {
    return buildInsightsPack({
      slug,
      termA,
      termB,
      timeframe,
      geo,
      category,
      signals: signalsSummary, // Pass structured signals summary
      interpretations,
      decisionGuidance,
      forecasts,
      peaks,
      aiInsights: hasAIInsights ? aiInsights : undefined,
      dataHash,
      dataSource,
      lastUpdatedAt,
    });
  };

  // Use cache.getOrSet with TTL 24h, stale 7d
  const ttlSeconds = 24 * 60 * 60; // 24 hours
  const staleTtlSeconds = 7 * 24 * 60 * 60; // 7 days

  const pack = await getOrSet(
    cacheKey,
    ttlSeconds,
    async () => buildPack(),
    {
      staleTtlSeconds,
      tags: [`insights:${slug}`, `data:${dataHash}`],
    }
  );

  return {
    pack,
    needsWarmup,
  };
}

// computeDataHash is now imported from '../forecast/dataHash' for consistency

