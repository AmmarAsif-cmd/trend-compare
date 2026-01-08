// Trending Products Analyzer
// Fetches and analyzes product trends from Google Trends

import { fetchSeriesGoogle } from '@/lib/trends-google';
import type { TrendAnalysis, TrendingProduct } from './types';
import {
  TREND_GROWTH_THRESHOLD_RISING,
  TREND_GROWTH_THRESHOLD_FALLING,
  SEARCH_VOLUME_MULTIPLIER,
  COMPETITION_HIGH_VOLUME_THRESHOLD,
  COMPETITION_MEDIUM_VOLUME_THRESHOLD,
  COMPETITION_LOW_SELLERS,
  COMPETITION_MEDIUM_SELLERS,
  COMPETITION_HIGH_SELLERS,
  OPPORTUNITY_SCORE_BASE,
  OPPORTUNITY_SCORE_TREND_RISING,
  OPPORTUNITY_SCORE_TREND_FALLING,
  OPPORTUNITY_SCORE_GROWTH_HIGH,
  OPPORTUNITY_SCORE_GROWTH_MEDIUM,
  OPPORTUNITY_SCORE_GROWTH_NEGATIVE,
  OPPORTUNITY_SCORE_VOLUME_SWEET_SPOT,
  OPPORTUNITY_SCORE_VOLUME_HIGH,
  OPPORTUNITY_SCORE_VOLUME_LOW,
  OPPORTUNITY_SCORE_COMPETITION_LOW,
  OPPORTUNITY_SCORE_COMPETITION_HIGH,
  OPPORTUNITY_SCORE_GO,
  OPPORTUNITY_SCORE_MAYBE,
  PRICE_ESTIMATE_MIN,
  PRICE_ESTIMATE_MAX,
  TRENDING_PRODUCTS_BATCH_SIZE,
  TRENDING_PRODUCTS_DEFAULT_LIMIT,
} from '@/lib/config/product-research';

/**
 * Analyze trend data for a product keyword
 */
export async function analyzeTrend(keyword: string): Promise<TrendAnalysis | null> {
  try {
    // Fetch 12-month trend data
    const series = await fetchSeriesGoogle([keyword], {
      timeframe: '12m',
      geo: 'US' // Focus on US market
    });

    if (!series || series.length === 0) {
      return null;
    }

    // Extract values
    const values = series.map((point: any) => Number(point[keyword]) || 0);
    const recentValues = values.slice(-30); // Last 30 days
    const olderValues = values.slice(0, -30);

    // Calculate metrics
    const averageValue = values.reduce((a: number, b: number) => a + b, 0) / values.length;
    const peakValue = Math.max(...values);
    const currentValue = recentValues[recentValues.length - 1] || 0;
    const avgRecent = recentValues.reduce((a: number, b: number) => a + b, 0) / recentValues.length;
    const avgOlder = olderValues.reduce((a: number, b: number) => a + b, 0) / olderValues.length;

    // Calculate growth rate
    const growthRate = avgOlder > 0
      ? ((avgRecent - avgOlder) / avgOlder) * 100
      : 0;

    // Determine trend direction
    let trend: 'rising' | 'falling' | 'stable';
    if (growthRate > TREND_GROWTH_THRESHOLD_RISING) trend = 'rising';
    else if (growthRate < TREND_GROWTH_THRESHOLD_FALLING) trend = 'falling';
    else trend = 'stable';

    // Estimate search volume (Google Trends values are 0-100)
    const searchVolume = Math.round(averageValue * SEARCH_VOLUME_MULTIPLIER);

    return {
      keyword,
      averageValue,
      peakValue,
      currentValue,
      trend,
      growthRate,
      searchVolume,
    };
  } catch (error) {
    console.error(`[TrendAnalyzer] Error analyzing ${keyword}:`, error);
    return null;
  }
}

/**
 * Calculate competition level based on keyword characteristics
 * This is a heuristic until we integrate Keepa API
 */
function estimateCompetition(keyword: string, trendData: TrendAnalysis): 'low' | 'medium' | 'high' {
  // Generic keywords = high competition
  const genericKeywords = ['phone', 'case', 'charger', 'cable', 'holder'];
  const isGeneric = genericKeywords.some(gk => keyword.toLowerCase().includes(gk));

  // High search volume = likely high competition
  const highVolume = trendData.searchVolume > COMPETITION_HIGH_VOLUME_THRESHOLD;

  if (isGeneric || highVolume) return 'high';
  if (trendData.searchVolume > COMPETITION_MEDIUM_VOLUME_THRESHOLD) return 'medium';
  return 'low';
}

/**
 * Calculate opportunity score (0-100)
 */
