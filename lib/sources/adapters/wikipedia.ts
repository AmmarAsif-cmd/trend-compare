/**
 * Wikipedia Pageviews Data Source Adapter
 * Free tier: 200 requests/hour (no auth required)
 * Tracks article pageview counts
 */

import type {
  DataSourceAdapter,
  SourceConfig,
  SourceResult,
  SourceDataPoint,
  WikipediaPageview,
} from '../types';

const DEFAULT_CONFIG: SourceConfig = {
  enabled: true,
  priority: 3,
  timeout: 10000,
  retries: 2,
  rateLimit: {
    requests: 200,
    period: 3600000, // 1 hour
  },
};

export class WikipediaAdapter implements DataSourceAdapter {
  name = 'wikipedia' as const;
  config: SourceConfig;

  private rateLimitRemaining: number;
  private rateLimitResetAt: Date | null;
  private requestTimes: number[] = [];

  constructor(config: Partial<SourceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.rateLimitRemaining = this.config.rateLimit?.requests ?? 200;
    this.rateLimitResetAt = null;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(
        'https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/2024/01/01',
        {
          headers: {
            'User-Agent': 'TrendCompare/1.0 (https://trendcompare.example.com)',
          },
          signal: AbortSignal.timeout(5000),
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  async fetchTimeSeries(
    term: string,
    startDate: Date,
    endDate: Date
  ): Promise<SourceResult> {
    try {
      // Check rate limit
      if (!this.checkRateLimit()) {
        return this.createErrorResult(term, startDate, endDate, 'Rate limit exceeded', 'rate-limited');
      }

      // Try to find matching Wikipedia article
      const articleTitle = await this.findArticle(term);

      if (!articleTitle) {
        return this.createErrorResult(
          term,
          startDate,
          endDate,
          'No Wikipedia article found',
          'failed'
        );
      }

      // Fetch pageview data
      const pageviews = await this.fetchPageviews(articleTitle, startDate, endDate);

      // Convert to normalized data points
      const dataPoints = this.normalizePageviews(pageviews);

      // Calculate confidence
      const confidence = this.calculateConfidence(pageviews, dataPoints);

      return {
        source: 'wikipedia',
        status: 'active',
        data: dataPoints,
        metadata: {
          term,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          dataPoints: dataPoints.length,
          confidence,
          notes: `Based on Wikipedia article: "${articleTitle}"`,
        },
        fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
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
   * Find Wikipedia article matching the term
   */
  private async findArticle(term: string): Promise<string | null> {
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(term)}&limit=1&format=json`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TrendCompare/1.0',
        },
        signal: AbortSignal.timeout(this.config.timeout),
      });

      this.trackRequest();

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      // OpenSearch returns [query, [titles], [descriptions], [urls]]
      const titles = data[1] ?? [];
      return titles[0] ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Fetch pageview data for an article
   */
  private async fetchPageviews(
    article: string,
    startDate: Date,
    endDate: Date
  ): Promise<WikipediaPageview[]> {
    const pageviews: WikipediaPageview[] = [];

    // Wikipedia API requires YYYYMMDD format
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}${month}${day}`;
    };

    const start = formatDate(startDate);
    const end = formatDate(endDate);

    const encodedArticle = encodeURIComponent(article.replace(/ /g, '_'));
    const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/${encodedArticle}/daily/${start}/${end}`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TrendCompare/1.0',
        },
        signal: AbortSignal.timeout(this.config.timeout),
      });

      this.trackRequest();

      if (!response.ok) {
        throw new Error(`Wikipedia API error: ${response.status}`);
      }

      const data = await response.json();

      const items = data?.items ?? [];

      for (const item of items) {
        pageviews.push({
          project: item.project,
          article: item.article,
          granularity: item.granularity,
          timestamp: item.timestamp,
          views: item.views,
        });
      }
    } catch (error) {
      console.error('Error fetching Wikipedia pageviews:', error);
    }

    return pageviews;
  }

  /**
   * Normalize pageviews to 0-100 scale
   */
  private normalizePageviews(pageviews: WikipediaPageview[]): SourceDataPoint[] {
    if (pageviews.length === 0) return [];

    // Find min/max for normalization
    const views = pageviews.map(p => p.views);
    const minViews = Math.min(...views);
    const maxViews = Math.max(...views);
    const range = maxViews - minViews || 1;

    return pageviews.map(p => {
      // Convert timestamp YYYYMMDD to YYYY-MM-DD
      const timestamp = p.timestamp;
      const year = timestamp.substring(0, 4);
      const month = timestamp.substring(4, 6);
      const day = timestamp.substring(6, 8);
      const date = `${year}-${month}-${day}`;

      // Normalize to 0-100
      const normalized = ((p.views - minViews) / range) * 100;

      return {
        date,
        value: normalized,
        rawValue: p.views,
        source: 'wikipedia',
      };
    });
  }

  /**
   * Calculate confidence in the data
   */
  private calculateConfidence(
    pageviews: WikipediaPageview[],
    dataPoints: SourceDataPoint[]
  ): number {
    let confidence = 0;

    // Data completeness (up to 50 points)
    if (dataPoints.length > 0) {
      const completeness = Math.min(50, (dataPoints.length / 90) * 50);
      confidence += completeness;
    }

    // Data quality - consistent non-zero values (up to 30 points)
    const nonZeroCount = dataPoints.filter(p => p.value > 0).length;
    const qualityScore = Math.min(30, (nonZeroCount / dataPoints.length) * 30);
    confidence += qualityScore;

    // Minimum pageview threshold (up to 20 points)
    const avgViews = pageviews.reduce((sum, p) => sum + p.views, 0) / (pageviews.length || 1);
    if (avgViews > 1000) {
      confidence += 20;
    } else if (avgViews > 100) {
      confidence += 10;
    }

    return Math.min(100, confidence);
  }

  /**
   * Check if we're within rate limits
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    const windowStart = now - (this.config.rateLimit?.period ?? 3600000);

    // Clean old requests
    this.requestTimes = this.requestTimes.filter(t => t > windowStart);

    // Check if we can make another request
    const maxRequests = this.config.rateLimit?.requests ?? 200;
    return this.requestTimes.length < maxRequests;
  }

  /**
   * Track a request for rate limiting
   */
  private trackRequest(): void {
    this.requestTimes.push(Date.now());
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
      source: 'wikipedia',
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
