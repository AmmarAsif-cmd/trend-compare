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
 * Calculate relevance score for a comparison
 * Higher score = more relevant
 */
function calculateRelevanceScore(
  comparisonTerms: string[],
  currentTerms: string[],
  currentCategory: string | null,
  comparisonCategory: string | null
): number {
  const [currentA, currentB] = currentTerms.map(t => t.toLowerCase());
  const [compA, compB] = comparisonTerms.map(t => t.toLowerCase());
  
  let score = 0;

  // Exact keyword match (highest priority)
  if (compA === currentA || compA === currentB || compB === currentA || compB === currentB) {
    score += 100;
  }

  // Partial keyword match (contains)
  if (compA.includes(currentA) || compA.includes(currentB) || 
      compB.includes(currentA) || compB.includes(currentB) ||
      currentA.includes(compA) || currentA.includes(compB) ||
      currentB.includes(compA) || currentB.includes(compB)) {
    score += 50;
  }

  // Category match (if both have categories)
  if (currentCategory && comparisonCategory && currentCategory === comparisonCategory) {
    score += 30;
  }

  // Related keywords match
  const relatedA = getRelatedKeywords(currentA, 5);
  const relatedB = getRelatedKeywords(currentB, 5);
  const allRelated = [...new Set([...relatedA, ...relatedB])].map(t => t.toLowerCase());
  
  if (allRelated.includes(compA) || allRelated.includes(compB)) {
    score += 20;
  }

  return score;
}

/**
 * Find related comparisons using intelligent relevance scoring.
 * Prioritizes exact matches, then category matches, then related keywords.
 */
export async function getRelatedComparisons(opts: {
  slug: string;
  terms: string[];
  limit?: number;
  category?: string | null;
}): Promise<RelatedComparison[]> {
  const { slug, terms, limit = 8, category = null } = opts;
  const [a, b] = terms;

  if (!a || !b) return [];

  // Get current comparison's category if not provided
  let currentCategory = category;
  if (!currentCategory) {
    try {
      const current = await prisma.comparison.findFirst({
        where: { slug },
        select: { category: true },
      });
      currentCategory = current?.category || null;
    } catch (e) {
      // Ignore errors, continue without category
    }
  }

  // Strategy 1: Find comparisons with the SAME keywords
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

  // Strategy 3: Find comparisons with same category
  const categoryFilter = currentCategory && currentCategory !== 'general' 
    ? { category: currentCategory }
    : {};

  // Combine all strategies
  const allPatterns = [...sameKeywordPatterns, ...relatedPatterns];

  const rows = await prisma.comparison.findMany({
    where: {
      slug: { not: slug },
      ...(Object.keys(categoryFilter).length > 0 ? categoryFilter : {}),
      OR: allPatterns.length > 0 ? allPatterns.map((p) => ({ slug: { contains: p } })) : undefined,
    },
    orderBy: { createdAt: "desc" },
    take: limit * 5, // Get more for better scoring
    select: {
      slug: true,
      timeframe: true,
      geo: true,
      category: true,
    },
  });

  const seen = new Set<string>();
  const scoredResults: Array<{ comp: RelatedComparison; score: number }> = [];

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

    // Calculate relevance score
    const score = calculateRelevanceScore(t, terms, currentCategory, row.category);

    scoredResults.push({ comp, score });
  }

  // Sort by relevance score (highest first)
  scoredResults.sort((a, b) => b.score - a.score);

  // Return top results
  return scoredResults.slice(0, limit).map(r => r.comp);
}
