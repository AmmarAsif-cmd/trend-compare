/**
 * YouTube Data API Adapter
 * Fetches video statistics and engagement metrics
 */

import type { DataSourceAdapter, SourceConfig, SourceResult, SourceDataPoint } from '../types';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export type YouTubeVideo = {
  id: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  thumbnailUrl: string;
};

export type YouTubeSearchResult = {
  videos: YouTubeVideo[];
  totalResults: number;
  term: string;
};

export class YouTubeAdapter implements DataSourceAdapter {
  name: 'youtube' = 'youtube' as const;
  config: SourceConfig;
  private apiKey: string | null;
  private requestCount = 0;
  private resetTime: Date | null = null;

  constructor(config: Partial<SourceConfig> = {}) {
    this.apiKey = process.env.YOUTUBE_API_KEY || null;
    this.config = {
      enabled: !!this.apiKey,
      priority: 2,
      timeout: 10000,
      retries: 2,
      rateLimit: { requests: 100, period: 60000 },
      ...config,
    };
  }

  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) return false;
    
    try {
      const response = await fetch(
        `${YOUTUBE_API_BASE}/search?part=snippet&q=test&maxResults=1&key=${this.apiKey}`,
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
    if (!this.apiKey) {
      return this.createFailedResult(term, startDate, endDate, 'YouTube API key not configured');
    }

    try {
      const searchResult = await this.searchVideos(term, 50);
      
      if (!searchResult.videos.length) {
        return this.createFailedResult(term, startDate, endDate, 'No videos found');
      }

      const dataPoints = this.aggregateByDate(searchResult.videos, startDate, endDate);
      const totalViews = searchResult.videos.reduce((sum, v) => sum + v.viewCount, 0);
      const avgViews = totalViews / searchResult.videos.length;

      return {
        source: 'youtube' as const,
        status: 'active',
        data: dataPoints,
        metadata: {
          term,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          dataPoints: dataPoints.length,
          confidence: Math.min(90, 40 + searchResult.videos.length),
          notes: `Found ${searchResult.videos.length} videos, avg ${Math.round(avgViews).toLocaleString()} views`,
        },
        fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[YouTube] Fetch error:', error);
      return this.createFailedResult(
        term, 
        startDate, 
        endDate, 
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async searchVideos(term: string, maxResults: number = 25): Promise<YouTubeSearchResult> {
    if (!this.apiKey) {
      return { videos: [], totalResults: 0, term };
    }

    const searchUrl = new URL(`${YOUTUBE_API_BASE}/search`);
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('q', term);
    searchUrl.searchParams.set('maxResults', String(Math.min(maxResults, 50)));
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('order', 'relevance');
    searchUrl.searchParams.set('key', this.apiKey);

    const searchResponse = await fetch(searchUrl.toString());
    
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${searchResponse.status}`;
      
      // Check for quota exceeded error
      if (errorData.error?.errors?.[0]?.reason === 'quotaExceeded' || 
          errorMessage.includes('quota') || 
          searchResponse.status === 403) {
        const { QuotaExceededError } = await import('../../utils/errors');
        console.warn(`[YouTube] ⚠️ Quota exceeded for "${term}". YouTube data will be skipped.`);
        throw new QuotaExceededError('YouTube', `YouTube API quota exceeded. Please try again later or enable billing for higher limits.`);
      }
      
      console.error(`[YouTube] Search failed for "${term}":`, errorMessage, errorData.error);
      throw new Error(`YouTube search failed: ${searchResponse.status} - ${errorMessage}`);
    }

    const searchData = await searchResponse.json();
    
    // Check for API errors in response
    if (searchData.error) {
      console.error(`[YouTube] API error for "${term}":`, searchData.error);
      throw new Error(`YouTube API error: ${searchData.error.message || 'Unknown error'}`);
    }
    
    const videoIds = searchData.items?.map((item: { id: { videoId: string } }) => item.id.videoId) || [];

    if (videoIds.length === 0) {
      console.warn(`[YouTube] No videos found for search term: "${term}"`);
      return { videos: [], totalResults: 0, term };
    }

    const statsUrl = new URL(`${YOUTUBE_API_BASE}/videos`);
    statsUrl.searchParams.set('part', 'snippet,statistics');
    statsUrl.searchParams.set('id', videoIds.join(','));
    statsUrl.searchParams.set('key', this.apiKey);

    const statsResponse = await fetch(statsUrl.toString());
    
    if (!statsResponse.ok) {
      const errorData = await statsResponse.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${statsResponse.status}`;
      
      // Check for quota exceeded error
      if (errorData.error?.errors?.[0]?.reason === 'quotaExceeded' || 
          errorMessage.includes('quota') || 
          statsResponse.status === 403) {
        const { QuotaExceededError } = await import('../../utils/errors');
        console.warn(`[YouTube] ⚠️ Quota exceeded for "${term}". YouTube data will be skipped.`);
        throw new QuotaExceededError('YouTube', `YouTube API quota exceeded. Please try again later or enable billing for higher limits.`);
      }
      
      console.error(`[YouTube] Stats failed for "${term}":`, errorMessage, errorData.error);
      throw new Error(`YouTube stats failed: ${statsResponse.status} - ${errorMessage}`);
    }
    
    const statsData = await statsResponse.json();
    
    // Check for API errors in stats response
    if (statsData.error) {
      console.error(`[YouTube] Stats API error for "${term}":`, statsData.error);
      throw new Error(`YouTube stats API error: ${statsData.error.message || 'Unknown error'}`);
    }

    const videos: YouTubeVideo[] = statsData.items?.map((item: {
      id: string;
      snippet: { title: string; channelTitle: string; publishedAt: string; thumbnails?: { medium?: { url: string } } };
      statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
    }) => ({
      id: item.id,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      viewCount: parseInt(item.statistics.viewCount || '0', 10),
      likeCount: parseInt(item.statistics.likeCount || '0', 10),
      commentCount: parseInt(item.statistics.commentCount || '0', 10),
      thumbnailUrl: item.snippet.thumbnails?.medium?.url || '',
    })) || [];

    return {
      videos,
      totalResults: searchData.pageInfo?.totalResults || videos.length,
      term,
    };
  }

  async getVideoStats(term: string): Promise<{
    totalVideos: number;
    totalViews: number;
    totalLikes: number;
    avgViews: number;
    avgLikes: number;
    topVideo: YouTubeVideo | null;
  }> {
    try {
      const result = await this.searchVideos(term, 50);
      
      if (result.videos.length === 0) {
        console.warn(`[YouTube] No videos found for term: "${term}"`);
        return {
          totalVideos: 0,
          totalViews: 0,
          totalLikes: 0,
          avgViews: 0,
          avgLikes: 0,
          topVideo: null,
        };
      }

      const totalViews = result.videos.reduce((sum, v) => sum + v.viewCount, 0);
      const totalLikes = result.videos.reduce((sum, v) => sum + v.likeCount, 0);
      const topVideo = result.videos.reduce((top, v) => 
        v.viewCount > (top?.viewCount || 0) ? v : top, result.videos[0]);

      const stats = {
        totalVideos: result.totalResults,
        totalViews,
        totalLikes,
        avgViews: Math.round(totalViews / result.videos.length),
        avgLikes: Math.round(totalLikes / result.videos.length),
        topVideo,
      };
      
      console.log(`[YouTube] Stats for "${term}":`, {
        videos: stats.totalVideos,
        totalViews: stats.totalViews.toLocaleString(),
        avgViews: stats.avgViews.toLocaleString(),
        totalLikes: stats.totalLikes.toLocaleString(),
      });
      
      return stats;
    } catch (error) {
      console.error(`[YouTube] Error getting stats for "${term}":`, error);
      throw error;
    }
  }

  private aggregateByDate(
    videos: YouTubeVideo[],
    startDate: Date,
    endDate: Date
  ): SourceDataPoint[] {
    const dateMap = new Map<string, number>();

    for (const video of videos) {
      const date = video.publishedAt.split('T')[0];
      const current = dateMap.get(date) || 0;
      dateMap.set(date, current + video.viewCount);
    }

    if (dateMap.size === 0) return [];

    const maxValue = Math.max(...dateMap.values());
    const dataPoints: SourceDataPoint[] = [];

    for (const [date, value] of dateMap) {
      dataPoints.push({
        date,
        value: maxValue > 0 ? Math.round((value / maxValue) * 100) : 0,
        rawValue: value,
        source: 'youtube' as const,
      });
    }

    return dataPoints.sort((a, b) => a.date.localeCompare(b.date));
  }

  private createFailedResult(
    term: string,
    startDate: Date,
    endDate: Date,
    error: string
  ): SourceResult {
    return {
      source: 'youtube' as const,
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
    const limit = this.config.rateLimit?.requests || 100;
    return {
      remaining: Math.max(0, limit - this.requestCount),
      resetAt: this.resetTime,
    };
  }
}

export const youtubeAdapter = new YouTubeAdapter();
