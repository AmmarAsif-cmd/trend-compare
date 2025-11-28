// lib/relatedComparisons.ts
import { prisma } from "@/lib/db";
import { fromSlug } from "@/lib/slug";
import { getKeywordCategory, getRelatedKeywords } from "@/lib/keyword-categories";

export type RelatedComparison = {
  slug: string;
  terms: string[];
  timeframe: string;
  geo: string;
};

/**
 * Find related comparisons using both keyword matching AND category-based suggestions.
 * This shows niche-based suggestions (e.g., "samsung vs pixel" for "iphone vs android")
 */
export async function getRelatedComparisons(opts: {
  slug: string;
  terms: string[];
  limit?: number;
}): Promise<RelatedComparison[]> {
  const { slug, terms, limit = 8 } = opts;
  const [a, b] = terms;

  if (!a || !b) return [];

  // Strategy 1: Find comparisons with the SAME keywords (like before)
  const sameKeywordPatterns = [
    `${a}-vs-`,
    `-vs-${a}`,
    `${b}-vs-`,
    `-vs-${b}`,
  ];

  // Strategy 2: Find comparisons with RELATED keywords (category-based)
  const relatedKeywordsA = getRelatedKeywords(a, 10);
  const relatedKeywordsB = getRelatedKeywords(b, 10);
  const allRelatedKeywords = [...new Set([...relatedKeywordsA, ...relatedKeywordsB])];

  // Build patterns for related keywords
  const relatedPatterns = allRelatedKeywords.flatMap((kw) => [
    `${kw}-vs-`,
    `-vs-${kw}`,
  ]);

  // Combine both strategies - prioritize same keywords, then related
  const allPatterns = [...sameKeywordPatterns, ...relatedPatterns];

  const rows = await prisma.comparison.findMany({
    where: {
      slug: { not: slug },          // skip the page we are on
      OR: allPatterns.map((p) => ({ slug: { contains: p } })),
    },
    orderBy: { createdAt: "desc" },
    take: limit * 3,                // take extra for filtering and mixing
    select: {
      slug: true,
      timeframe: true,
      geo: true,
    },
  });

  const seen = new Set<string>();
  const sameKeywordResults: RelatedComparison[] = [];
  const categoryResults: RelatedComparison[] = [];

  for (const row of rows) {
    if (!row.slug || seen.has(row.slug)) continue;
    seen.add(row.slug);

    const t = fromSlug(row.slug);
    if (t.length !== 2) continue;

    const comp: RelatedComparison = {
      slug: row.slug,
      terms: t,
      timeframe: row.timeframe ?? "12m",
      geo: row.geo ?? "",
    };

    // Check if this uses same keywords or related keywords
    const usesSameKeyword = t.some(term =>
      term === a || term === b
    );

    if (usesSameKeyword) {
      sameKeywordResults.push(comp);
    } else {
      categoryResults.push(comp);
    }
  }

  // Mix results: 50% same keywords, 50% category-based
  const result: RelatedComparison[] = [];
  const halfLimit = Math.ceil(limit / 2);

  // Add same-keyword comparisons first (up to half the limit)
  result.push(...sameKeywordResults.slice(0, halfLimit));

  // Fill remaining slots with category-based suggestions
  const remaining = limit - result.length;
  result.push(...categoryResults.slice(0, remaining));

  // If we don't have enough, fill with more same-keyword results
  if (result.length < limit) {
    const moreNeeded = limit - result.length;
    result.push(...sameKeywordResults.slice(halfLimit, halfLimit + moreNeeded));
  }

  return result.slice(0, limit);
}
