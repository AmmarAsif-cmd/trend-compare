// components/RelatedComparisonsSidebar.tsx
import Link from "next/link";
import { prisma } from "@/lib/db";
import { fromSlug } from "@/lib/slug";
import { unstable_cache } from "next/cache";

// Helper to slugify a single term
function slugifyTerm(term: string): string {
  return term.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

type Props = {
  currentSlug: string;
  category: string | null;
  terms: string[];
  limit?: number;
};

type RelatedComparison = {
  slug: string;
  terms: string[];
  timeframe: string;
  geo: string;
};

/**
 * Get related comparisons from the same category, prioritized by relevance
 */
async function getRelatedComparisonsByCategory(
  currentSlug: string,
  category: string | null,
  terms: string[],
  limit: number = 6
): Promise<RelatedComparison[]> {
  if (!category || category === 'general') {
    // If no specific category, find comparisons with similar keywords
    const [termA, termB] = terms;
    if (!termA || !termB) return [];

    // Slugify terms for pattern matching
    const slugA = slugifyTerm(termA);
    const slugB = slugifyTerm(termB);

    const patterns = [
      `${slugA}-vs-`,
      `-vs-${slugA}`,
      `${slugB}-vs-`,
      `-vs-${slugB}`,
    ];

    const rows = await prisma.comparison.findMany({
      where: {
        slug: { not: currentSlug },
        OR: patterns.map((p) => ({ slug: { contains: p } })),
      },
      orderBy: { createdAt: "desc" },
      take: limit * 2, // Get more to randomize
      select: {
        slug: true,
        timeframe: true,
        geo: true,
        category: true,
      },
    });

    const results: RelatedComparison[] = [];
    for (const row of rows) {
      if (!row.slug) continue;
      const t = fromSlug(row.slug);
      if (t.length !== 2) continue;

      results.push({
        slug: row.slug,
        terms: t,
        timeframe: row.timeframe ?? "12m",
        geo: row.geo ?? "",
      });
    }

    // Sort by relevance: exact keyword matches first, then partial matches
    const sorted = results.sort((a, b) => {
      const aTerms = a.terms.map(t => t.toLowerCase());
      const bTerms = b.terms.map(t => t.toLowerCase());
      const termALower = termA.toLowerCase();
      const termBLower = termB.toLowerCase();
      
      // Exact match gets highest priority
      const aExact = aTerms.includes(termALower) || aTerms.includes(termBLower) ? 1 : 0;
      const bExact = bTerms.includes(termALower) || bTerms.includes(termBLower) ? 1 : 0;
      
      if (aExact !== bExact) return bExact - aExact;
      
      // Partial match (contains keyword)
      const aPartial = aTerms.some(t => t.includes(termALower) || t.includes(termBLower)) ? 1 : 0;
      const bPartial = bTerms.some(t => t.includes(termALower) || t.includes(termBLower)) ? 1 : 0;
      
      if (aPartial !== bPartial) return bPartial - aPartial;
      
      return 0;
    });
    
    return sorted.slice(0, limit);
  }

  // Find comparisons with the same category
  const rows = await prisma.comparison.findMany({
    where: {
      slug: { not: currentSlug },
      category: category,
    },
    orderBy: { createdAt: "desc" },
    take: limit * 3, // Get more to randomize
    select: {
      slug: true,
      timeframe: true,
      geo: true,
      category: true,
    },
  });

  const results: RelatedComparison[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    if (!row.slug || seen.has(row.slug)) continue;
    seen.add(row.slug);

    const t = fromSlug(row.slug);
    if (t.length !== 2) continue;

    results.push({
      slug: row.slug,
      terms: t,
      timeframe: row.timeframe ?? "12m",
      geo: row.geo ?? "",
    });
  }

  // Sort by relevance: prioritize comparisons with similar terms
  const [termA, termB] = terms;
  const sorted = results.sort((a, b) => {
    const aTerms = a.terms.map(t => t.toLowerCase());
    const bTerms = b.terms.map(t => t.toLowerCase());
    const termALower = termA?.toLowerCase() || '';
    const termBLower = termB?.toLowerCase() || '';
    
    // Score based on keyword matches
    const scoreA = aTerms.reduce((score, term) => {
      if (term === termALower || term === termBLower) return score + 10;
      if (term.includes(termALower) || term.includes(termBLower)) return score + 5;
      if (termALower.includes(term) || termBLower.includes(term)) return score + 3;
      return score;
    }, 0);
    
    const scoreB = bTerms.reduce((score, term) => {
      if (term === termALower || term === termBLower) return score + 10;
      if (term.includes(termALower) || term.includes(termBLower)) return score + 5;
      if (termALower.includes(term) || termBLower.includes(term)) return score + 3;
      return score;
    }, 0);
    
    return scoreB - scoreA;
  });
  
  return sorted.slice(0, limit);
}

// Cache related comparisons for 1 hour
const getCachedRelatedComparisons = unstable_cache(
  async (currentSlug: string, category: string | null, terms: string[], limit: number) => {
    return getRelatedComparisonsByCategory(currentSlug, category, terms, limit);
  },
  ['related-comparisons-sidebar'],
  {
    revalidate: 3600, // Revalidate every hour
    tags: ['comparisons']
  }
);

export default async function RelatedComparisonsSidebar({ 
  currentSlug, 
  category, 
  terms,
  limit = 6 
}: Props) {
  const items: RelatedComparison[] = await getCachedRelatedComparisons(
    currentSlug,
    category,
    terms,
    limit
  );

  if (!items.length) {
    return (
      <section>
        <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-5 text-slate-900 flex items-center gap-2">
          <span className="w-1.5 h-5 sm:h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
          <span>Related Comparisons</span>
        </h2>
        <div className="text-sm text-slate-600">
          No related comparisons found yet.
        </div>
      </section>
    );
  }

  const prettySlug = (slug: string) => {
    return slug
      .replace(/-vs-/g, " vs ")
      .split(/[- ]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <section>
      <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-5 text-slate-900 flex items-center gap-2">
        <span className="w-1.5 h-5 sm:h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
        <span>Related Comparisons</span>
      </h2>
      <div className="space-y-2.5 sm:space-y-3">
        {items.map((it, idx) => (
          <Link
            key={it.slug}
            href={`/compare/${it.slug}`}
            className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition-all duration-200 p-3 sm:p-3.5"
          >
            {/* Icon/Indicator */}
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm sm:text-base text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                {prettySlug(it.slug)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {(it.timeframe || it.geo) && (
                  <div className="flex items-center gap-1.5">
                    {it.timeframe && (
                      <span className="text-xs text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                        {it.timeframe}
                      </span>
                    )}
                    {it.geo && (
                      <span className="text-xs text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                        {it.geo}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Arrow */}
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </section>
  );
}

