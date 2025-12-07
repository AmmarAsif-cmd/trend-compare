/**
 * Reddit Data Source Adapter
 * Free tier: 60 requests/minute
 * Tracks mentions and engagement for search terms
 */

import type {
  DataSourceAdapter,
  SourceConfig,
  SourceResult,
  SourceDataPoint,
  RedditPost,
  RedditMetrics,
} from '../types';

const DEFAULT_CONFIG: SourceConfig = {
  enabled: true,
  priority: 2, // Secondary to Google Trends
  timeout: 10000,
  retries: 2,
  rateLimit: {
    requests: 60,
    period: 60000, // 1 minute
  },
};

export class RedditAdapter implements DataSourceAdapter {
  name = 'reddit' as const;
  config: SourceConfig;

  private rateLimitRemaining: number;
  private rateLimitResetAt: Date | null;
  private requestTimes: number[] = [];

  constructor(config: Partial<SourceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.rateLimitRemaining = this.config.rateLimit?.requests ?? 60;
    this.rateLimitResetAt = null;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch('https://www.reddit.com/api/v1/me', {
        headers: {
          'User-Agent': 'TrendCompare/1.0',
        },
        signal: AbortSignal.timeout(5000),
      });

      return response.status === 200 || response.status === 403; // 403 = working but not authenticated
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
      // Check rate limit
      if (!this.checkRateLimit()) {
        return this.createErrorResult(term, startDate, endDate, 'Rate limit exceeded', 'rate-limited');
      }

      // Fetch posts mentioning the term
      const posts = await this.searchPosts(term, startDate, endDate);

      // Group by date and calculate metrics
      const metrics = this.aggregateByDate(posts, startDate, endDate);

      // Convert to normalized data points (0-100 scale)
      const dataPoints = this.normalizeMetrics(metrics);

      // Calculate confidence based on data quality
      const confidence = this.calculateConfidence(posts, dataPoints);

      return {
        source: 'reddit',
        status: 'active',
        data: dataPoints,
        metadata: {
          term,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          dataPoints: dataPoints.length,
          confidence,
          notes: `Based on ${posts.length} Reddit posts`,
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
   * Search Reddit for posts mentioning the term
   */
  private async searchPosts(
    term: string,
    startDate: Date,
    endDate: Date
  ): Promise<RedditPost[]> {
    const posts: RedditPost[] = [];
    const subreddits = ['all']; // Can be configured per term

    for (const subreddit of subreddits) {
      try {
        const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(term)}&sort=new&limit=100&t=all`;

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'TrendCompare/1.0',
          },
          signal: AbortSignal.timeout(this.config.timeout),
        });

        this.trackRequest();

        if (!response.ok) {
          throw new Error(`Reddit API error: ${response.status}`);
        }

        const data = await response.json();

        const children = data?.data?.children ?? [];

        for (const child of children) {
          const post = child.data;
          const createdDate = new Date(post.created_utc * 1000);

          // Filter by date range
          if (createdDate >= startDate && createdDate <= endDate) {
            posts.push({
              id: post.id,
              title: post.title,
              subreddit: post.subreddit,
              score: post.score,
              numComments: post.num_comments,
              createdUtc: post.created_utc,
              url: `https://reddit.com${post.permalink}`,
            });
          }
        }

        // Respect rate limit
        await this.sleep(1000);
      } catch (error) {
        // Reddit API often returns 403 without auth - this is expected
        // Only log in development to avoid noise in production logs
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Reddit API unavailable for r/${subreddit}:`, error instanceof Error ? error.message : 'Unknown error');
        }
      }
    }

    return posts;
  }

  /**
   * Aggregate posts by date
   */
  private aggregateByDate(
    posts: RedditPost[],
    startDate: Date,
    endDate: Date
  ): RedditMetrics[] {
    const metricsByDate = new Map<string, RedditMetrics>();

    // Initialize all dates in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      metricsByDate.set(dateKey, {
        date: dateKey,
        postCount: 0,
        totalScore: 0,
        totalComments: 0,
        avgScore: 0,
        topSubreddits: [],
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Aggregate posts
    for (const post of posts) {
      const postDate = new Date(post.createdUtc * 1000);
      const dateKey = postDate.toISOString().split('T')[0];

      const metrics = metricsByDate.get(dateKey);
      if (metrics) {
        metrics.postCount++;
        metrics.totalScore += post.score;
        metrics.totalComments += post.numComments;
      }
    }

    // Calculate averages
    for (const metrics of metricsByDate.values()) {
      if (metrics.postCount > 0) {
        metrics.avgScore = metrics.totalScore / metrics.postCount;
      }
    }

    return Array.from(metricsByDate.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }

  /**
   * Normalize metrics to 0-100 scale
   */
  private normalizeMetrics(metrics: RedditMetrics[]): SourceDataPoint[] {
    // Find max values for normalization
    const maxPostCount = Math.max(...metrics.map(m => m.postCount), 1);
    const maxEngagement = Math.max(
      ...metrics.map(m => m.totalScore + m.totalComments),
      1
    );

    return metrics.map(m => {
      // Combine post count and engagement
      const postScore = (m.postCount / maxPostCount) * 50;
      const engagementScore = ((m.totalScore + m.totalComments) / maxEngagement) * 50;
      const value = postScore + engagementScore;

      return {
        date: m.date,
        value: Math.min(100, value),
        rawValue: m.postCount + m.totalScore + m.totalComments,
        source: 'reddit',
      };
    });
  }

  /**
   * Calculate confidence in the data
   */
  private calculateConfidence(posts: RedditPost[], dataPoints: SourceDataPoint[]): number {
    let confidence = 0;

    // Data quantity (up to 40 points)
    const dataScore = Math.min(40, (posts.length / 100) * 40);
    confidence += dataScore;

    // Coverage (up to 30 points)
    const daysWithData = dataPoints.filter(p => p.value > 0).length;
    const coverageScore = Math.min(30, (daysWithData / dataPoints.length) * 30);
    confidence += coverageScore;

    // Consistency (up to 30 points)
    const nonZeroValues = dataPoints.filter(p => p.value > 0).map(p => p.value);
    if (nonZeroValues.length > 5) {
      const mean = nonZeroValues.reduce((a, b) => a + b, 0) / nonZeroValues.length;
      const variance = nonZeroValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / nonZeroValues.length;
      const cv = Math.sqrt(variance) / mean;
      const consistencyScore = Math.max(0, 30 - (cv * 10));
      confidence += consistencyScore;
    }

    return Math.min(100, confidence);
  }

  /**
   * Check if we're within rate limits
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    const windowStart = now - (this.config.rateLimit?.period ?? 60000);

    // Clean old requests
    this.requestTimes = this.requestTimes.filter(t => t > windowStart);

    // Check if we can make another request
    const maxRequests = this.config.rateLimit?.requests ?? 60;
    return this.requestTimes.length < maxRequests;
  }

  /**
   * Track a request for rate limiting
   */
  private trackRequest(): void {
    this.requestTimes.push(Date.now());
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
      source: 'reddit',
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
