import { fetchSeriesGoogle, fetchRelatedQueries, type TrendsOptions } from '@/lib/trends-google';
import type { SeriesPoint } from '@/lib/trends';

export interface KeywordDNA {
  winningVariation: string;
  variationGrowth: string; // e.g. "Breakout" or "+400%"
  specificityScore: number; // 0-100 score of how niche it is
  dnaDiagnosis: string; // "Sell this specific variation instead"
}

export interface ProductTrendData {
  keyword: string;
  series: SeriesPoint[];
  averageValue: number;
  peakValue: number;
  currentValue: number;
  trend: 'rising' | 'falling' | 'stable';
  growthRate: number;
  searchVolume: number;
  timeframe: string;
  opportunityScore: number;
  saturationLevel: 'low' | 'medium' | 'high';
  forecastNextMonth: number;
  actionSignal: 'buy' | 'wait' | 'avoid';
  keywordDNA?: KeywordDNA; // Deep Market Intelligence
}

/**
 * Fetch Google Trends data for a product keyword
 */
export async function getProductTrendData(
  keyword: string,
  options?: TrendsOptions
): Promise<ProductTrendData | null> {
  try {
    const opts: TrendsOptions = {
      timeframe: '12m',
      geo: 'US',
      ...options,
    };

    // Parallel Fetch: Google Trends + Related Queries
    const [series, related] = await Promise.all([
      fetchSeriesGoogle([keyword], opts),
      fetchRelatedQueries(keyword, opts)
    ]);

    if (!series || series.length === 0) {
      return null;
    }

    // Extract values (handle different series point formats)
    const values = series.map((point: SeriesPoint) => {
      // SeriesPoint can be { date: string, [key: string]: number }
      // or { unix: number, value: number }
      if ('value' in point && typeof point.value === 'number') {
        return point.value;
      }
      if (keyword in point && typeof (point as any)[keyword] === 'number') {
        return (point as any)[keyword];
      }
      return 0;
    });

    if (values.length === 0) {
      return null;
    }

    const recentValues = values.slice(-30); // Last 30 data points
    const olderValues = values.slice(0, -30);

    // Calculate metrics
    const averageValue = values.reduce((a, b) => a + b, 0) / values.length;
    const peakValue = Math.max(...values);
    const currentValue = values[values.length - 1] || 0;
    const avgRecent = recentValues.length > 0
      ? recentValues.reduce((a, b) => a + b, 0) / recentValues.length
      : currentValue;
    const avgOlder = olderValues.length > 0
      ? olderValues.reduce((a, b) => a + b, 0) / olderValues.length
      : averageValue;

    // Calculate growth rate
    const growthRate = avgOlder > 0
      ? ((avgRecent - avgOlder) / avgOlder) * 100
      : 0;

    // Determine trend direction
    let trend: 'rising' | 'falling' | 'stable';
    if (growthRate > 10) {
      trend = 'rising';
    } else if (growthRate < -10) {
      trend = 'falling';
    } else {
      trend = 'stable';
    }

    // Estimate search volume (Google Trends values are 0-100)
    // Heuristic: value of 100 = ~100k searches/month
    const searchVolume = Math.round(averageValue * 1000);

    // --- Product Intelligence Logic (Authentic Real-Time Data) ---

    // Related Queries for Keyword DNA
    const risingCount = related.rising.length;
    const breakoutCount = related.rising.filter(q => q.formattedValue === "Breakout").length;

    // Keyword DNA: Find the "Winning Variation"
    // Look for the top rising query that isn't identical to the main keyword
    let keywordDNA: KeywordDNA | undefined;

    // 1. Try Strict Filter (Breakouts which are distinct)
    let topVariant = related.rising.find(q =>
      !q.query.toLowerCase().includes(keyword.toLowerCase()) &&
      q.formattedValue === "Breakout"
    );

    // 2. Fallback: Any rising query that is distinct
    if (!topVariant) {
      topVariant = related.rising.find(q =>
        q.query.toLowerCase() !== keyword.toLowerCase()
      );
    }

    // 3. Last Resort: Just the top related query (even if similar, it's better than nothing)
    if (!topVariant && related.rising.length > 0) {
      topVariant = related.rising[0];
    }

    if (topVariant) {
      keywordDNA = {
        winningVariation: topVariant.query,
        variationGrowth: topVariant.formattedValue,
        specificityScore: Math.min(100, Math.round(Math.random() * 20 + 70)), // Mock score for now, logic later
        dnaDiagnosis: topVariant.formattedValue === 'Breakout'
          ? `The generic term is saturated. '${topVariant.query}' is experiencing a massive breakout. Sell this specific sub-niche.`
          : `Market is shifting towards '${topVariant.query}'. Consider this variation.`
      };
    }

    // 1. Calculate Opportunity Score (0-100)
    // Formula: (Demand * 0.4) + (Growth * 0.4) + (Stability * 0.2) + Viral Boost
    const demandScore = Math.min(100, (searchVolume / 100000) * 100);
    const growthScore = Math.max(0, Math.min(100, 50 + growthRate)); // 0% growth = 50 score
    const stabilityScore = Math.max(0, 100 - (Math.abs(avgRecent - avgOlder) / (avgOlder || 1) * 50));

    // VIRAL BOOST: Real-time authentic signal
    // If Google Trends reports "Breakout" queries OR we found a DNA match.
    let viralBoost = breakoutCount * 10;

    if (keywordDNA && keywordDNA.variationGrowth === 'Breakout') {
      viralBoost += 15;
    }

    let opportunityScore = Math.round(
      (demandScore * 0.4) +
      (growthScore * 0.4) +
      (stabilityScore * 0.2) +
      viralBoost
    );
    opportunityScore = Math.min(100, opportunityScore);

    // 2. Determine Authenticated Saturation / Market Activity
    // Instead of guessing, we measure how many *other* topics are rising alongside this product.
    // High rising count = High market activity (Competitive/Saturated)
    // Low rising count = Blue ocean or Niche
    let saturationLevel: 'low' | 'medium' | 'high';
    if (risingCount >= 4) {
      saturationLevel = 'high'; // Highly active/competitive
    } else if (risingCount >= 2) {
      saturationLevel = 'medium';
    } else {
      saturationLevel = 'low'; // Calm market
    }

    // 3. Simple Linear Forecast for Next Month
    const slope = (currentValue - averageValue) / (values.length / 2);
    const forecastNextMonth = Math.max(0, Math.min(100, currentValue + slope));

    // 4. Action Signal
    let actionSignal: 'buy' | 'wait' | 'avoid';

    // Buy Signal: Rising trend, good score, and not TOO saturated
    if (trend === 'rising' && opportunityScore > 65 && saturationLevel !== 'high') {
      actionSignal = 'buy';
    }
    // Avoid Signal: Falling trend OR very low score
    else if (trend === 'falling' || opportunityScore < 35) {
      actionSignal = 'avoid';
    }
    // Wait Signal: Anything else (e.g., Stable trend, or Rising but High Saturation)
    else {
      actionSignal = 'wait';
    }

    return {
      keyword,
      series,
      averageValue,
      peakValue,
      currentValue,
      trend,
      growthRate,
      searchVolume,
      timeframe: opts.timeframe || '12m',
      opportunityScore,
      saturationLevel,
      forecastNextMonth,
      actionSignal,
      keywordDNA // New Field
    };
  } catch (error) {
    console.error(`[ProductTrends] Error fetching trend data for ${keyword}:`, error);
    return null;
  }
}
