/**
 * Best Buy Adapter
 * Fetches product data including ratings, reviews, and pricing
 */

import type { DataSourceAdapter, SourceConfig, SourceResult, SourceDataPoint } from '../types';

const BESTBUY_API_BASE = 'https://api.bestbuy.com/v1';

export type BestBuyProduct = {
  sku: string;
  name: string;
  description: string;
  manufacturer: string;
  modelNumber: string;
  regularPrice: number;
  salePrice: number | null;
  onSale: boolean;
  customerReviewAverage: number;
  customerReviewCount: number;
  image: string | null;
  url: string;
  categoryPath: string;
  inStock: boolean;
};

export type BestBuySearchResult = {
  products: BestBuyProduct[];
  total: number;
};

export class BestBuyAdapter implements DataSourceAdapter {
  name: 'bestbuy' = 'bestbuy' as const;
  config: SourceConfig;
  private apiKey: string | null;
  private requestCount = 0;
  private resetTime: Date | null = null;

  constructor(config: Partial<SourceConfig> = {}) {
    this.apiKey = process.env.BESTBUY_API_KEY || null;
    this.config = {
      enabled: !!this.apiKey,
      priority: 3,
      timeout: 10000,
      retries: 2,
      rateLimit: { requests: 50, period: 10000 },
      ...config,
    };
  }

  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      const response = await fetch(
        `${BESTBUY_API_BASE}/products(sku=1234)?apiKey=${this.apiKey}&format=json`,
        { method: 'GET' }
      );
      // 200 or 404 both mean the API is working
      return response.ok || response.status === 404;
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
      return this.createFailedResult(term, startDate, endDate, 'Best Buy API key not configured');
    }

    try {
      const product = await this.searchProduct(term);

      if (!product) {
        return this.createFailedResult(term, startDate, endDate, 'Product not found');
      }

      // Use review score (0-5) normalized to 0-100 scale
      const normalizedRating = Math.round(product.customerReviewAverage * 20);

      const dataPoints: SourceDataPoint[] = [{
        date: new Date().toISOString().split('T')[0],
        value: normalizedRating,
        rawValue: product.customerReviewAverage,
        source: 'bestbuy' as const,
      }];

      return {
        source: 'bestbuy' as const,
        status: 'active',
        data: dataPoints,
        metadata: {
          term,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          dataPoints: 1,
          confidence: product.customerReviewCount > 100 ? 85 : 70,
          notes: `${product.name}: ${product.customerReviewAverage}/5 (${product.customerReviewCount.toLocaleString()} reviews)`,
        },
        fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[BestBuy] Fetch error:', error);
      return this.createFailedResult(
        term,
        startDate,
        endDate,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async searchProduct(query: string): Promise<BestBuyProduct | null> {
    if (!this.apiKey) return null;

    // Search for products matching the query
    const searchUrl = `${BESTBUY_API_BASE}/products((search=${encodeURIComponent(query)}))?apiKey=${this.apiKey}&format=json&show=sku,name,shortDescription,manufacturer,modelNumber,regularPrice,salePrice,onSale,customerReviewAverage,customerReviewCount,image,url,categoryPath,inStoreAvailability&pageSize=1`;

    const response = await fetch(searchUrl);

    if (!response.ok) {
      throw new Error(`Best Buy search failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.products || data.products.length === 0) {
      return null;
    }

    const product = data.products[0];
    return this.normalizeProduct(product);
  }

  async getProductBySku(sku: string): Promise<BestBuyProduct | null> {
    if (!this.apiKey) return null;

    const response = await fetch(
      `${BESTBUY_API_BASE}/products(sku=${sku})?apiKey=${this.apiKey}&format=json&show=sku,name,shortDescription,manufacturer,modelNumber,regularPrice,salePrice,onSale,customerReviewAverage,customerReviewCount,image,url,categoryPath,inStoreAvailability`
    );

    if (!response.ok) {
      throw new Error(`Best Buy product fetch failed: ${response.status}`);
    }

    const product = await response.json();
    return this.normalizeProduct(product);
  }

  async compareProducts(termA: string, termB: string): Promise<{
    productA: BestBuyProduct | null;
    productB: BestBuyProduct | null;
    winner: 'A' | 'B' | 'tie' | null;
    comparison: {
      rating: { winner: string; diff: number };
      reviews: { winner: string; diff: number };
      price: { winner: string; diff: number };
    } | null;
  }> {
    const [productA, productB] = await Promise.all([
      this.searchProduct(termA),
      this.searchProduct(termB),
    ]);

    if (!productA || !productB) {
      return { productA, productB, winner: null, comparison: null };
    }

    const ratingDiff = productA.customerReviewAverage - productB.customerReviewAverage;
    const reviewsDiff = productA.customerReviewCount - productB.customerReviewCount;
    const priceDiff = productA.regularPrice - productB.regularPrice;

    let score = 0;
    // Better rating
    if (ratingDiff > 0.2) score++;
    else if (ratingDiff < -0.2) score--;

    // More reviews (social proof)
    if (reviewsDiff > 100) score++;
    else if (reviewsDiff < -100) score--;

    // Lower price is better for products
    if (priceDiff < -50) score++;
    else if (priceDiff > 50) score--;

    const winner = score > 0 ? 'A' : score < 0 ? 'B' : 'tie';

    return {
      productA,
      productB,
      winner,
      comparison: {
        rating: {
          winner: ratingDiff >= 0 ? termA : termB,
          diff: Math.abs(ratingDiff),
        },
        reviews: {
          winner: reviewsDiff >= 0 ? termA : termB,
          diff: Math.abs(reviewsDiff),
        },
        price: {
          winner: priceDiff <= 0 ? termA : termB,
          diff: Math.abs(priceDiff),
        },
      },
    };
  }

  private normalizeProduct(raw: {
    sku?: number | string;
    name?: string;
    shortDescription?: string;
    manufacturer?: string;
    modelNumber?: string;
    regularPrice?: number;
    salePrice?: number;
    onSale?: boolean;
    customerReviewAverage?: number;
    customerReviewCount?: number;
    image?: string | null;
    url?: string;
    categoryPath?: { name: string }[];
    inStoreAvailability?: boolean;
  }): BestBuyProduct {
    return {
      sku: String(raw.sku || ''),
      name: raw.name || '',
      description: raw.shortDescription || '',
      manufacturer: raw.manufacturer || '',
      modelNumber: raw.modelNumber || '',
      regularPrice: raw.regularPrice || 0,
      salePrice: raw.salePrice || null,
      onSale: raw.onSale || false,
      customerReviewAverage: raw.customerReviewAverage || 0,
      customerReviewCount: raw.customerReviewCount || 0,
      image: raw.image || null,
      url: raw.url || '',
      categoryPath: raw.categoryPath ? raw.categoryPath.map((c: { name: string }) => c.name).join(' > ') : '',
      inStock: raw.inStoreAvailability || false,
    };
  }

  private createFailedResult(
    term: string,
    startDate: Date,
    endDate: Date,
    error: string
  ): SourceResult {
    return {
      source: 'bestbuy' as const,
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
    const limit = this.config.rateLimit?.requests || 50;
    return {
      remaining: Math.max(0, limit - this.requestCount),
      resetAt: this.resetTime,
    };
  }
}

export const bestBuyAdapter = new BestBuyAdapter();
