/**
 * Wikipedia Pageviews Data Source Adapter
 * Fetches Wikipedia article pageview data for general topics
 * FREE API - No key required
 */

import type { DataSourceAdapter, SourceConfig, SourceResult, SourceDataPoint } from '../types';

const WIKIPEDIA_API_BASE = 'https://wikimedia.org/api/rest_v1';
const WIKIPEDIA_SEARCH_API = 'https://en.wikipedia.org/w/api.php';

export type WikipediaPageview = {
  date: string;
  views: number;
};

export type WikipediaArticle = {
  title: string;
  pageviews: WikipediaPageview[];
  avgPageviews: number;
  totalPageviews: number;
  exists: boolean;
};

export class WikipediaAdapter implements DataSourceAdapter {
  name = 'wikipedia' as const;
  config: SourceConfig;

  constructor(config: Partial<SourceConfig> = {}) {
    this.config = {
      enabled: true, // Always enabled - free API
      priority: 3,
      timeout: 8000,
      retries: 2,
      rateLimit: { requests: 200, period: 3600000 }, // 200 per hour
      ...config,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(
        `${WIKIPEDIA_API_BASE}/metrics/pageviews/top/en.wikipedia/all-access/2024/01/01`,
        { method: 'GET' }
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
      // Find Wikipedia article
      const article = await this.findArticle(term);
      
      if (!article.exists) {
        return this.createFailedResult(term, startDate, endDate, 'No Wikipedia article found');
      }

      // Fetch pageview data
      const pageviews = await this.fetchPageviews(article.title, startDate, endDate);
      
      if (pageviews.length === 0) {
        return this.createFailedResult(term, startDate, endDate, 'No pageview data available');
      }

      const dataPoints = this.normalizePageviews(pageviews);
      const avgPageviews = pageviews.reduce((sum, p) => sum + p.views, 0) / pageviews.length;
      const totalPageviews = pageviews.reduce((sum, p) => sum + p.views, 0);

      return {
        source: 'wikipedia' as const,
        status: 'active',
        data: dataPoints,
        metadata: {
          term,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          dataPoints: dataPoints.length,
          confidence: Math.min(90, 50 + Math.min(40, Math.log10(avgPageviews) * 10)),
          notes: `Based on Wikipedia article: "${article.title}" (avg ${Math.round(avgPageviews).toLocaleString()} views/day)`,
        },
        fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[Wikipedia] Fetch error:', error);
      return this.createFailedResult(
        term,
        startDate,
        endDate,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Find Wikipedia article matching the term
   */
  async findArticle(term: string): Promise<{ title: string; exists: boolean }> {
    try {
      // Use Wikipedia search API
      const url = `${WIKIPEDIA_SEARCH_API}?action=opensearch&search=${encodeURIComponent(term)}&limit=1&format=json&origin=*`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return { title: term, exists: false };
      }

      const data = await response.json();
      // Format: [search term, [titles], [descriptions], [urls]]
      const titles = data[1] || [];
      
      if (titles.length > 0) {
        return { title: titles[0], exists: true };
      }
      
      return { title: term, exists: false };
    } catch (error) {
      console.error('[Wikipedia] Article search error:', error);
      return { title: term, exists: false };
    }
  }

  /**
   * Fetch pageview data for an article
   */
  async fetchPageviews(
    articleTitle: string,
    startDate: Date,
    endDate: Date
  ): Promise<WikipediaPageview[]> {
    const pageviews: WikipediaPageview[] = [];
    
    try {
      // Wikipedia API requires article title to be URL-encoded
      const encodedArticle = encodeURIComponent(articleTitle.replace(/ /g, '_'));
      
      // Format dates as YYYYMMDD
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
      };
      
      const start = formatDate(startDate);
      const end = formatDate(endDate);
      
      const url = `${WIKIPEDIA_API_BASE}/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/${encodedArticle}/daily/${start}/${end}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[Wikipedia] Article not found or no pageview data: ${articleTitle}`);
          return [];
        }
        throw new Error(`Wikipedia API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.items) {
        for (const item of data.items) {
          pageviews.push({
            date: item.timestamp.substring(0, 10), // YYYYMMDDHH -> YYYY-MM-DD
            views: item.views || 0,
          });
        }
      }
    } catch (error) {
      console.error('[Wikipedia] Error fetching pageviews:', error);
    }

    return pageviews;
  }

  /**
   * Get article stats (for scoring)
   */
  async getArticleStats(term: string): Promise<{
    avgPageviews: number;
    totalPageviews: number;
    articleExists: boolean;
    articleTitle: string | null;
  }> {
    try {
      const article = await this.findArticle(term);
      
      if (!article.exists) {
        return {
          avgPageviews: 0,
          totalPageviews: 0,
          articleExists: false,
          articleTitle: null,
        };
      }

      // Fetch last 30 days of pageviews
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const pageviews = await this.fetchPageviews(article.title, startDate, endDate);
      
      if (pageviews.length === 0) {
        return {
          avgPageviews: 0,
          totalPageviews: 0,
          articleExists: true,
          articleTitle: article.title,
        };
      }

      const totalPageviews = pageviews.reduce((sum, p) => sum + p.views, 0);
      const avgPageviews = totalPageviews / pageviews.length;

      return {
        avgPageviews,
        totalPageviews,
        articleExists: true,
        articleTitle: article.title,
      };
    } catch (error) {
      console.error(`[Wikipedia] Error getting stats for "${term}":`, error);
      return {
        avgPageviews: 0,
        totalPageviews: 0,
        articleExists: false,
        articleTitle: null,
      };
    }
  }

  /**
   * Normalize pageviews to 0-100 scale
   */
  private normalizePageviews(pageviews: WikipediaPageview[]): SourceDataPoint[] {
    if (pageviews.length === 0) return [];

    const views = pageviews.map(p => p.views);
    const maxViews = Math.max(...views);
    const minViews = Math.min(...views);
    const range = maxViews - minViews || 1;

    return pageviews.map(p => ({
      date: p.date,
      value: range > 0 ? Math.round(((p.views - minViews) / range) * 100) : 50,
      rawValue: p.views,
      source: 'wikipedia' as const,
    }));
  }

  private createFailedResult(
    term: string,
    startDate: Date,
    endDate: Date,
    error: string
  ): SourceResult {
    return {
      source: 'wikipedia' as const,
      status: 'failed',
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

  getRateLimitStatus(): { remaining: number; resetAt: Date | null } {
    // Wikipedia doesn't have strict rate limits, but we're respectful
    return {
      remaining: 200,
      resetAt: null,
    };
  }
}

export const wikipediaAdapter = new WikipediaAdapter();

