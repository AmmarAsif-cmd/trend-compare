/**
 * Multi-Source Data Orchestrator
 * Manages fallback between different data sources
 * Ensures system always works even if APIs fail
 */

import type {
  DataSourceAdapter,
  MultiSourceData,
  SourceResult,
  SourceDataPoint,
  FallbackConfig,
  SourceHealth,
  DataSourceType,
} from './types';
import { GoogleTrendsAdapter } from './adapters/google-trends';
import { GitHubAdapter } from './adapters/github';

const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  strategy: 'priority', // Try sources in priority order
  minSources: 1, // At least 1 source must succeed
  combineMethod: 'weighted',
  weights: {
    'google-trends': 1.0,
    'github': 0.6,
    'hackernews': 0.5,
  },
};

export class DataOrchestrator {
  private adapters: Map<DataSourceType, DataSourceAdapter>;
  private healthCache: Map<DataSourceType, SourceHealth>;
  private config: FallbackConfig;

  constructor(config: Partial<FallbackConfig> = {}) {
    this.config = { ...DEFAULT_FALLBACK_CONFIG, ...config };
    this.adapters = new Map();
    this.healthCache = new Map();

    // Initialize adapters (in priority order)
    this.registerAdapter(new GoogleTrendsAdapter()); // Priority 1 - most reliable
    // Reddit adapter removed - no longer used as data source
    this.registerAdapter(new GitHubAdapter());       // Priority 2
  }

  /**
   * Register a data source adapter
   */
  registerAdapter(adapter: DataSourceAdapter): void {
    if (adapter.config.enabled) {
      this.adapters.set(adapter.name, adapter);
    }
  }

