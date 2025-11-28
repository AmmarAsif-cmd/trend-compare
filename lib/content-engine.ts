/**
 * Content Engine - Main Integration API
 * Brings together multi-source fetching, pattern detection, and narrative generation
 * Single entry point for the compare page
 */

import type { SeriesPoint } from './trends';
import type { InsightPackage } from './insights/core/types';
import type { GeneratedNarrative } from './insights/narrative';
import type { MultiSourceData } from './sources/types';
import { dataOrchestrator } from './sources/orchestrator';
import { analyzeComparison, analyzeComparisonDeep } from './insights/analyzer';
import { generateNarrative } from './insights/narrative';

export type ContentEngineResult = {
  insights: InsightPackage;
  narrative: GeneratedNarrative;
  sources: MultiSourceData | null;
  performance: {
    dataFetchMs: number;
    analysisMs: number;
    narrativeMs: number;
    totalMs: number;
  };
};

export type ContentEngineConfig = {
  // Data fetching
  useMultiSource?: boolean; // Try fallback sources if primary fails
  primarySource?: 'google-trends' | 'reddit' | 'wikipedia' | 'github';
  fallbackEnabled?: boolean;

  // Analysis depth
  deepAnalysis?: boolean; // More thorough but slower

  // Performance
  timeout?: number; // Max time to spend (ms)
  cacheResults?: boolean; // Not implemented yet, placeholder
};

const DEFAULT_CONFIG: ContentEngineConfig = {
  useMultiSource: true,
  primarySource: 'google-trends',
  fallbackEnabled: true,
  deepAnalysis: false,
  timeout: 30000,
  cacheResults: false,
};

/**
 * Generate unique content for a comparison
 * Main API for compare page
 */
export async function generateComparisonContent(
  terms: string[],
  series: SeriesPoint[],
  config: ContentEngineConfig = {}
): Promise<ContentEngineResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const startTime = Date.now();

  // Track performance
  let dataFetchMs = 0;
  let analysisMs = 0;
  let narrativeMs = 0;

  // Step 1: Multi-source data fetching (optional)
  let multiSourceData: MultiSourceData | null = null;

  if (cfg.useMultiSource && series.length > 0) {
    const fetchStart = Date.now();

    try {
      // Determine date range from existing series
      const startDate = new Date(series[0].date);
      const endDate = new Date(series[series.length - 1].date);

      // Fetch supplementary data from other sources
      // Note: This supplements the primary Google Trends data
      // In a future iteration, this could replace Google Trends entirely
      multiSourceData = await dataOrchestrator.fetchWithFallback(
        terms[0], // For now, fetch first term only
        startDate,
        endDate,
        cfg.primarySource
      );
    } catch (error) {
      console.error('Multi-source fetch failed:', error);
      // Continue with existing series data
    }

    dataFetchMs = Date.now() - fetchStart;
  }

  // Step 2: Pattern detection and analysis
  const analysisStart = Date.now();

  const insights = cfg.deepAnalysis
    ? await analyzeComparisonDeep(terms, series)
    : await analyzeComparison(terms, series);

  if (!insights) {
    throw new Error('Failed to generate insights - insufficient data');
  }

  analysisMs = Date.now() - analysisStart;

  // Step 3: Narrative generation
  const narrativeStart = Date.now();

  const narrative = generateNarrative(insights);

  narrativeMs = Date.now() - narrativeStart;

  // Total time
  const totalMs = Date.now() - startTime;

  return {
    insights,
    narrative,
    sources: multiSourceData,
    performance: {
      dataFetchMs,
      analysisMs,
      narrativeMs,
      totalMs,
    },
  };
}

/**
 * Quick preview generation (minimal analysis)
 * For real-time/preview purposes
 */
export async function generateQuickPreview(
  terms: string[],
  series: SeriesPoint[]
): Promise<{
  headline: string;
  summary: string;
  confidence: number;
}> {
  const insights = await analyzeComparison(terms, series, {
    minDataPoints: 7,
    enableSeasonality: false,
    enableVolatility: false,
    maxInsightsPerType: 2,
  });

  if (!insights) {
    return {
      headline: `${terms.join(' vs ')}: Trend Comparison`,
      summary: 'Analyzing search interest patterns...',
      confidence: 0,
    };
  }

  const narrative = generateNarrative(insights);

  return {
    headline: narrative.headline,
    summary: narrative.subtitle,
    confidence: insights.confidence,
  };
}

/**
 * Generate SEO metadata
 */
export async function generateSEOMetadata(
  terms: string[],
  series: SeriesPoint[]
): Promise<{
  title: string;
  description: string;
  keywords: string[];
}> {
  try {
    const insights = await analyzeComparison(terms, series);

    if (!insights) {
      return {
        title: `${terms.join(' vs ')} - Trend Comparison`,
        description: `Compare search trends for ${terms.join(' and ')}`,
        keywords: terms,
      };
    }

    const narrative = generateNarrative(insights);

    // Extract keywords from insights
    const keywords = [
      ...terms,
      'trend comparison',
      'search interest',
      'popularity analysis',
    ];

    // Add detected patterns as keywords
    for (const ti of insights.termInsights) {
      if (ti.trend) {
        keywords.push(`${ti.term} ${ti.trend.direction.replace('-', ' ')}`);
      }

      if (ti.seasonal && ti.seasonal.length > 0) {
        keywords.push(`${ti.term} seasonal`);
      }
    }

    return {
      title: narrative.headline,
      description: narrative.seoDescription,
      keywords: [...new Set(keywords)], // Deduplicate
    };
  } catch (error) {
    console.error('SEO metadata generation failed:', error);

    return {
      title: `${terms.join(' vs ')} - Trend Comparison`,
      description: `Compare search trends for ${terms.join(' and ')}`,
      keywords: terms,
    };
  }
}

/**
 * Check if content would be unique
 * Returns a score 0-100 (higher = more unique)
 */
export async function checkContentUniqueness(
  terms: string[],
  series: SeriesPoint[]
): Promise<number> {
  try {
    const insights = await analyzeComparison(terms, series);

    if (!insights) return 0;

    const narrative = generateNarrative(insights);

    return narrative.uniquenessScore;
  } catch {
    return 0;
  }
}

/**
 * Get data source health status
 */
export async function getDataSourceHealth() {
  return dataOrchestrator.getHealthStatus();
}

/**
 * Batch generate content for multiple comparisons
 * Useful for pre-generating popular comparisons
 */
export async function batchGenerateContent(
  comparisons: Array<{ terms: string[]; series: SeriesPoint[] }>,
  config: ContentEngineConfig = {}
): Promise<ContentEngineResult[]> {
  const results: ContentEngineResult[] = [];

  // Process in parallel with limit to avoid overwhelming APIs
  const batchSize = 5;

  for (let i = 0; i < comparisons.length; i += batchSize) {
    const batch = comparisons.slice(i, i + batchSize);

    const batchResults = await Promise.allSettled(
      batch.map(c => generateComparisonContent(c.terms, c.series, config))
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
    }

    // Small delay between batches to respect rate limits
    if (i + batchSize < comparisons.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return results;
}

/**
 * Export all components for direct access if needed
 */
export { analyzeComparison, analyzeComparisonDeep } from './insights/analyzer';
export { generateNarrative } from './insights/narrative';
export { dataOrchestrator } from './sources/orchestrator';
export type { InsightPackage } from './insights/core/types';
export type { GeneratedNarrative } from './insights/narrative';
export type { MultiSourceData } from './sources/types';
