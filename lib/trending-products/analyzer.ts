// Trending Products Analyzer
// Fetches and analyzes product trends from Google Trends

import { fetchSeriesGoogle } from '@/lib/trends-google';
import type { TrendAnalysis, TrendingProduct } from './types';

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
    if (growthRate > 10) trend = 'rising';
    else if (growthRate < -10) trend = 'falling';
    else trend = 'stable';

    // Estimate search volume (Google Trends values are 0-100)
    // We'll use a heuristic: value of 100 = ~100k searches/month
    const searchVolume = Math.round(averageValue * 1000);

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
  const highVolume = trendData.searchVolume > 50000;

  if (isGeneric || highVolume) return 'high';
  if (trendData.searchVolume > 20000) return 'medium';
  return 'low';
}

/**
 * Calculate opportunity score (0-100)
 */
function calculateOpportunityScore(trendData: TrendAnalysis, competition: string): number {
  let score = 50; // Base score

  // Trend direction
  if (trendData.trend === 'rising') score += 20;
  else if (trendData.trend === 'falling') score -= 20;

  // Growth rate
  if (trendData.growthRate > 50) score += 15;
  else if (trendData.growthRate > 20) score += 10;
  else if (trendData.growthRate < -20) score -= 15;

  // Search volume (sweet spot is 10k-50k)
  if (trendData.searchVolume >= 10000 && trendData.searchVolume <= 50000) {
    score += 15;
  } else if (trendData.searchVolume > 50000) {
    score += 5; // Too competitive
  } else {
    score -= 10; // Too low volume
  }

  // Competition penalty
  if (competition === 'low') score += 10;
  else if (competition === 'high') score -= 15;

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
  const estimatedSellers = competitionLevel === 'low' ? 50 :
                          competitionLevel === 'medium' ? 200 : 500;

  // Estimate pricing (placeholder - will use Keepa later)
  const averagePrice = Math.round(15 + Math.random() * 35); // $15-$50 range
  const priceRange = {
    min: Math.round(averagePrice * 0.7),
    max: Math.round(averagePrice * 1.5),
  };

  // Calculate opportunity score
  const opportunityScore = calculateOpportunityScore(trendData, competitionLevel);

  // Determine verdict
  let verdict: 'GO' | 'MAYBE' | 'NO-GO';
  let reasons: string[] = [];

  if (opportunityScore >= 70) {
    verdict = 'GO';
    reasons.push('Strong upward trend');
    if (competitionLevel === 'low') reasons.push('Low competition');
    if (trendData.searchVolume >= 10000) reasons.push('Good search volume');
  } else if (opportunityScore >= 50) {
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
  limit: number = 20
): Promise<TrendingProduct[]> {
  console.log(`[TrendAnalyzer] Analyzing ${keywords.length} products for category: ${category}`);

  const results: TrendingProduct[] = [];

  // Process in batches to avoid rate limiting
  const batchSize = 5;
  for (let i = 0; i < Math.min(keywords.length, limit); i += batchSize) {
    const batch = keywords.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(keyword => analyzeProduct(keyword, category))
    );

    results.push(...batchResults.filter((r): r is TrendingProduct => r !== null));

    // Small delay between batches
    if (i + batchSize < keywords.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Sort by opportunity score
  return results.sort((a, b) => b.opportunityScore - a.opportunityScore);
}
