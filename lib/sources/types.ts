/**
 * Multi-Source Data Types
 * Unified interface for different data sources
 */

export type DataSourceType = 'google-trends' | 'reddit' | 'hackernews' | 'github' | 'youtube' | 'tmdb' | 'omdb' | 'bestbuy' | 'spotify' | 'steam';

export type SourceStatus = 'active' | 'degraded' | 'failed' | 'rate-limited';

/**
 * Unified time series data point from any source
 */
export type SourceDataPoint = {
  date: string; // ISO date
  value: number; // Normalized 0-100
  rawValue?: number; // Original value before normalization
  source: DataSourceType;
};

/**
 * Result from a data source
 */
export type SourceResult = {
  source: DataSourceType;
  status: SourceStatus;
  data: SourceDataPoint[];
  metadata: {
    term: string;
    startDate: string;
    endDate: string;
    dataPoints: number;
    confidence: number; // 0-100
    notes?: string;
  };
  error?: string;
  fetchedAt: string; // ISO timestamp
};

/**
 * Configuration for a data source adapter
 */
export type SourceConfig = {
  enabled: boolean;
  priority: number; // Lower = higher priority (1 = highest)
  timeout: number; // ms
  retries: number;
  rateLimit?: {
    requests: number;
    period: number; // ms
  };
  apiKey?: string;
};

/**
 * Base interface for all data source adapters
 */
export interface DataSourceAdapter {
  name: DataSourceType;
  config: SourceConfig;

  /**
   * Check if source is available
   */
  healthCheck(): Promise<boolean>;

  /**
   * Fetch time series data for a term
   */
  fetchTimeSeries(
    term: string,
    startDate: Date,
    endDate: Date
  ): Promise<SourceResult>;

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(): {
    remaining: number;
    resetAt: Date | null;
  };
}

/**
 * Reddit-specific types
 */
export type RedditPost = {
  id: string;
  title: string;
  subreddit: string;
  score: number;
  numComments: number;
  createdUtc: number;
  url: string;
};

export type RedditMetrics = {
  date: string;
  postCount: number;
  totalScore: number;
  totalComments: number;
  avgScore: number;
  topSubreddits: string[];
};

/**
 * Wikipedia-specific types
 */
export type WikipediaPageview = {
  project: string;
  article: string;
  granularity: string;
  timestamp: string;
  views: number;
};

/**
 * Hacker News-specific types
 */
export type HNItem = {
  id: number;
  type: string;
  by: string;
  time: number;
  text?: string;
  url?: string;
  score: number;
  title?: string;
  descendants?: number;
};

export type HNMetrics = {
  date: string;
  mentionCount: number;
  totalScore: number;
  avgScore: number;
  topStories: string[];
};

/**
 * GitHub-specific types
 */
export type GitHubRepo = {
  name: string;
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  watchers: number;
  language: string;
  createdAt: string;
  updatedAt: string;
  url: string;
};

export type GitHubMetrics = {
  date: string;
  repoCount: number;
  totalStars: number;
  totalForks: number;
  newRepos: number;
  activeRepos: number;
};

/**
 * Aggregated data from multiple sources
 */
export type MultiSourceData = {
  term: string;
  sources: SourceResult[];
  primary: SourceResult | null; // Best available source
  combined: SourceDataPoint[]; // Merged time series
  confidence: number; // 0-100
  completeness: number; // 0-100 (% of date range covered)
  metadata: {
    sourcesUsed: DataSourceType[];
    dateRange: {
      start: string;
      end: string;
    };
    fetchedAt: string;
  };
};

/**
 * Fallback strategy configuration
 */
export type FallbackConfig = {
  strategy: 'priority' | 'parallel' | 'fastest';
  minSources: number; // Minimum sources to consider success
  combineMethod: 'average' | 'weighted' | 'primary-only';
  weights?: Partial<Record<DataSourceType, number>>;
};

/**
 * Health status for all sources
 */
export type SourceHealth = {
  source: DataSourceType;
  status: SourceStatus;
  lastChecked: string;
  responseTime: number; // ms
  successRate: number; // 0-100
  rateLimitRemaining: number;
};
