// components/RelatedComparisons.tsx
import Link from "next/link";
import { getRelatedComparisons } from "@/lib/relatedComparisons";
import { Sparkles, ArrowRight, TrendingUp, BarChart3 } from "lucide-react";

function prettyTerm(t: string) {
  return t.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export default async function RelatedComparisons({
  currentSlug,
  terms,
  category,
}: {
  currentSlug: string;
  terms: string[];
  category?: string | null;
}) {
  if (!Array.isArray(terms) || terms.length !== 2) {
    console.warn('[RelatedComparisons] Invalid terms:', terms);
    return null;
  }

  let related: any[] = [];
  try {
    related = await getRelatedComparisons({
      slug: currentSlug,
      terms,
      limit: 8,
      category,
    });
    console.log(`[RelatedComparisons] Found ${related.length} related comparisons for "${currentSlug}"`);
  } catch (error) {
    console.error('[RelatedComparisons] Error fetching related comparisons:', error);
    // Don't return null on error, try to show something
  }

  if (!related.length) {
    console.log(`[RelatedComparisons] No related comparisons found for "${currentSlug}"`);
    return null;
  }

  return (
    <section className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-white to-blue-50 shadow-xl p-5 sm:p-6 print:hidden">
      {/* Enhanced Header */}
      <div className="text-center mb-5 sm:mb-6">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white px-5 py-2 rounded-full text-sm font-bold mb-4 shadow-lg">
          <Sparkles className="w-4 h-4" />
          <span>Explore Related Comparisons</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Related Comparisons
        </h2>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
          Discover how{" "}
          <span className="font-bold text-blue-600 px-2 py-0.5 bg-blue-50 rounded">{prettyTerm(terms[0])}</span> and{" "}
          <span className="font-bold text-purple-600 px-2 py-0.5 bg-purple-50 rounded">{prettyTerm(terms[1])}</span> compare with similar topics
        </p>
      </div>

      {/* Enhanced Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {related.map((row, idx) => (
          <Link
            key={row.slug}
            href={`/compare/${row.slug}`}
            className="group relative rounded-xl border-2 border-purple-200 bg-white hover:border-purple-500 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 p-5 overflow-hidden"
          >
            {/* Enhanced gradient background on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Enhanced rank badge with icon */}
            <div className="relative z-10 flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-lg group-hover:scale-110 transition-transform">
                  {idx + 1}
                </div>
                <div className="p-1.5 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <BarChart3 className="w-3 h-3 text-purple-600" />
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-purple-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all duration-200" />
            </div>

            {/* Enhanced content */}
            <div className="relative z-10 space-y-3">
              <div className="font-bold text-sm text-slate-900 group-hover:text-purple-600 transition-colors leading-tight break-words line-clamp-2">
                {prettyTerm(row.terms[0])}
              </div>
              <div className="flex items-center gap-2">
                <div className="h-0.5 flex-1 bg-gradient-to-r from-purple-300 to-blue-300 rounded-full"></div>
                <span className="text-xs text-slate-500 font-bold flex-shrink-0 px-2 py-0.5 bg-slate-100 rounded-full">VS</span>
                <div className="h-0.5 flex-1 bg-gradient-to-r from-blue-300 to-purple-300 rounded-full"></div>
              </div>
              <div className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors leading-tight break-words line-clamp-2">
                {prettyTerm(row.terms[1])}
              </div>
            </div>

            {/* Enhanced shine effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
            </div>

            {/* Bottom accent bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </Link>
        ))}
      </div>

      {/* Enhanced footer */}
      <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-purple-200">
        <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
          <TrendingUp className="w-4 h-4 text-purple-600" />
          <p>
            <span className="font-semibold text-slate-900">💡 Tip:</span> Click any comparison card to explore detailed analytics, forecasts, and insights
          </p>
        </div>
      </div>
    </section>
  );
}
