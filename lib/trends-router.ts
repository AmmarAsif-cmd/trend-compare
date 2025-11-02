// lib/trends-router.ts
import "server-only";
import { fetchSeries as fetchMock, SeriesPoint } from "./trends";
import { fetchSeriesGoogle, type TrendsOptions } from "./trends-google";

/**
 * Prefers Google Trends when TRENDS_MODE=google, otherwise mock.
 * Falls back to mock if Google fails.
 */
export async function fetchSeriesUnified(
  terms: string[],
  options?: TrendsOptions
): Promise<SeriesPoint[]> {
  const mode = process.env.TRENDS_MODE?.toLowerCase() ?? "mock";

  if (mode === "google") {
    try {
      const rows = await fetchSeriesGoogle(terms, options);
      if (rows?.length) return rows;
    } catch (e) {
      console.error("[trends] google failed, falling back to mock", e);
    }
  }

  // fallback
  return fetchMock(terms);
}
