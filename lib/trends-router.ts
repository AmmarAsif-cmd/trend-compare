// lib/trends-router.ts
import "server-only";
import { fetchSeries as fetchMock, SeriesPoint } from "./trends";
import { fetchSeriesGoogle, type TrendsOptions } from "./trends-google";
import { dataOrchestrator } from "./sources/orchestrator";
import type { MultiSourceData } from "./sources/types";

/**
 * Unified data fetching - Option A Architecture:
 * - Chart: Uses Google Trends only (fast, reliable)
 * - Stats: Uses combined weighted data from all sources
 * - Individual sections: Show source-specific insights
 */
export async function fetchSeriesUnified(
  terms: string[],
  options?: TrendsOptions
): Promise<SeriesPoint[]> {
  const mode = process.env.TRENDS_MODE?.toLowerCase() ?? "mock";

  // Use Google Trends for chart data (Option A - fast and reliable)
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
 * Get multi-source data for stats and insights (Option A)
 * Returns weighted combination and individual source breakdowns
 */
export async function getMultiSourceData(
  terms: string[],
  options?: TrendsOptions
): Promise<{ termA: MultiSourceData | null; termB: MultiSourceData | null }> {
  const mode = process.env.TRENDS_MODE?.toLowerCase() ?? "mock";

  if (mode !== "google") {
    return { termA: null, termB: null };
  }

  try {
    // Calculate date range from timeframe
    const endDate = new Date();
    const startDate = new Date();
    const timeframe = options?.timeframe ?? "12m";

    switch (timeframe) {
      case "7d":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(endDate.getDate() - 90);
        break;
      case "12m":
      default:
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    // Fetch from all sources for both terms
    const [resultA, resultB] = await Promise.all([
      dataOrchestrator.fetchWithFallback(terms[0] || "", startDate, endDate),
      terms.length > 1
        ? dataOrchestrator.fetchWithFallback(terms[1] || "", startDate, endDate)
        : Promise.resolve(null),
    ]);

    console.log(`[Multi-Source] Term A sources: ${resultA.metadata.sourcesUsed.join(", ")}`);
    if (resultB) {
      console.log(`[Multi-Source] Term B sources: ${resultB.metadata.sourcesUsed.join(", ")}`);
    }

    return {
      termA: resultA,
      termB: resultB,
    };
  } catch (error) {
    console.error("[Multi-Source] Failed to fetch multi-source data:", error);
    return { termA: null, termB: null };
  }
}

/**
 * Get data sources used for a comparison (for display purposes)
 */
export async function getDataSources(
  terms: string[],
  options?: TrendsOptions
): Promise<string[]> {
  const mode = process.env.TRENDS_MODE?.toLowerCase() ?? "mock";

  if (mode === "google") {
    try {
      // Get multi-source data to see which sources succeeded
      const multiSourceData = await getMultiSourceData(terms, options);

      const sources = new Set<string>();
      if (multiSourceData.termA) {
        multiSourceData.termA.metadata.sourcesUsed.forEach((s) => sources.add(s));
      }
      if (multiSourceData.termB) {
        multiSourceData.termB.metadata.sourcesUsed.forEach((s) => sources.add(s));
      }

      if (sources.size > 0) {
        // Convert source IDs to display names
        const displayNames: Record<string, string> = {
          "google-trends": "Google Trends",
          "reddit": "Reddit",
          "wikipedia": "Wikipedia",
          "github": "GitHub",
        };

        return Array.from(sources).map((s) => displayNames[s] || s);
      }
    } catch (error) {
      console.error("[Data Sources] Failed to get sources:", error);
    }

    // Fallback to Google Trends only
    return ["Google Trends"];
  }

  return ["Mock Data"];
}
