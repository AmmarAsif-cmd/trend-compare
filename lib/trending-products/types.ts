// Trending Products Types

export interface TrendingProduct {
  id: string;
  productName: string;
  slug: string;
  category: string;

  // Trend metrics
  trendScore: number; // 0-100, higher is better
  growthRate: string; // e.g., "+245%"
  searchVolume: number; // Monthly search volume

  // Competition metrics
  competitionLevel: 'low' | 'medium' | 'high';
  estimatedSellers: number; // Number of sellers on Amazon

  // Pricing
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
  };

  // Seasonality
  peakMonth?: string;
  isSeasonal: boolean;

  // AI verdict
  opportunityScore: number; // 0-100
  verdict: 'GO' | 'MAYBE' | 'NO-GO';
  reasons: string[];

  // Metadata
  lastUpdated: string;
  dataSource: 'google-trends' | 'keepa' | 'hybrid';
}

export interface TrendingProductsResponse {
  products: TrendingProduct[];
  category: string;
  total: number;
  lastUpdated: string;
}

export interface TrendAnalysis {
  keyword: string;
  averageValue: number;
  peakValue: number;
  currentValue: number;
  trend: 'rising' | 'falling' | 'stable';
  growthRate: number; // Percentage
  searchVolume: number;
}
