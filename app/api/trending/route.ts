import { NextRequest, NextResponse } from 'next/server';
import { getKeywordsForCategory } from '@/lib/trending-products/categories';
import { analyzeProductsBatch } from '@/lib/trending-products/analyzer';
import { getCachedTrendingProducts, setCachedTrendingProducts } from '@/lib/trending-products/cache';
import type { TrendingProductsResponse } from '@/lib/trending-products/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for analysis

/**
 * GET /api/trending?category=electronics&limit=20
 * Fetch trending products for a category
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Check cache first
    const cached = await getCachedTrendingProducts(category);
    if (cached) {
      const response: TrendingProductsResponse = {
        products: cached.slice(0, limit),
        category,
        total: cached.length,
        lastUpdated: cached[0]?.lastUpdated || new Date().toISOString(),
      };
      return NextResponse.json(response);
    }

    // Get keywords for category
    const keywords = getKeywordsForCategory(category as any);
    if (keywords.length === 0) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Analyze products (this will take some time)
    console.log(`[Trending API] Analyzing ${keywords.length} products for ${category}...`);
    const products = await analyzeProductsBatch(keywords, category, Math.min(keywords.length, 30));

    // Cache the results
    await setCachedTrendingProducts(category, products);

    const response: TrendingProductsResponse = {
      products: products.slice(0, limit),
      category,
      total: products.length,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Trending API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending products' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/trending/refresh
 * Manually refresh trending products cache
 */
export async function POST(request: NextRequest) {
  try {
    const { category } = await request.json();

    // Clear cache for category
    const { clearTrendingCache } = await import('@/lib/trending-products/cache');
    await clearTrendingCache(category);

    return NextResponse.json({ success: true, message: 'Cache cleared' });
  } catch (error) {
    console.error('[Trending API] Refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh cache' },
      { status: 500 }
    );
  }
}
