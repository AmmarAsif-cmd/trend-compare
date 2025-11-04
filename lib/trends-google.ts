// lib/trends-google.ts
import "server-only";
import googleTrends from "google-trends-api";
import type { SeriesPoint } from "./trends";

export type TrendsOptions = {
  timeframe?: string; // '7d' | '30d' | '12m' | '5y' | 'all'
  geo?: string;       // 'GB', 'US', '' = worldwide
  tz?: number;        // minutes offset; 0 is fine
};

type TimelinePoint = {
  time: string;
  value: number[];
};

type InterestOverTimeResponse = {
  default?: {
    timelineData?: TimelinePoint[];
  };
};

const DEFAULT_OPTS: TrendsOptions = {
  timeframe: "12m",
  geo: "",
  tz: 0,
};

// Turn '7d' | '30d' | '12m' | '5y' | 'all' into a date range
function resolveRange(tf?: string): { startTime?: Date; endTime?: Date; useAll?: boolean } {
  const now = new Date();
  const end = now;
  const days = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  switch ((tf ?? "").toLowerCase()) {
    case "7d":  return { startTime: days(7), endTime: end };
    case "30d": return { startTime: days(30), endTime: end };
    case "12m": return { startTime: days(365), endTime: end };
    case "5y":  return { startTime: new Date(now.getFullYear() - 5, now.getMonth(), now.getDate()), endTime: end };
    case "all": return { useAll: true };
    default:    return { startTime: days(365), endTime: end };
  }
}

// Safe JSON.parse that returns null on HTML/invalid payloads
function safeParse<T = unknown>(raw: string): T | null {
  if (!raw || typeof raw !== "string") return null;
  const first = raw.trim()[0];
  if (first === "<") return null; // HTML error/consent page
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Single-term fetch (robust) */
async function fetchTermSeries(term: string, opts: TrendsOptions) {
  const range = resolveRange(opts.timeframe);
  const res = await googleTrends.interestOverTime({
    keyword: term,
    geo: opts.geo ?? DEFAULT_OPTS.geo,
    category: 0,
    hl: "en-GB",
    timezone: opts.tz ?? DEFAULT_OPTS.tz,
    granularTimeResolution: false,
    ...(range.useAll ? {} : { startTime: range.startTime, endTime: range.endTime }),
  });

  const data = safeParse<InterestOverTimeResponse>(res);
  const timeline = data?.default?.timelineData ?? [];

  return timeline.map((p) => ({
    unix: Number(p.time),
    value: Number(p.value?.[0] ?? 0),
  }));
}

/** Combined fetch (shared 0–100) with fallback to sequential */
export async function fetchSeriesGoogle(
  terms: string[],
  options?: TrendsOptions
): Promise<SeriesPoint[]> {
  if (!terms || terms.length < 2) return [];

  const opts = { ...DEFAULT_OPTS, ...(options ?? {}) };
  const range = resolveRange(opts.timeframe);

  // 1) Try combined call first
  try {
    const res = await googleTrends.interestOverTime({
      keyword: terms, // array => combined normalization
      geo: opts.geo,
      category: 0,
      hl: "en-GB",
      timezone: opts.tz,
      granularTimeResolution: false,
      ...(range.useAll ? {} : { startTime: range.startTime, endTime: range.endTime }),
    });

    const data = safeParse<InterestOverTimeResponse>(res);
    const timeline = data?.default?.timelineData ?? [];

    if (timeline?.length && timeline[0]?.value?.length === terms.length) {
      const series: SeriesPoint[] = timeline.map((p) => {
        const date = new Date(Number(p.time) * 1000).toISOString().slice(0, 10);
        const row: Record<string, number | string> = { date };
        terms.forEach((t, i) => (row[t] = Number(p.value?.[i] ?? 0)));
        return row as SeriesPoint;
      });
      if (series.length) return series;
    }
  } catch (e) {
    // swallow and fall back
    console.error("[trends] combined call failed, falling back to sequential:", e);
  }

  // 2) Fallback: sequential per-term calls (more resilient)
  const perTerm: Record<string, { unix: number; value: number }[]> = {};
  for (const t of terms) {
    try {
      perTerm[t] = await fetchTermSeries(t, opts);
    } catch (e) {
      perTerm[t] = [];
      console.error("[trends] term failed:", t, e);
    }
  }

  // Merge timelines
  const allUnix = new Set<number>();
  for (const t of terms) for (const r of perTerm[t] ?? []) allUnix.add(r.unix);
  const sortedUnix = Array.from(allUnix).sort((a, b) => a - b);

  const lookup: Record<string, Record<number, number>> = {};
  for (const t of terms) {
    const m: Record<number, number> = {};
    for (const { unix, value } of perTerm[t] ?? []) m[unix] = value;
    lookup[t] = m;
  }

  const series: SeriesPoint[] = sortedUnix.map((unix) => {
    const date = new Date(unix * 1000).toISOString().slice(0, 10);
    const row: Record<string, number | string> = { date };
    for (const t of terms) row[t] = lookup[t][unix] ?? 0;
    return row as SeriesPoint;
  });

  return series;
}
