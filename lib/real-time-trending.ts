/**
 * Real-Time Trending System
 * Fetches actual trending searches from Google Trends
 * Updates twice daily (every 12 hours)
 */

import googleTrends from 'google-trends-api';

export interface TrendingItem {
  keyword: string;
  title: string;
  formattedTraffic: string;  // e.g., "200K+"
  traffic: number;            // Raw traffic number
  newsUrl?: string;
  imageUrl?: string;
  relatedQueries: string[];
  category?: string;
  timestamp: string;
}

/**
 * Cache for trending data
 * In production, this should be Redis or database
 */
let trendingCache: {
  data: TrendingItem[];
  timestamp: number;
  expiresAt: number;
} | null = null;

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for more dynamic updates

/**
 * Fallback trending data if Google Trends API fails
 */
const FALLBACK_TRENDING: TrendingItem[] = [
  { keyword: 'ChatGPT', title: 'ChatGPT', formattedTraffic: '2M+', traffic: 2000000, relatedQueries: ['AI', 'OpenAI', 'GPT-4'], timestamp: new Date().toISOString() },
  { keyword: 'iPhone 16', title: 'iPhone 16', formattedTraffic: '500K+', traffic: 500000, relatedQueries: ['Apple', 'iPhone 15', 'iOS'], timestamp: new Date().toISOString() },
  { keyword: 'Netflix', title: 'Netflix', formattedTraffic: '1M+', traffic: 1000000, relatedQueries: ['Shows', 'Movies', 'Prime Video'], timestamp: new Date().toISOString() },
  { keyword: 'Cricket World Cup', title: 'Cricket World Cup', formattedTraffic: '800K+', traffic: 800000, relatedQueries: ['India', 'Live Score', 'ICC'], timestamp: new Date().toISOString() },
  { keyword: 'Stock Market', title: 'Stock Market', formattedTraffic: '600K+', traffic: 600000, relatedQueries: ['Nifty', 'Sensex', 'Trading'], timestamp: new Date().toISOString() },
  { keyword: 'Weather Today', title: 'Weather Today', formattedTraffic: '400K+', traffic: 400000, relatedQueries: ['Forecast', 'Temperature', 'Rain'], timestamp: new Date().toISOString() },
  { keyword: 'Bitcoin', title: 'Bitcoin', formattedTraffic: '350K+', traffic: 350000, relatedQueries: ['Crypto', 'Ethereum', 'BTC Price'], timestamp: new Date().toISOString() },
  { keyword: 'Elections 2024', title: 'Elections 2024', formattedTraffic: '300K+', traffic: 300000, relatedQueries: ['Voting', 'Results', 'Polls'], timestamp: new Date().toISOString() },
];

/**
 * Fetch real-time trending searches from Google Trends
 */
