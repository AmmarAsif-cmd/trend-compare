// lib/relatedComparisons.ts
import { prisma } from "@/lib/db";
import { fromSlug, toCanonicalSlug } from "@/lib/slug";
import { getKeywordCategory, getRelatedKeywords } from "@/lib/keyword-categories";

// Helper to slugify a single term
function slugifyTerm(term: string): string {
  return term.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

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

  // Slugify terms for pattern matching (database stores slugs, not raw terms)
  const slugA = slugifyTerm(a);
  const slugB = slugifyTerm(b);

  // Strategy 1: Find comparisons with the SAME keywords (slugified)
  const sameKeywordPatterns = [
    `${slugA}-vs-`,
    `-vs-${slugA}`,
    `${slugB}-vs-`,
    `-vs-${slugB}`,
  ];

  // Strategy 2: Find comparisons with RELATED keywords (category-based)
  // Note: getRelatedKeywords returns already-normalized keywords
  const relatedKeywordsA = getRelatedKeywords(a, 10);
  const relatedKeywordsB = getRelatedKeywords(b, 10);
  const allRelatedKeywords = [...new Set([...relatedKeywordsA, ...relatedKeywordsB])];

  // Build patterns for related keywords (they're already normalized)
  const relatedPatterns = allRelatedKeywords.flatMap((kw) => [
    `${kw}-vs-`,
    `-vs-${kw}`,
  ]);

  // Combine all patterns
  const allPatterns = [...sameKeywordPatterns, ...relatedPatterns];

  // Build query - use OR logic: category match OR pattern match
  const whereClause: any = {
    slug: { not: slug },
  };

  // Build OR conditions: either category match OR pattern match
  const orConditions: any[] = [];

  // Add pattern matching conditions
  if (allPatterns.length > 0) {
    orConditions.push(...allPatterns.map((p) => ({ slug: { contains: p } })));
  }

  // Add category match condition (if we have a category)
  if (currentCategory && currentCategory !== 'general') {
    orConditions.push({ category: currentCategory });
  }

  // If we have OR conditions, use them; otherwise just exclude current slug
  if (orConditions.length > 0) {
    whereClause.OR = orConditions;
  }

  let rows: any[] = [];
  try {
    rows = await prisma.comparison.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: limit * 5, // Get more for better scoring
      select: {
        slug: true,
        timeframe: true,
        geo: true,
        category: true,
      },
    });
  } catch (error) {
    console.error('[RelatedComparisons] Database query error:', error);
    // Continue with empty rows to trigger fallback
    rows = [];
  }

  // If no results found, try a more relaxed query (any recent comparisons)
  if (rows.length === 0) {
    console.log(`[RelatedComparisons] No matches found for "${slug}", falling back to recent comparisons`);
    try {
      const fallbackRows = await prisma.comparison.findMany({
        where: {
          slug: { not: slug },
        },
        orderBy: { createdAt: "desc" },
        take: limit * 2,
        select: {
          slug: true,
          timeframe: true,
          geo: true,
          category: true,
        },
      });
      
      // Use fallback results
      const fallbackResults: RelatedComparison[] = [];
      for (const row of fallbackRows) {
        if (!row.slug) continue;
        const t = fromSlug(row.slug);
        if (t.length !== 2) continue;
        
        fallbackResults.push({
          slug: row.slug,
          terms: t,
          timeframe: row.timeframe ?? "12m",
          geo: row.geo ?? "",
        });
      }
      
      return fallbackResults.slice(0, limit);
    } catch (error) {
      console.error('[RelatedComparisons] Fallback query error:', error);
      return [];
    }
  }

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

  // Return top results, but ensure we have at least some results
  const topResults = scoredResults.slice(0, limit).map(r => r.comp);
  
  // If we have no scored results, return empty array (fallback already tried)
  if (topResults.length === 0) {
    console.log(`[RelatedComparisons] No valid results after scoring for "${slug}"`);
    return [];
  }
  
  return topResults;
}