  /**
   * Fetch data with automatic fallback
   */
  async fetchWithFallback(
    term: string,
    startDate: Date,
    endDate: Date,
    primarySource: DataSourceType = 'google-trends'
  ): Promise<MultiSourceData> {
    const startTime = Date.now();

    // Get adapters in priority order
    const sortedAdapters = this.getSortedAdapters(primarySource);

    const results: SourceResult[] = [];
    let successCount = 0;

    if (this.config.strategy === 'parallel') {
      // Try all sources in parallel
      const promises = sortedAdapters.map(adapter =>
        this.fetchFromSource(adapter, term, startDate, endDate)
      );

      const allResults = await Promise.allSettled(promises);

      for (const result of allResults) {
        if (result.status === 'fulfilled' && result.value.status !== 'failed') {
          results.push(result.value);
          successCount++;
        } else if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      }
    } else if (this.config.strategy === 'priority') {
      // Try sources in order until we have enough successful ones
      for (const adapter of sortedAdapters) {
        const result = await this.fetchFromSource(adapter, term, startDate, endDate);
        results.push(result);

        if (result.status === 'active' || result.status === 'degraded') {
          successCount++;
        }

        // Stop if we have enough successful sources
        if (successCount >= this.config.minSources) {
          break;
        }
      }
    } else {
      // 'fastest' strategy - race all sources
      const promises = sortedAdapters.map(adapter =>
        this.fetchFromSource(adapter, term, startDate, endDate)
      );

      const firstSuccess = await Promise.race(promises);
      results.push(firstSuccess);
      successCount = firstSuccess.status !== 'failed' ? 1 : 0;
    }

    // Determine primary source (best available)
    const primary = this.selectPrimarySource(results);

    // Combine data from all successful sources
    const combined = this.combineSourceData(results);

    // Calculate overall confidence
    const confidence = this.calculateOverallConfidence(results);

    // Calculate completeness
    const completeness = this.calculateCompleteness(combined, startDate, endDate);

    return {
      term,
      sources: results,
      primary,
      combined,
      confidence,
      completeness,
      metadata: {
        sourcesUsed: results
          .filter(r => r.status !== 'failed')
          .map(r => r.source),
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        fetchedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Fetch from a single source with error handling
   */
  private async fetchFromSource(
    adapter: DataSourceAdapter,
    term: string,
    startDate: Date,
    endDate: Date
  ): Promise<SourceResult> {
    const startTime = Date.now();

    try {
      const result = await adapter.fetchTimeSeries(term, startDate, endDate);

      // Update health cache
      const responseTime = Date.now() - startTime;
      this.updateHealthCache(adapter.name, result.status, responseTime);

      return result;
    } catch (error) {
      console.error(`Error fetching from ${adapter.name}:`, error);

      this.updateHealthCache(adapter.name, 'failed', Date.now() - startTime);

      return {
        source: adapter.name,
        status: 'failed',
        data: [],
        metadata: {
          term,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          dataPoints: 0,
          confidence: 0,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
        fetchedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Get adapters sorted by priority
   */
  private getSortedAdapters(primarySource: DataSourceType): DataSourceAdapter[] {
    const adapters = Array.from(this.adapters.values());

    return adapters.sort((a, b) => {
      // Prioritize the requested primary source
      if (a.name === primarySource) return -1;
      if (b.name === primarySource) return 1;

      // Then sort by configured priority
      return a.config.priority - b.config.priority;
    });
  }

  /**
   * Select the best primary source from results
   */
  private selectPrimarySource(results: SourceResult[]): SourceResult | null {
    // Filter successful results
    const successful = results.filter(
      r => r.status === 'active' || r.status === 'degraded'
    );

    if (successful.length === 0) return null;

    // Sort by confidence and data points
    successful.sort((a, b) => {
      const scoreA = a.metadata.confidence * 0.7 + a.metadata.dataPoints * 0.3;
      const scoreB = b.metadata.confidence * 0.7 + b.metadata.dataPoints * 0.3;
      return scoreB - scoreA;
    });

    return successful[0];
  }

  /**
   * Combine data from multiple sources
   */
  private combineSourceData(results: SourceResult[]): SourceDataPoint[] {
    const successful = results.filter(r => r.data.length > 0);

    if (successful.length === 0) return [];

    if (this.config.combineMethod === 'primary-only') {
      const primary = this.selectPrimarySource(successful);
      return primary?.data ?? [];
    }

    // Build a map of date -> values from each source
    const dateMap = new Map<string, Map<DataSourceType, SourceDataPoint>>();

    for (const result of successful) {
      for (const point of result.data) {
        if (!dateMap.has(point.date)) {
          dateMap.set(point.date, new Map());
        }
        dateMap.get(point.date)!.set(result.source, point);
      }
    }

    // Combine values for each date
    const combined: SourceDataPoint[] = [];

    for (const [date, sourcePoints] of dateMap.entries()) {
      let combinedValue = 0;
      let totalWeight = 0;

      if (this.config.combineMethod === 'weighted') {
        // Weighted average
        for (const [source, point] of sourcePoints.entries()) {
          const weight = this.config.weights?.[source] ?? 0.5;
          combinedValue += point.value * weight;
          totalWeight += weight;
        }

        combinedValue = totalWeight > 0 ? combinedValue / totalWeight : 0;
      } else {
        // Simple average
        for (const point of sourcePoints.values()) {
          combinedValue += point.value;
        }

        combinedValue = combinedValue / sourcePoints.size;
      }

      combined.push({
        date,
        value: Math.round(combinedValue),
        source: 'google-trends', // Combined data uses primary source type
      });
    }

    // Sort by date
    return combined.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Calculate overall confidence from all sources
   */
  private calculateOverallConfidence(results: SourceResult[]): number {
    const successful = results.filter(
      r => r.status === 'active' || r.status === 'degraded'
    );

    if (successful.length === 0) return 0;

    // Average confidence, weighted by number of data points
    let totalConfidence = 0;
    let totalDataPoints = 0;

    for (const result of successful) {
      totalConfidence += result.metadata.confidence * result.metadata.dataPoints;
      totalDataPoints += result.metadata.dataPoints;
    }

    const avgConfidence = totalDataPoints > 0 ? totalConfidence / totalDataPoints : 0;

    // Boost confidence if we have multiple sources agreeing
    const multiSourceBonus = Math.min(20, (successful.length - 1) * 10);

    return Math.min(100, avgConfidence + multiSourceBonus);
  }

  /**
   * Calculate data completeness (% of date range covered)
   */
  private calculateCompleteness(
    data: SourceDataPoint[],
    startDate: Date,
    endDate: Date
  ): number {
    if (data.length === 0) return 0;

    // Calculate expected number of days
    const msPerDay = 24 * 60 * 60 * 1000;
    const expectedDays = Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay) + 1;

    // Calculate actual coverage
    const actualDays = data.length;

    return Math.min(100, (actualDays / expectedDays) * 100);
  }

  /**
   * Update health cache for a source
   */
  private updateHealthCache(
    source: DataSourceType,
    status: 'active' | 'degraded' | 'failed' | 'rate-limited',
    responseTime: number
  ): void {
    const existing = this.healthCache.get(source);

    const successRate = existing
      ? status === 'active'
        ? Math.min(100, existing.successRate + 5)
        : Math.max(0, existing.successRate - 10)
      : status === 'active'
      ? 100
      : 0;

    this.healthCache.set(source, {
      source,
      status,
      lastChecked: new Date().toISOString(),
      responseTime,
      successRate,
      rateLimitRemaining: this.adapters.get(source)?.getRateLimitStatus().remaining ?? 0,
    });
  }

  /**
   * Get health status for all sources
   */
  async getHealthStatus(): Promise<SourceHealth[]> {
    const health: SourceHealth[] = [];

    for (const adapter of this.adapters.values()) {
      const cached = this.healthCache.get(adapter.name);

      if (cached) {
        health.push(cached);
      } else {
        // Perform health check
        const isHealthy = await adapter.healthCheck();
        const status: 'active' | 'failed' = isHealthy ? 'active' : 'failed';

        const healthStatus: SourceHealth = {
          source: adapter.name,
          status,
          lastChecked: new Date().toISOString(),
          responseTime: 0,
          successRate: isHealthy ? 100 : 0,
          rateLimitRemaining: adapter.getRateLimitStatus().remaining,
        };

        this.healthCache.set(adapter.name, healthStatus);
        health.push(healthStatus);
      }
    }

    return health;
  }

  /**
   * Clear health cache
   */
  clearHealthCache(): void {
    this.healthCache.clear();
  }
}

/**
 * Singleton instance for easy import
 */
export const dataOrchestrator = new DataOrchestrator();
