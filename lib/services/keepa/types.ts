// Keepa API TypeScript interfaces
// Documentation: https://keepa.com/#!discuss/t/product-object/116

export interface KeepaProduct {
  asin: string;
  title: string;
  domainId: number; // 1 = .com, 2 = .co.uk, etc.
  type: number;
  productType: number;
  categoryTree: number[];

  // CSV time series data
  csv: number[][]; // Multi-dimensional array with price/rank history

  // Image URLs
  imagesCSV: string;

  // Ratings & Reviews
  rating: number;
  reviewCount: number;

  // Sales rank
  salesRanks: Record<string, number>;
  salesRankReference: number;

  // Statistics
  stats: {
    current: number[];
    avg: number[];
    min: number[];
    max: number[];
    count: number[];
    outOfStockPercentage30: number;
    outOfStockPercentage90: number;
  };

  // Offers
  offersSuccessful: boolean;
  offers?: Array<{
    offerId: number;
    lastSeen: number;
    condition: number;
    conditionComment?: string;
    price: number;
    shipping: number;
    isPrime: boolean;
    isFBA: boolean;
  }>;

  // Brand & Features
  brand?: string;
  manufacturer?: string;
  features?: string[];
  description?: string;

  // Variation data (parent/child products)
  parentAsin?: string;
  variationCSV?: string;

  // Dates
  lastUpdate: number; // Keepa minute timestamp
  lastPriceChange: number;
  lastRatingUpdate: number;

  // Availability
  availabilityAmazon: number; // -1 = Out of stock, 0 = In stock
}

export interface KeepaSearchResult {
  asin: string;
  productType: number;
  title: string;
  domainId: number;
}

export interface KeepaResponse {
  products: KeepaProduct[];
  tokensLeft: number;
  refillIn: number;
  refillRate: number;
  timestamp: number;
}

export interface KeepaApiError {
  error: string;
  code?: number;
}

// CSV indices for different data types
// https://keepa.com/#!discuss/t/statistics/1308
export enum KeepaCSVIndex {
  AMAZON = 0, // Amazon price
  NEW = 1, // Marketplace new price
  USED = 2, // Marketplace used price
  SALES_RANK = 3, // Sales rank
  LISTPRICE = 4, // List price
  COLLECTIBLE = 5, // Collectible price
  REFURBISHED = 6, // Refurbished price
  NEW_FBM = 7, // New FBM (Fulfilled by Merchant) price
  LIGHTNING_DEAL = 8, // Lightning deal info
  WAREHOUSE = 9, // Warehouse deals price
  NEW_FBA = 10, // New FBA price
  COUNT_NEW = 11, // Count of new offers
  COUNT_USED = 12, // Count of used offers
  COUNT_REFURBISHED = 13, // Count of refurbished offers
  COUNT_COLLECTIBLE = 14, // Count of collectible offers
  EXTRA_INFO = 15, // Extra info
  RATING = 16, // Product rating
  COUNT_REVIEWS = 17, // Review count
  BUY_BOX_SHIPPING = 18, // Buy box shipping
  USED_NEW_SHIPPING = 19, // Used - Like New shipping
  USED_VERY_GOOD_SHIPPING = 20, // Used - Very Good shipping
  USED_GOOD_SHIPPING = 21, // Used - Good shipping
  USED_ACCEPTABLE_SHIPPING = 22, // Used - Acceptable shipping
  COLLECTIBLE_NEW_SHIPPING = 23, // Collectible - Like New shipping
  COLLECTIBLE_VERY_GOOD_SHIPPING = 24, // Collectible - Very Good shipping
  COLLECTIBLE_GOOD_SHIPPING = 25, // Collectible - Good shipping
  COLLECTIBLE_ACCEPTABLE_SHIPPING = 26, // Collectible - Acceptable shipping
  REFURBISHED_SHIPPING = 27, // Refurbished shipping
  BUY_BOX_IS_UNQUALIFIED = 28, // Buy box is unqualified
  BUY_BOX_IS_USED = 29, // Buy box is used
  PRIME_EXCLUSIVE = 30, // Prime exclusive
}

// Helper type for parsed chart data
export interface ChartDataPoint {
  date: Date;
  price: number | null;
  salesRank: number | null;
}

export interface ParsedKeepaData {
  asin: string;
  title: string;
  currentPrice: number | null;
  averagePrice: number | null;
  minPrice: number;
  maxPrice: number;
  currentSalesRank: number | null;
  averageSalesRank: number | null;
  rating: number | null;
  reviewCount: number | null;
  priceHistory: ChartDataPoint[];
  salesRankHistory: ChartDataPoint[];
  outOfStockPercentage30Days: number;
  outOfStockPercentage90Days: number;
  brand: string | null;
  imageUrl: string | null;
  category: string | null;
}
