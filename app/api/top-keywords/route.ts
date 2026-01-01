import { NextRequest, NextResponse } from "next/server";
import { getRealTimeTrending } from "@/lib/real-time-trending";
import { isValidKeyword } from "@/lib/keyword-validator";
import { checkETag, createCacheHeaders } from '@/lib/utils/etag';

/**
 * API endpoint for real-time trending keywords from Google Trends
 * GET /api/top-keywords?refresh=true - Force refresh cache
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === 'true';
  
  try {
    // Force refresh cache if requested
    if (forceRefresh) {
      const { refreshTrendingCache } = await import('@/lib/real-time-trending');
      await refreshTrendingCache('US');
    }
    
    // Fetch real-time trending keywords from Google Trends
    const trendingItems = await getRealTimeTrending('US', 20);

    // Format for frontend
    const keywords = trendingItems
      .filter(item => isValidKeyword(item.keyword))
      .map(item => ({
        keyword: item.keyword,
        traffic: item.formattedTraffic || 'Trending',
        relatedQueries: item.relatedQueries || [],
      }))
      .slice(0, 10); // Top 10

    const responseData = {
      keywords,
      lastUpdate: new Date().toISOString(),
      source: "Google Trends (Real-Time)",
      cacheDuration: "10 minutes",
    };

    // Generate ETag and check for 304 Not Modified (only if not force refresh)
    if (!forceRefresh) {
      const cacheHeaders = createCacheHeaders(responseData, 600, 1800); // 10 min cache, 30 min stale
      const etag = (cacheHeaders as Record<string, string>)['ETag'];
      
      if (etag && checkETag(request, etag)) {
        return new NextResponse(null, { status: 304, headers: cacheHeaders });
      }
      
      return NextResponse.json(responseData, { headers: cacheHeaders });
    }
    
    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error("[Top Keywords API] Error:", error);
    
    // Fallback keywords
    const fallbackKeywords = [
      { keyword: 'ChatGPT', traffic: '2M+', relatedQueries: ['AI', 'OpenAI'] },
      { keyword: 'iPhone 16', traffic: '500K+', relatedQueries: ['Apple', 'iOS'] },
      { keyword: 'Netflix', traffic: '1M+', relatedQueries: ['Shows', 'Movies'] },
      { keyword: 'Bitcoin', traffic: '350K+', relatedQueries: ['Crypto', 'BTC'] },
      { keyword: 'Weather', traffic: '400K+', relatedQueries: ['Forecast', 'Temperature'] },
    ];

    return NextResponse.json({
      keywords: fallbackKeywords,
      lastUpdate: new Date().toISOString(),
      source: "Fallback Data",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
