/**
 * GitHub Data Source Adapter
 * Free tier: 60/hour (no auth) or 5000/hour (with token)
 * Tracks repository creation and star growth
 */

import type {
  DataSourceAdapter,
  SourceConfig,
  SourceResult,
  SourceDataPoint,
  GitHubRepo,
  GitHubMetrics,
} from '../types';

const DEFAULT_CONFIG: SourceConfig = {
  enabled: true,
  priority: 4,
  timeout: 10000,
  retries: 2,
  rateLimit: {
    requests: 60,
    period: 3600000, // 1 hour
  },
};

export class GitHubAdapter implements DataSourceAdapter {
  name = 'github' as const;
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
      const headers: Record<string, string> = {
        'User-Agent': 'TrendCompare/1.0',
        'Accept': 'application/vnd.github.v3+json',
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch('https://api.github.com/rate_limit', {
        headers,
        signal: AbortSignal.timeout(5000),
      });

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

      // Search for repositories matching the term
      const repos = await this.searchRepositories(term, startDate, endDate);

      if (repos.length === 0) {
        return this.createErrorResult(
          term,
          startDate,
          endDate,
          'No repositories found',
          'failed'
        );
      }

      // Aggregate by date
      const metrics = this.aggregateByDate(repos, startDate, endDate);

      // Convert to normalized data points
      const dataPoints = this.normalizeMetrics(metrics);

      // Calculate confidence
      const confidence = this.calculateConfidence(repos, dataPoints);

      return {
        source: 'github',
        status: 'active',
        data: dataPoints,
        metadata: {
          term,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          dataPoints: dataPoints.length,
          confidence,
          notes: `Based on ${repos.length} GitHub repositories`,
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
   * Search GitHub for repositories
   */
  private async searchRepositories(
    term: string,
    startDate: Date,
    endDate: Date
  ): Promise<GitHubRepo[]> {
    const repos: GitHubRepo[] = [];

    // Format dates for GitHub search (YYYY-MM-DD)
    const formatDate = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };

    const createdRange = `${formatDate(startDate)}..${formatDate(endDate)}`;
    const query = `${term} created:${createdRange}`;

    try {
      const headers: Record<string, string> = {
        'User-Agent': 'TrendCompare/1.0',
        'Accept': 'application/vnd.github.v3+json',
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      // GitHub limits to 100 results per page, max 1000 total
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=100`;

      const response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(this.config.timeout),
      });

      this.trackRequest();

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();

      const items = data?.items ?? [];

      for (const item of items) {
        repos.push({
          name: item.name,
          fullName: item.full_name,
          description: item.description || '',
          stars: item.stargazers_count,
          forks: item.forks_count,
          watchers: item.watchers_count,
          language: item.language || 'Unknown',
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          url: item.html_url,
        });
      }
    } catch (error) {
      console.error('Error fetching GitHub repos:', error);
    }

    return repos;
  }

  /**
   * Aggregate repos by date
   */
  private aggregateByDate(
    repos: GitHubRepo[],
    startDate: Date,
    endDate: Date
  ): GitHubMetrics[] {
    const metricsByDate = new Map<string, GitHubMetrics>();

    // Initialize all dates in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      metricsByDate.set(dateKey, {
        date: dateKey,
        repoCount: 0,
        totalStars: 0,
        totalForks: 0,
        newRepos: 0,
        activeRepos: 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Aggregate repos
    for (const repo of repos) {
      const createdDate = new Date(repo.createdAt);
      const dateKey = createdDate.toISOString().split('T')[0];

      const metrics = metricsByDate.get(dateKey);
      if (metrics) {
        metrics.repoCount++;
        metrics.newRepos++;
        metrics.totalStars += repo.stars;
        metrics.totalForks += repo.forks;
      }
    }

    return Array.from(metricsByDate.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }

  /**
   * Normalize metrics to 0-100 scale
   */
  private normalizeMetrics(metrics: GitHubMetrics[]): SourceDataPoint[] {
    // Find max values for normalization
    const maxRepoCount = Math.max(...metrics.map(m => m.repoCount), 1);
    const maxStars = Math.max(...metrics.map(m => m.totalStars), 1);

    return metrics.map(m => {
      // Combine repo count and stars (weighted)
      const repoScore = (m.repoCount / maxRepoCount) * 60;
      const starScore = (m.totalStars / maxStars) * 40;
      const value = repoScore + starScore;

      return {
        date: m.date,
        value: Math.min(100, value),
        rawValue: m.repoCount + m.totalStars,
        source: 'github',
      };
    });
  }

  /**
   * Calculate confidence in the data
   */
  private calculateConfidence(repos: GitHubRepo[], dataPoints: SourceDataPoint[]): number {
    let confidence = 0;

    // Data quantity (up to 40 points)
    const dataScore = Math.min(40, (repos.length / 50) * 40);
    confidence += dataScore;

    // Coverage (up to 30 points)
    const daysWithData = dataPoints.filter(p => p.value > 0).length;
    const coverageScore = Math.min(30, (daysWithData / dataPoints.length) * 30);
    confidence += coverageScore;

    // Quality - repos with significant stars (up to 30 points)
    const qualityRepos = repos.filter(r => r.stars > 10).length;
    const qualityScore = Math.min(30, (qualityRepos / repos.length) * 30);
    confidence += qualityScore;

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
      source: 'github',
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