function calculateOpportunityScore(trendData: TrendAnalysis, competition: string): number {
  let score = OPPORTUNITY_SCORE_BASE;

  // Trend direction
  if (trendData.trend === 'rising') score += OPPORTUNITY_SCORE_TREND_RISING;
  else if (trendData.trend === 'falling') score += OPPORTUNITY_SCORE_TREND_FALLING;

  // Growth rate
  if (trendData.growthRate > 50) score += OPPORTUNITY_SCORE_GROWTH_HIGH;
  else if (trendData.growthRate > 20) score += OPPORTUNITY_SCORE_GROWTH_MEDIUM;
  else if (trendData.growthRate < -20) score += OPPORTUNITY_SCORE_GROWTH_NEGATIVE;

  // Search volume (sweet spot is 10k-50k)
  if (trendData.searchVolume >= 10000 && trendData.searchVolume <= 50000) {
    score += OPPORTUNITY_SCORE_VOLUME_SWEET_SPOT;
  } else if (trendData.searchVolume > 50000) {
    score += OPPORTUNITY_SCORE_VOLUME_HIGH; // Too competitive
  } else {
    score += OPPORTUNITY_SCORE_VOLUME_LOW; // Too low volume
  }

  // Competition penalty
  if (competition === 'low') score += OPPORTUNITY_SCORE_COMPETITION_LOW;
  else if (competition === 'high') score += OPPORTUNITY_SCORE_COMPETITION_HIGH;

  return Math.max(0, Math.min(100, score));
}

/**
 * Convert a product keyword into a TrendingProduct object
 */
export async function analyzeProduct(
  keyword: string,
  category: string
): Promise<TrendingProduct | null> {
  const trendData = await analyzeTrend(keyword);

  if (!trendData) {
    return null;
  }

  // Estimate competition (will be replaced with Keepa data later)
  const competitionLevel = estimateCompetition(keyword, trendData);
  const estimatedSellers = competitionLevel === 'low' ? COMPETITION_LOW_SELLERS :
                          competitionLevel === 'medium' ? COMPETITION_MEDIUM_SELLERS : COMPETITION_HIGH_SELLERS;

  // Estimate pricing (placeholder - will use Keepa later)
  const averagePrice = Math.round(PRICE_ESTIMATE_MIN + Math.random() * (PRICE_ESTIMATE_MAX - PRICE_ESTIMATE_MIN));
  const priceRange = {
    min: Math.round(averagePrice * 0.7),
    max: Math.round(averagePrice * 1.5),
  };

  // Calculate opportunity score
  const opportunityScore = calculateOpportunityScore(trendData, competitionLevel);

  // Determine verdict
  let verdict: 'GO' | 'MAYBE' | 'NO-GO';
  let reasons: string[] = [];

  if (opportunityScore >= OPPORTUNITY_SCORE_GO) {
    verdict = 'GO';
    reasons.push('Strong upward trend');
    if (competitionLevel === 'low') reasons.push('Low competition');
    if (trendData.searchVolume >= 10000) reasons.push('Good search volume');
  } else if (opportunityScore >= OPPORTUNITY_SCORE_MAYBE) {
    verdict = 'MAYBE';
    reasons.push('Moderate potential');
    if (competitionLevel === 'high') reasons.push('High competition - need differentiation');
    if (trendData.trend === 'stable') reasons.push('Stable demand');
  } else {
    verdict = 'NO-GO';
    if (trendData.trend === 'falling') reasons.push('Declining trend');
    if (trendData.searchVolume < 5000) reasons.push('Low search volume');
    if (competitionLevel === 'high') reasons.push('Saturated market');
  }

  // Create slug
  const slug = keyword.toLowerCase().replace(/\s+/g, '-');

  return {
    id: `${category}-${slug}`,
    productName: keyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    slug,
    category,

    trendScore: Math.round(trendData.currentValue),
    growthRate: `${trendData.growthRate > 0 ? '+' : ''}${Math.round(trendData.growthRate)}%`,
    searchVolume: trendData.searchVolume,

    competitionLevel,
    estimatedSellers,

    averagePrice,
    priceRange,

    isSeasonal: false, // TODO: Detect seasonality from trend data
    peakMonth: undefined,

    opportunityScore,
    verdict,
    reasons,

    lastUpdated: new Date().toISOString(),
    dataSource: 'google-trends',
  };
}

/**
 * Analyze multiple products in batch
 */
export async function analyzeProductsBatch(
  keywords: string[],
  category: string,
  limit: number = TRENDING_PRODUCTS_DEFAULT_LIMIT
): Promise<TrendingProduct[]> {
  console.log(`[TrendAnalyzer] Analyzing ${keywords.length} products for category: ${category}`);

  const results: TrendingProduct[] = [];

  // Process in batches to avoid rate limiting
  const batchSize = TRENDING_PRODUCTS_BATCH_SIZE;
  for (let i = 0; i < Math.min(keywords.length, limit); i += batchSize) {
    const batch = keywords.slice(i, i + batchSize);

    const batchResults = await Promise.allSettled(
      batch.map(keyword => analyzeProduct(keyword, category))
    );

    // Extract successful results
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value !== null) {
        results.push(result.value);
      } else {
        console.warn(`[TrendAnalyzer] Failed to analyze ${batch[index]}:`, result.status === 'rejected' ? result.reason : 'null result');
      }
    });

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < keywords.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Sort by opportunity score
  return results.sort((a, b) => b.opportunityScore - a.opportunityScore);
}
