import { prisma } from "./db";
import { fetchSeriesUnified } from "./trends-router";
import { computeStats } from "./stats";
import { generateCopy } from "./ai";
import { stableHash } from "./hash";

type Args = { slug: string; terms: string[]; timeframe: string; geo: string };

export async function getOrBuildComparison({ slug, terms, timeframe, geo }: Args) {
  // 1) Try cache
  const existing = await prisma.comparison.findUnique({
    where: { slug_timeframe_geo: { slug, timeframe, geo } },
  });
  if (existing) return existing;

  // 2) Build fresh
  const series = await fetchSeriesUnified(terms, { timeframe, geo });
  if (!series.length) return null;

  const stats = computeStats(series, terms);
  const ai = generateCopy(terms, stats); // later you can swap to LLM output
  const dataHash = stableHash({ terms, timeframe, geo, series });

  // 3) Save and return
  return prisma.comparison.upsert({
    where: { slug_timeframe_geo: { slug, timeframe, geo } },
    create: { slug, timeframe, geo, terms, series, stats, ai, dataHash },
    update: { series, stats, ai, dataHash },
  });
}
