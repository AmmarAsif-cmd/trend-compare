// lib/trends-router.ts
import "server-only";
import { fetchSeries as fetchMock, SeriesPoint } from "./trends";
import { fetchSeriesGoogle, type TrendsOptions } from "./trends-google";

/**
 * Unified data fetching - uses Google Trends
 * Multi-source disabled for now until adapters are fully tested
 */
export async function fetchSeriesUnified(
  terms: string[],
  options?: TrendsOptions
): Promise<SeriesPoint[]> {
  const mode = process.env.TRENDS_MODE?.toLowerCase() ?? "mock";

  // Use Google Trends (reliable and tested)
  if (mode === "google") {
    try {
      const rows = await fetchSeriesGoogle(terms, options);
      if (rows?.length) {
        console.log(`[Trends] ✅ Got ${rows.length} data points from Google Trends`);
        return rows;
      }
    } catch (e) {
      console.error("[trends] google failed, falling back to mock", e);
    }
  }

  // Final fallback to mock data
  return fetchMock(terms);
}

/**
 * Get data sources used for a comparison (for display purposes)
 */
export async function getDataSources(
  terms: string[],
  options?: TrendsOptions
): Promise<string[]> {
  const mode = process.env.TRENDS_MODE?.toLowerCase() ?? "mock";

  // Note: Currently only Google Trends is active
  // Reddit/Wikipedia adapters need API keys and testing
  if (mode === "google") {
    return ["Google Trends"];
  }

  return ["Mock Data"];
}
