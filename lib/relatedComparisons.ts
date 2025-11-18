// lib/relatedComparisons.ts
import { prisma } from "@/lib/db";
import { fromSlug } from "@/lib/slug";

export type RelatedComparison = {
  slug: string;
  terms: string[];
  timeframe: string;
  geo: string;
};

/**
 * Find other comparisons that include either of the current terms.
 * Uses slug pattern matching and orders by recency.
 */
export async function getRelatedComparisons(opts: {
  slug: string;
  terms: string[];
  limit?: number;
}): Promise<RelatedComparison[]> {
  const { slug, terms, limit = 6 } = opts;
  const [a, b] = terms;

  if (!a || !b) return [];

  // Simple slug based patterns, eg "virat-kohli-vs-" or "-vs-virat-kohli"
  const patterns = [
    `${a}-vs-`,
    `-vs-${a}`,
    `${b}-vs-`,
    `-vs-${b}`,
  ];

  const rows = await prisma.comparison.findMany({
    where: {
      slug: { not: slug },          // skip the page we are on
      OR: patterns.map((p) => ({ slug: { contains: p } })),
    },
    orderBy: { createdAt: "desc" },
    take: limit * 2,                // take a few extra then dedupe
    select: {
      slug: true,
      timeframe: true,
      geo: true,
    },
  });

  const seen = new Set<string>();
  const result: RelatedComparison[] = [];

  for (const row of rows) {
    if (!row.slug || seen.has(row.slug)) continue;
    seen.add(row.slug);

    const t = fromSlug(row.slug);
    if (t.length !== 2) continue;

    result.push({
      slug: row.slug,
      terms: t,
      timeframe: row.timeframe ?? "12m",
      geo: row.geo ?? "",
    });

    if (result.length >= limit) break;
  }

  return result;
}
