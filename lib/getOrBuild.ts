import type { Comparison, Prisma } from "@prisma/client";
import { prisma } from "./db";
import { fetchSeriesUnified } from "./trends-router";
import { computeStats, type Stats } from "./stats";
import { generateCopy, type AICopy } from "./ai";
import type { SeriesPoint } from "./trends";
import { stableHash } from "./hash";

type Args = { slug: string; terms: string[]; timeframe: string; geo: string };

export type ComparisonPayload = {
  id: string;
  slug: string;
  timeframe: string;
  geo: string;
  terms: string[];
  series: SeriesPoint[];
  stats: Stats;
  ai: AICopy | null;
  dataHash: string;
  createdAt: Date;
  updatedAt: Date;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

function parseTerms(value: Prisma.JsonValue): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.every((v) => typeof v === "string") ? (value as string[]) : null;
}

function parseSeries(value: Prisma.JsonValue): SeriesPoint[] | null {
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

function parseStats(value: Prisma.JsonValue): Stats | null {
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

function parseAICopy(value: Prisma.JsonValue | null): AICopy | null {
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
  const existing = await prisma.comparison.findUnique({
    where: { slug_timeframe_geo: { slug, timeframe, geo } },
  });
  const normalizedExisting = existing ? normalizeRow(existing) : null;
  if (normalizedExisting) return normalizedExisting;

  // 2) Build fresh
  const series = await fetchSeriesUnified(terms, { timeframe, geo });
  if (!series.length) return null;

  const stats = computeStats(series, terms);
  const ai = generateCopy(terms, stats); // later you can swap to LLM output
  const dataHash = stableHash({ terms, timeframe, geo, series });

  // 3) Save and return
  const saved = await prisma.comparison.upsert({
    where: { slug_timeframe_geo: { slug, timeframe, geo } },
    create: { slug, timeframe, geo, terms, series, stats, ai, dataHash },
    update: { series, stats, ai, dataHash },
  });

  return normalizeRow(saved);
}
