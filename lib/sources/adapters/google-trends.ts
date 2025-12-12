/**
 * Google Trends Data Source Adapter
 * Primary reliable source for search interest data
 */

import type {
  DataSourceAdapter,
  SourceConfig,
  SourceResult,
  SourceDataPoint,
} from '../types';
import { fetchSeriesGoogle, type TrendsOptions } from '@/lib/trends-google';

const DEFAULT_CONFIG: SourceConfig = {
  enabled: true,
  priority: 1, // Highest priority - most reliable
  timeout: 15000,
  retries: 3,
};

export class GoogleTrendsAdapter implements DataSourceAdapter {
  name = 'google-trends' as const;
  config: SourceConfig;

  private rateLimitRemaining: number = 100;
  private rateLimitResetAt: Date | null = null;

  constructor(config: Partial<SourceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Google Trends is considered healthy if we can import the function
      return typeof fetchSeriesGoogle === 'function';
    } catch {
      return false;
    }
  }

  async fetchTimeSeries(
    term: string,
    startDate: Date,
    endDate: Date
  ): Promise<SourceResult> {
    const startTime = Date.now();

    try {
      // Calculate timeframe from date range
      const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      let timeframe: TrendsOptions['timeframe'] = '12m';
      if (daysDiff <= 7) timeframe = '7d';
      else if (daysDiff <= 30) timeframe = '30d';
      else if (daysDiff <= 365) timeframe = '12m';
      else if (daysDiff <= 1825) timeframe = '5y';
      else timeframe = 'all';

      // Fetch data from Google Trends
      const series = await fetchSeriesGoogle([term], { timeframe, geo: '' });

      if (!series || series.length === 0) {
        return this.createErrorResult(term, startDate, endDate, 'No data returned', 'failed');
      }

      // Convert to SourceDataPoint format
      const dataPoints: SourceDataPoint[] = series.map(point => ({
        date: typeof point.date === 'string' ? point.date : new Date(point.date).toISOString().split('T')[0],
        value: Number(point[term]) || 0,
        rawValue: Number(point[term]) || 0,
        source: 'google-trends',
      }));

      // Filter to date range
      const filteredPoints = dataPoints.filter(point => {
        const pointDate = new Date(point.date);
        return pointDate >= startDate && pointDate <= endDate;
      });

      const responseTime = Date.now() - startTime;

      // Calculate confidence based on data quality
      const confidence = this.calculateConfidence(filteredPoints);

      return {
        source: 'google-trends',
        status: 'active',
        data: filteredPoints,
        metadata: {
          term,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          dataPoints: filteredPoints.length,
          confidence,
          notes: `Google Trends search interest (${timeframe})`,
        },
        fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[Google Trends Adapter] Error:', error);
      return this.createErrorResult(
        term,
        startDate,
        endDate,
        error instanceof Error ? error.message : 'Unknown error',
        'failed'
      );
    }
  }

  getRateLimitStatus() {
    return {
      remaining: this.rateLimitRemaining,
      resetAt: this.rateLimitResetAt,
    };
  }

  /**
   * Calculate confidence in the data
   */
  private calculateConfidence(dataPoints: SourceDataPoint[]): number {
    let confidence = 0;

    // Data completeness (up to 40 points)
    if (dataPoints.length > 0) {
      const completeness = Math.min(40, (dataPoints.length / 90) * 40);
      confidence += completeness;
    }

    // Data quality - non-zero values (up to 30 points)
    const nonZeroCount = dataPoints.filter(p => p.value > 0).length;
    const qualityScore = dataPoints.length > 0 ? Math.min(30, (nonZeroCount / dataPoints.length) * 30) : 0;
    confidence += qualityScore;

    // Google Trends reliability bonus (30 points)
    confidence += 30;

    return Math.min(100, confidence);
  }

  /**
   * Create error result
   */
  private createErrorResult(
    term: string,
    startDate: Date,
    endDate: Date,
    error: string,
    status: 'failed' | 'rate-limited'
  ): SourceResult {
    return {
      source: 'google-trends',
      status,
      data: [],
      metadata: {
        term,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        dataPoints: 0,
        confidence: 0,
      },
      error,
      fetchedAt: new Date().toISOString(),
    };
  }
}
