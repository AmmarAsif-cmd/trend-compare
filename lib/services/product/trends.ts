/**
 * Google Trends Integration for Product Research
 * Fetches trend data for product analysis
 */

import { fetchSeriesGoogle, type TrendsOptions } from '@/lib/trends-google';
import type { SeriesPoint } from '@/lib/trends';

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

    // Fetch 12-month trend data
    const series = await fetchSeriesGoogle([keyword], opts);

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
    };
  } catch (error) {
    console.error(`[ProductTrends] Error fetching trend data for ${keyword}:`, error);
    return null;
  }
}