export async function getRealTimeTrending(
  geo: string = 'US',  // US by default for better data availability
  limit: number = 20
): Promise<TrendingItem[]> {
  // Check cache first
  if (trendingCache && Date.now() < trendingCache.expiresAt) {
    console.log('[Trending] Serving from cache');
    return trendingCache.data.slice(0, limit);
  }

  console.log('[Trending] Fetching fresh data from Google Trends...');

  try {
    // Fetch daily trends from Google Trends
    // @ts-ignore - dailyTrends exists but not in type definitions
    const results = await googleTrends.dailyTrends({
      geo,
      trendDate: new Date(), // Today's trends
    });

    const parsed = JSON.parse(results);
    const trendingSearches = parsed.default?.trendingSearchesDays?.[0]?.trendingSearches || [];

    if (trendingSearches.length === 0) {
      throw new Error('No trending data received from Google Trends');
    }

    const items: TrendingItem[] = trendingSearches.map((trend: any) => {
      const keyword = trend.title?.query || '';
      const traffic = parseInt(trend.formattedTraffic?.replace(/[^0-9]/g, '') || '0', 10);

      // Get related queries
      const relatedQueries = (trend.relatedQueries || [])
        .map((q: any) => q.query)
        .filter(Boolean)
        .slice(0, 5);

      return {
        keyword,
        title: keyword,
        formattedTraffic: trend.formattedTraffic || 'Trending',
        traffic,
        newsUrl: trend.articles?.[0]?.url,
        imageUrl: trend.image?.imageUrl,
        relatedQueries,
        timestamp: new Date().toISOString(),
      };
    });

    // Update cache
    trendingCache = {
      data: items,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_DURATION,
    };

    console.log(`[Trending] ✓ Fetched ${items.length} trending items from Google Trends`);

    return items.slice(0, limit);
  } catch (error) {
    console.error('[Trending] ✗ Failed to fetch from Google Trends:', error);

    // Return cache if available, even if expired
    if (trendingCache) {
      console.log('[Trending] → Using expired cache as fallback');
      return trendingCache.data.slice(0, limit);
    }

    // Use fallback trending data
    console.log('[Trending] → Using fallback trending data');

    // Cache fallback data for 1 hour
    trendingCache = {
      data: FALLBACK_TRENDING,
      timestamp: Date.now(),
      expiresAt: Date.now() + (60 * 60 * 1000), // 1 hour
    };

    return FALLBACK_TRENDING.slice(0, limit);
  }
}

/**
 * Get trending comparison suggestions
 * Creates comparison pairs from trending keywords
 */
export async function getTrendingComparisons(
  geo: string = 'IN',
  limit: number = 10
): Promise<Array<{ term1: string; term2: string; slug: string; category?: string }>> {
  const trending = await getRealTimeTrending(geo, 30);

  const comparisons: Array<{ term1: string; term2: string; slug: string; category?: string }> = [];

  // Strategy 1: Pair related queries
  for (const item of trending) {
    if (item.relatedQueries.length > 0) {
      const related = item.relatedQueries[0];
      comparisons.push({
        term1: item.keyword,
        term2: related,
        slug: `${toSlug(item.keyword)}-vs-${toSlug(related)}`,
      });

      if (comparisons.length >= limit) break;
    }
  }

  // Strategy 2: Pair items in same category
  // (This would use the keyword categories system)

  return comparisons.slice(0, limit);
}

/**
 * Get trending keywords for a specific category
 */
export async function getTrendingByCategory(
  category: string,
  geo: string = 'IN'
): Promise<TrendingItem[]> {
  const allTrending = await getRealTimeTrending(geo, 50);

  // Filter by category (would integrate with keyword-categories.ts)
  return allTrending.filter(item => {
    const lower = item.keyword.toLowerCase();

    switch (category) {
      case 'technology':
        return lower.match(/iphone|android|tech|gadget|phone|computer|app|software/);
      case 'entertainment':
        return lower.match(/movie|show|actor|singer|music|netflix|film/);
      case 'sports':
        return lower.match(/cricket|football|player|match|sport|team/);
      case 'politics':
        return lower.match(/election|minister|party|government|political/);
      default:
        return false;
    }
  });
}

/**
 * Force refresh the cache
 */
export async function refreshTrendingCache(geo: string = 'IN'): Promise<void> {
  trendingCache = null;
  await getRealTimeTrending(geo);
}

/**
 * Get cache status
 */
export function getCacheStatus(): {
  isCached: boolean;
  age: number;
  expiresIn: number;
  itemCount: number;
} {
  if (!trendingCache) {
    return {
      isCached: false,
      age: 0,
      expiresIn: 0,
      itemCount: 0,
    };
  }

  const now = Date.now();
  return {
    isCached: true,
    age: now - trendingCache.timestamp,
    expiresIn: Math.max(0, trendingCache.expiresAt - now),
    itemCount: trendingCache.data.length,
  };
}

/**
 * Helper: Convert keyword to slug
 */
function toSlug(keyword: string): string {
  return keyword
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
