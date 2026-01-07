// Keepa API Client
// Documentation: https://keepa.com/#!discuss/t/request-products/110

import type {
  KeepaProduct,
  KeepaResponse,
  KeepaSearchResult,
  ChartDataPoint,
  ParsedKeepaData,
} from './types';
import { KeepaCSVIndex } from './types';

const KEEPA_API_BASE = 'https://api.keepa.com';
const KEEPA_API_KEY = process.env.KEEPA_API_KEY;

// Keepa uses a special time format: minutes since Keepa epoch (21 Dec 2011)
const KEEPA_EPOCH = new Date('2011-12-21T00:00:00Z').getTime();

/**
 * Convert Keepa minute timestamp to JavaScript Date
 */
export function keepaMinuteToDate(keepaMinute: number): Date {
  return new Date(KEEPA_EPOCH + keepaMinute * 60 * 1000);
}

/**
 * Convert JavaScript Date to Keepa minute timestamp
 */
export function dateToKeepaMinute(date: Date): number {
  return Math.floor((date.getTime() - KEEPA_EPOCH) / (60 * 1000));
}

/**
 * Search for products by name/keyword
 */
export async function searchProducts(
  query: string,
  domain: number = 1, // 1 = Amazon.com
  maxResults: number = 10
): Promise<KeepaSearchResult[]> {
  if (!KEEPA_API_KEY) {
    throw new Error('KEEPA_API_KEY is not configured');
  }

  const params = new URLSearchParams({
    key: KEEPA_API_KEY,
    domain: domain.toString(),
    type: 'product',
    term: query,
    range: maxResults.toString(),
  });

  const response = await fetch(`${KEEPA_API_BASE}/search?${params}`, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Keepa API error: ${error.error || response.statusText}`);
  }

  const data = await response.json();
  return data.asinList || [];
}

/**
 * Get product data by ASIN
 */
export async function getProductByAsin(
  asin: string,
  domain: number = 1,
  statsInDays: number = 365
): Promise<KeepaProduct | null> {
  if (!KEEPA_API_KEY) {
    throw new Error('KEEPA_API_KEY is not configured');
  }

  const params = new URLSearchParams({
    key: KEEPA_API_KEY,
    domain: domain.toString(),
    asin: asin,
    stats: statsInDays.toString(),
    rating: '1', // Include rating history
    offers: '20', // Include up to 20 offers
  });

  const response = await fetch(`${KEEPA_API_BASE}/product?${params}`, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Keepa API error: ${error.error || response.statusText}`);
  }

  const data: KeepaResponse = await response.json();

  if (!data.products || data.products.length === 0) {
    return null;
  }

  return data.products[0];
}

/**
 * Get product data by search query (convenience method)
 * Searches for product and returns detailed data for the first result
 */
export async function getProductByQuery(
  query: string,
  domain: number = 1,
  statsInDays: number = 365
): Promise<KeepaProduct | null> {
  // Search for the product
  const searchResults = await searchProducts(query, domain, 1);

  if (searchResults.length === 0) {
    return null;
  }

  // Get detailed product data
  return getProductByAsin(searchResults[0].asin, domain, statsInDays);
}

/**
 * Parse Keepa CSV format to chart data
 * Keepa CSV is a 2D array where each sub-array is [time, value, time, value, ...]
 */
export function parseKeepaCSV(
  csv: number[][],
  index: KeepaCSVIndex
): ChartDataPoint[] {
  if (!csv || !csv[index]) {
    return [];
  }

  const data = csv[index];
  const points: ChartDataPoint[] = [];

  // Keepa CSV format: [time1, value1, time2, value2, ...]
  for (let i = 0; i < data.length; i += 2) {
    const time = data[i];
    const value = data[i + 1];

    if (time !== undefined && value !== undefined && value !== -1) {
      points.push({
        date: keepaMinuteToDate(time),
        price: index < 10 ? value / 100 : null, // Price values are in cents
        salesRank: index === KeepaCSVIndex.SALES_RANK ? value : null,
      });
    }
  }

  return points;
}

/**
 * Parse Keepa product data into a more usable format
 */
export function parseKeepaProduct(product: KeepaProduct): ParsedKeepaData {
  // Parse price history (Amazon price)
  const priceHistory = parseKeepaCSV(product.csv, KeepaCSVIndex.AMAZON);

  // Parse sales rank history
  const salesRankHistory = parseKeepaCSV(product.csv, KeepaCSVIndex.SALES_RANK);

  // Get current values
  const currentPrice = priceHistory.length > 0
    ? priceHistory[priceHistory.length - 1].price
    : null;

  const currentSalesRank = salesRankHistory.length > 0
    ? salesRankHistory[salesRankHistory.length - 1].salesRank
    : null;

  // Calculate averages
  const validPrices = priceHistory
    .map(p => p.price)
    .filter((p): p is number => p !== null);

  const averagePrice = validPrices.length > 0
    ? validPrices.reduce((sum, p) => sum + p, 0) / validPrices.length
    : null;

  const validRanks = salesRankHistory
    .map(p => p.salesRank)
    .filter((r): r is number => r !== null);

  const averageSalesRank = validRanks.length > 0
    ? validRanks.reduce((sum, r) => sum + r, 0) / validRanks.length
    : null;

  // Get min/max prices
  const minPrice = product.stats?.min?.[KeepaCSVIndex.AMAZON]
    ? product.stats.min[KeepaCSVIndex.AMAZON] / 100
    : Math.min(...validPrices);

  const maxPrice = product.stats?.max?.[KeepaCSVIndex.AMAZON]
    ? product.stats.max[KeepaCSVIndex.AMAZON] / 100
    : Math.max(...validPrices);

  // Get image URL
  let imageUrl: string | null = null;
  if (product.imagesCSV) {
    const images = product.imagesCSV.split(',');
    if (images.length > 0) {
      imageUrl = `https://images-na.ssl-images-amazon.com/images/I/${images[0]}`;
    }
  }

  return {
    asin: product.asin,
    title: product.title,
    currentPrice,
    averagePrice,
    minPrice: isFinite(minPrice) ? minPrice : 0,
    maxPrice: isFinite(maxPrice) ? maxPrice : 0,
    currentSalesRank,
    averageSalesRank,
    rating: product.rating ? product.rating / 10 : null,
    reviewCount: product.reviewCount || null,
    priceHistory,
    salesRankHistory,
    outOfStockPercentage30Days: product.stats?.outOfStockPercentage30 || 0,
    outOfStockPercentage90Days: product.stats?.outOfStockPercentage90 || 0,
    brand: product.brand || null,
    imageUrl,
    category: null, // Would need category tree lookup
  };
}

/**
 * Get token status
 */
export async function getTokenStatus(): Promise<{
  tokensLeft: number;
  refillIn: number;
  refillRate: number;
}> {
  if (!KEEPA_API_KEY) {
    throw new Error('KEEPA_API_KEY is not configured');
  }

  const response = await fetch(`${KEEPA_API_BASE}/token?key=${KEEPA_API_KEY}`);

  if (!response.ok) {
    throw new Error('Failed to get token status');
  }

  return response.json();
}
