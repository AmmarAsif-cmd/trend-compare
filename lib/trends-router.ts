// lib/trends-router.ts
import "server-only";
import { fetchSeries as fetchMock, SeriesPoint } from "./trends";
import { fetchSeriesGoogle, type TrendsOptions } from "./trends-google";
import { dataOrchestrator } from "./sources/orchestrator";

/**
 * Multi-source data fetching with intelligent fallback
 * Sources: Google Trends (primary), Reddit, Wikipedia
 * Falls back gracefully if sources fail
 */
export async function fetchSeriesUnified(
  terms: string[],
  options?: TrendsOptions
): Promise<SeriesPoint[]> {
  const mode = process.env.TRENDS_MODE?.toLowerCase() ?? "mock";
  const enableMultiSource = process.env.ENABLE_MULTI_SOURCE !== "false"; // Default enabled

  // Try multi-source data if enabled and we have exactly 2 terms
  if (mode === "google" && enableMultiSource && terms.length === 2) {
    try {
      console.log(`[Multi-Source] Fetching data for: ${terms.join(" vs ")}`);

      // Calculate date range
      const timeframe = options?.timeframe || "12m";
      const endDate = new Date();
      const startDate = new Date();

      // Map timeframes to days
      const timeframeDays: Record<string, number> = {
        "7d": 7,
        "30d": 30,
        "12m": 365,
        "5y": 1825,
        "all": 3650, // ~10 years
      };

      const days = timeframeDays[timeframe] || 365;
      startDate.setDate(startDate.getDate() - days);

      // Fetch from all sources (Google Trends, Reddit, Wikipedia)
      const [resultA, resultB] = await Promise.all([
        dataOrchestrator.fetchWithFallback(terms[0], startDate, endDate, 'google-trends'),
        dataOrchestrator.fetchWithFallback(terms[1], startDate, endDate, 'google-trends'),
      ]);

      // Check if we got good data from multiple sources
      const sourcesA = resultA.sources.filter(s => s.status === 'active' || s.status === 'degraded');
      const sourcesB = resultB.sources.filter(s => s.status === 'active' || s.status === 'degraded');

      if (resultA.combined.length > 0 && resultB.combined.length > 0) {
        console.log(`[Multi-Source] ✅ Got data from ${sourcesA.length} sources for ${terms[0]}, ${sourcesB.length} sources for ${terms[1]}`);

        // Convert to SeriesPoint format
        const series: SeriesPoint[] = [];
        const dateMap = new Map<string, SeriesPoint>();

        // Initialize all dates from both results
        [...resultA.combined, ...resultB.combined].forEach(point => {
          if (!dateMap.has(point.date)) {
            dateMap.set(point.date, {
              date: point.date,
              [terms[0]]: 0,
              [terms[1]]: 0,
            });
          }
        });

        // Fill in values from each term
        resultA.combined.forEach(point => {
          const existing = dateMap.get(point.date);
          if (existing) {
            existing[terms[0]] = point.value;
          }
        });

        resultB.combined.forEach(point => {
          const existing = dateMap.get(point.date);
          if (existing) {
            existing[terms[1]] = point.value;
          }
        });

        // Convert map to sorted array
        const sortedSeries = Array.from(dateMap.values())
          .sort((a, b) => a.date.localeCompare(b.date));

        if (sortedSeries.length > 0) {
          console.log(`[Multi-Source] ✅ Returning ${sortedSeries.length} data points from multiple sources`);
          return sortedSeries;
        }
      }

      console.log(`[Multi-Source] ⚠️ Multi-source failed, falling back to Google Trends only`);
    } catch (e) {
      console.error("[Multi-Source] Error, falling back to Google Trends:", e);
    }
  }

  // Fallback to Google Trends only
  if (mode === "google") {
    try {
      const rows = await fetchSeriesGoogle(terms, options);
      if (rows?.length) {
        console.log(`[Trends] ✅ Got ${rows.length} data points from Google Trends only`);
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
  const enableMultiSource = process.env.ENABLE_MULTI_SOURCE !== "false";

  if (mode === "google" && enableMultiSource && terms.length === 2) {
    // Return all potentially active sources
    return ["Google Trends", "Reddit", "Wikipedia"];
  } else if (mode === "google") {
    return ["Google Trends"];
  }

  return ["Mock Data"];
}
