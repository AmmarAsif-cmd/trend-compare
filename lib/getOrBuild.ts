import { prisma } from "./db";
import { fetchSeriesUnified } from "./trends-router";
import { computeStats, type Stats } from "./stats";
import { generateCopy, type AICopy } from "./ai";
import type { SeriesPoint } from "./trends";
import { stableHash } from "./hash";
import { withTimeout } from "./utils/timeout";
import { retryWithBackoff } from "./utils/retry";
import { InsufficientDataError } from "./utils/errors";

type Args = { slug: string; terms: string[]; timeframe: string; geo: string };

type Comparison = {
  id: string;
  slug: string;
  terms: any;
  series: any;
  stats: any;
  ai: any;
  category: string | null;
  timeframe: string;
  geo: string;
  dataHash: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ComparisonPayload = {
  id: string;
  slug: string;
  timeframe: string;
  geo: string;
  terms: string[];
  series: SeriesPoint[];
  stats: Stats;
  ai: AICopy | null;
  category: string | null;
  dataHash: string;
  createdAt: Date;
  updatedAt: Date;
  error?: string; // Error code if comparison failed
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

function parseTerms(value: any): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.every((v: any) => typeof v === "string") ? (value as string[]) : null;
}

function parseSeries(value: any): SeriesPoint[] | null {
  if (!Array.isArray(value)) return null;
  const entries = value as unknown[];
  const valid = entries.every((entry) => {
    if (!isObject(entry) || typeof entry.date !== "string") return false;
    return Object.entries(entry).every(([key, val]) =>
      key === "date" || typeof val === "number" || typeof val === "string"
    );
  });
  return valid ? (entries as SeriesPoint[]) : null;
}

function parseStats(value: any): Stats | null {
  if (!isObject(value)) return null;
  const { global_avg, peaks } = value as Record<string, unknown>;
  if (!isObject(global_avg) || !Array.isArray(peaks)) return null;
  const globalOk = Object.values(global_avg).every((v) => typeof v === "number");
  const peaksOk = peaks.every((p) =>
    isObject(p) &&
    typeof p.term === "string" &&
    typeof p.date === "string" &&
    typeof p.value === "number"
  );
  if (!globalOk || !peaksOk) return null;
  return {
    global_avg: global_avg as Record<string, number>,
    peaks: peaks as Array<{ term: string; date: string; value: number }>,
  } satisfies Stats;
}

function parseAICopy(value: any): AICopy | null {
  if (!value || !isObject(value)) return null;
  const { title, metaDescription, summary, verdict, insights, faq } =
    value as Record<string, unknown>;
  const baseStrings = [title, metaDescription, summary, verdict].every(
    (v) => typeof v === "string"
  );
  const insightsOk = Array.isArray(insights) && insights.every((i) => typeof i === "string");
  const faqOk =
    Array.isArray(faq) &&
    faq.every(
      (entry) =>
        isObject(entry) && typeof entry.q === "string" && typeof entry.a === "string"
    );
  if (!baseStrings || !insightsOk || !faqOk) return null;
  return {
    title: title as string,
    metaDescription: metaDescription as string,
    summary: summary as string,
    verdict: verdict as string,
    insights: insights as string[],
    faq: faq as Array<{ q: string; a: string }>,
  } satisfies AICopy;
}

function normalizeRow(row: Comparison): ComparisonPayload | null {
  const terms = parseTerms(row.terms);
  const series = parseSeries(row.series);
  const stats = parseStats(row.stats);
  const ai = parseAICopy(row.ai ?? null);
  if (!terms || !series || !stats) return null;
  return {
    id: row.id,
    slug: row.slug,
    timeframe: row.timeframe,
    geo: row.geo,
    terms,
    series,
    stats,
    ai,
    category: row.category,
    dataHash: row.dataHash,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  } satisfies ComparisonPayload;
}

export async function getOrBuildComparison({
  slug,
  terms,
  timeframe,
  geo,
}: Args): Promise<ComparisonPayload | null> {
  // 1) Try cache
  let existing = null;
  try {
    existing = await prisma.comparison.findUnique({
      where: { slug_timeframe_geo: { slug, timeframe, geo } },
    });
  } catch (error: any) {
    // If database doesn't have the schema set up yet, continue without cache
    if (error?.code === 'P1008' || error?.message?.includes('column')) {
      console.warn('[getOrBuildComparison] Database schema not ready, skipping cache');
    } else {
      throw error;
    }
  }
  const normalizedExisting = existing ? normalizeRow(existing) : null;
  if (normalizedExisting) return normalizedExisting;

  // 2) Build fresh with timeout and retry
  let series: SeriesPoint[];
  try {
    series = await retryWithBackoff(
      () => withTimeout(
        fetchSeriesUnified(terms, { timeframe, geo }),
        15000, // 15 second timeout for Google Trends
        'Google Trends request timed out'
      ),
      {
        maxRetries: 2,
        initialDelay: 1000,
        shouldRetry: (error) => {
          // Retry on timeout or network errors
          return error?.name === 'TimeoutError' || 
                 error?.code === 'ECONNRESET' || 
                 error?.code === 'ETIMEDOUT';
        }
      }
    );
  } catch (error) {
    console.error('[getOrBuildComparison] Failed to fetch series:', error);
    // Return error payload instead of null
    throw new InsufficientDataError(terms, timeframe, geo);
  }

  if (!series || series.length === 0) {
    throw new InsufficientDataError(terms, timeframe, geo);
  }

  const stats = computeStats(series, terms);
  const ai = generateCopy(terms, stats); // later you can swap to LLM output
  const dataHash = stableHash({ terms, timeframe, geo, series });

  // 3) Save and return
  let saved;
  try {
    saved = await prisma.comparison.upsert({
      where: { slug_timeframe_geo: { slug, timeframe, geo } },
      create: { slug, timeframe, geo, terms, series, stats, ai, dataHash },
      update: { series, stats, ai, dataHash },
    });
  } catch (error: any) {
    // If database doesn't have the schema set up yet, return the data without saving
    if (error?.code === 'P1008' || error?.message?.includes('column')) {
      console.warn('[getOrBuildComparison] Could not save to database, returning data');
      return {
        id: 'temp-' + Date.now(),
        slug,
        timeframe,
        geo,
        terms,
        series: series as any,
        stats,
        ai,
        category: null,
        dataHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } else {
      throw error;
    }
  }

  return normalizeRow(saved);
}
