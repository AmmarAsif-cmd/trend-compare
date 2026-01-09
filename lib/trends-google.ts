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

/**
 * Convert sluggy tokens back to phrases and quote multi-word terms so Google Trends
 * treats them as exact phrases.
 *
 * Examples:
 * - "open-ai"   -> "open ai" -> "\"open ai\""
 * - "iphone-16" -> "iphone 16" -> "\"iphone 16\""
 * - "gemini"    -> "gemini"
 * - already quoted -> unchanged
 */
function normalizeTerm(term: string): string {
  let t = (term ?? "").trim();

  // If it looks slugified (has '-' but no spaces), convert dashes to spaces.
  // We avoid touching terms that already have spaces or quotes.
  if (t.includes("-") && !t.includes(" ") && !/^".+"$/.test(t)) {
    t = t.replace(/-/g, " ");
  }

  // If it now contains whitespace and isn't already quoted, wrap in quotes for phrase match.
  if (/\s/.test(t) && !/^".+"$/.test(t)) {
    t = `"${t}"`;
  }

  return t;
}

function normalizeTerms(terms: string[]): string[] {
  return (terms ?? []).map(normalizeTerm);
}

// Turn '7d' | '30d' | '12m' | '5y' | 'all' into a date range
function resolveRange(tf?: string): { startTime?: Date; endTime?: Date; useAll?: boolean } {
  const now = new Date();
  const end = now;
  const days = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  switch ((tf ?? "").toLowerCase()) {
    case "7d": return { startTime: days(7), endTime: end };
    case "30d": return { startTime: days(30), endTime: end };
    case "12m": return { startTime: days(365), endTime: end };
    case "5y": return { startTime: new Date(now.getFullYear() - 5, now.getMonth(), now.getDate()), endTime: end };
    case "all": return { useAll: true };
    default: return { startTime: days(365), endTime: end };
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

  try {
    const res = await googleTrends.interestOverTime({
      keyword: normalizeTerm(term), // <-- phrase-aware
      geo: opts.geo ?? DEFAULT_OPTS.geo,
      category: 0,
      hl: "en-GB",
      timezone: opts.tz ?? DEFAULT_OPTS.tz,
      granularTimeResolution: false,
      ...(range.useAll ? {} : { startTime: range.startTime, endTime: range.endTime }),
    });

    // Check if response is HTML (error page) before parsing
    if (typeof res === 'string' && (res.trim().startsWith('<') || res.includes('<!DOCTYPE') || res.includes('<html'))) {
      console.warn(`[trends] Google Trends returned HTML for term "${term}", likely rate-limited or blocked`);
      throw new Error('Google Trends returned HTML response (likely rate-limited)');
    }

    const data = safeParse<InterestOverTimeResponse>(res);
    if (!data) {
      console.warn(`[trends] Failed to parse Google Trends response for term "${term}"`);
      throw new Error('Failed to parse Google Trends response');
    }

    const timeline = data?.default?.timelineData ?? [];

    return timeline.map((p) => ({
      unix: Number(p.time),
      value: Number(p.value?.[0] ?? 0),
    }));
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    const isSyntaxError = e instanceof SyntaxError || errorMsg.includes('JSON') || errorMsg.includes('Unexpected token');

    // If it's a SyntaxError (HTML response parsed as JSON), log it specifically
    if (isSyntaxError) {
      console.warn(`[trends] ⚠️ Google Trends returned HTML for term "${term}" (likely rate-limited). Error:`, errorMsg);
    } else {
      console.error(`[trends] Failed to fetch term "${term}":`, errorMsg);
    }

    // Return empty array on error (caller will handle it)
    return [];
  }
}

/** Combined fetch (shared 0–100) with fallback to sequential */
export async function fetchSeriesGoogle(
  terms: string[],
  options?: TrendsOptions
): Promise<SeriesPoint[]> {
  if (!terms || terms.length < 1) return [];

  const opts = { ...DEFAULT_OPTS, ...(options ?? {}) };
  const range = resolveRange(opts.timeframe);

  // 1) Try combined call first (best relative normalization)
  try {
    const res = await googleTrends.interestOverTime({
      keyword: normalizeTerms(terms), // <-- phrase-aware + de-slug
      geo: opts.geo,
      category: 0,
      hl: "en-GB",
      timezone: opts.tz,
      granularTimeResolution: false,
      ...(range.useAll ? {} : { startTime: range.startTime, endTime: range.endTime }),
    });

    // Check if response is HTML (error page) before parsing
    if (typeof res === 'string' && (res.trim().startsWith('<') || res.includes('<!DOCTYPE') || res.includes('<html'))) {
      console.warn('[trends] Google Trends returned HTML instead of JSON, likely rate-limited or blocked');
      throw new Error('Google Trends returned HTML response (likely rate-limited)');
    }

    const data = safeParse<InterestOverTimeResponse>(res);
    if (!data) {
      console.warn('[trends] Failed to parse Google Trends response, response preview:',
        typeof res === 'string' ? res.substring(0, 200) : String(res).substring(0, 200));
      throw new Error('Failed to parse Google Trends response');
    }

    const timeline = data?.default?.timelineData ?? [];

    if (timeline?.length && timeline[0]?.value?.length === terms.length) {
      const series: SeriesPoint[] = timeline.map((p) => {
        const date = new Date(Number(p.time) * 1000).toISOString().slice(0, 10);
        const row: Record<string, number | string> = { date };
        // Keep original labels for display (don't show quotes/spaces changes)
        terms.forEach((t, i) => (row[t] = Number(p.value?.[i] ?? 0)));
        return row as SeriesPoint;
      });
      if (series.length) return series;
    }
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    const isSyntaxError = e instanceof SyntaxError || errorMsg.includes('JSON') || errorMsg.includes('Unexpected token');

    // If it's a SyntaxError (HTML response parsed as JSON), log it specifically
    if (isSyntaxError) {
      console.warn("[trends] ⚠️ Google Trends returned HTML instead of JSON (likely rate-limited or blocked). Error:", errorMsg);
      console.warn("[trends] ⚠️ Falling back to sequential per-term calls...");
    } else {
      console.error("[trends] combined call failed, falling back to sequential:", errorMsg);
    }

    // If it's a rate limit or HTML response error, log it specifically
    if (errorMsg.includes('HTML') || errorMsg.includes('rate-limit') || isSyntaxError) {
      console.warn("[trends] ⚠️ Google Trends may be rate-limiting requests. Consider adding delays between requests.");
    }
  }

  // 2) Fallback: sequential per-term calls (more resilient)
  const perTerm: Record<string, { unix: number; value: number }[]> = {};
  for (const t of terms) {
    try {
      perTerm[t] = await fetchTermSeries(t, opts); // normalizeTerm inside
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

export type RelatedQuery = {
  query: string;
  value: number; // For top queries, this is 0-100. For rising, this is % growth
  formattedValue: string; // e.g., "+3,500%" or "Breakout"
  link: string;
};

export async function fetchRelatedQueries(keyword: string, options?: TrendsOptions): Promise<{ top: RelatedQuery[]; rising: RelatedQuery[] }> {
  const opts = { ...DEFAULT_OPTS, ...(options ?? {}) };
  const range = resolveRange(opts.timeframe);

  try {
    const res = await googleTrends.relatedQueries({
      keyword: normalizeTerm(keyword),
      geo: opts.geo,
      hl: "en-GB",
      timezone: opts.tz,
      ...(range.useAll ? {} : { startTime: range.startTime, endTime: range.endTime }),
    });

    const data = safeParse<any>(res);
    if (!data || !data.default || !data.default.rankedList) return { top: [], rising: [] };

    const topList = data.default.rankedList.find((l: any) => l.rankedKeyword && l.rankedKeyword.length > 0 && l.rankedKeyword[0].formattedValue !== "Breakout")?.rankedKeyword || [];
    const risingList = data.default.rankedList.find((l: any) => l.rankedKeyword && l.rankedKeyword.length > 0 && (l.rankedKeyword[0].formattedValue.includes("%") || l.rankedKeyword[0].formattedValue === "Breakout"))?.rankedKeyword || [];

    const mapQuery = (q: any) => ({
      query: q.query,
      value: q.value,
      formattedValue: q.formattedValue,
      link: q.link
    });

    return {
      top: topList.map(mapQuery).slice(0, 5),
      rising: risingList.map(mapQuery).slice(0, 5)
    };

  } catch (e) {
    console.error(`[trends] Failed to fetch related queries for "${keyword}":`, e);
    return { top: [], rising: [] };
  }
}
