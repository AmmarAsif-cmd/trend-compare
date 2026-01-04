/**
 * Get Maximum Historical Data for Predictions
 * Always fetches 5 years of data regardless of user's timeframe selection
 * This ensures better prediction accuracy
 */

import { fetchSeriesGoogle, type TrendsOptions } from './trends-google';
import type { SeriesPoint } from './trends';

/**
 * Fetch maximum historical data (5 years) for prediction purposes
 * This is independent of the user's selected timeframe
 */
export async function getMaxHistoricalData(
  terms: string[],
  geo: string = ''
): Promise<SeriesPoint[]> {
  try {
    console.log('[MaxHistoricalData] 📊 Fetching 5 years of data for predictions...');
    
    // Always use 5y timeframe for predictions (best accuracy)
    const series = await fetchSeriesGoogle(terms, {
      timeframe: '5y',
      geo,
    });
    
    if (!series || series.length === 0) {
      console.warn('[MaxHistoricalData] ⚠️ No 5y data, trying 12m...');
      // Fallback to 12m if 5y not available
      return await fetchSeriesGoogle(terms, {
        timeframe: '12m',
        geo,
      }) || [];
    }
    
    console.log(`[MaxHistoricalData] ✅ Got ${series.length} data points (${series.length > 100 ? '5y' : '12m'})`);
    return series;
  } catch (error) {
    console.error('[MaxHistoricalData] Error fetching max historical data:', error);
    // Fallback to 12m on error
    try {
      return await fetchSeriesGoogle(terms, {
        timeframe: '12m',
        geo,
      }) || [];
    } catch (fallbackError) {
      console.error('[MaxHistoricalData] Fallback also failed:', fallbackError);
      return [];
    }
  }
}


