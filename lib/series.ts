// lib/series.ts
import type { SeriesPoint } from "./trends";

/** Rolling average smoothing to make spike-y series more readable */
export function smoothSeries(series: SeriesPoint[], window = 4): SeriesPoint[] {
  if (!series?.length || window <= 1) return series;
  const keys = Object.keys(series[0]).filter(k => k !== "date");
  const out: SeriesPoint[] = [];

  for (let i = 0; i < series.length; i++) {
    const slice = series.slice(Math.max(0, i - window + 1), i + 1);
    const row: Record<string, number | string> = { date: series[i].date };
    for (const k of keys) {
      const avg =
        slice.reduce((sum, r) => sum + Number(r[k] ?? 0), 0) / slice.length;
      row[k] = Number(avg.toFixed(2));
    }
    out.push(row as SeriesPoint);
  }
  return out;
}

/** Fraction of rows where at least one term > 0 */
export function nonZeroRatio(series: SeriesPoint[]): number {
  if (!series?.length) return 0;
  let nz = 0;
  for (const row of series) {
    for (const [k, v] of Object.entries(row)) {
      if (k !== "date" && typeof v === "number" && v > 0) {
        nz++;
        break;
      }
    }
  }
  return nz / series.length;
}

/**
 * Downsample series to reduce payload size
 * Keeps every Nth point, with smart sampling to preserve important points
 */
export function downsampleSeries(series: SeriesPoint[], maxPoints: number = 200): SeriesPoint[] {
  if (!series?.length || series.length <= maxPoints) return series;
  
  const step = Math.ceil(series.length / maxPoints);
  const downsampled: SeriesPoint[] = [];
  
  // Always include first and last points
  downsampled.push(series[0]);
  
  // Sample every Nth point
  for (let i = step; i < series.length - 1; i += step) {
    downsampled.push(series[i]);
  }
  
  // Always include last point
  if (series.length > 1) {
    downsampled.push(series[series.length - 1]);
  }
  
  return downsampled;
}