// components/RelatedComparisons.tsx
import Link from "next/link";
import { getRelatedComparisons } from "@/lib/relatedComparisons";
import { Sparkles, ArrowRight } from "lucide-react";

function prettyTerm(t: string) {
  return t.replace(/-/g, " ");
}

export default async function RelatedComparisons({
  currentSlug,
  terms,
}: {
  currentSlug: string;
  terms: string[];
}) {
  if (!Array.isArray(terms) || terms.length !== 2) return null;

  const related = await getRelatedComparisons({
    slug: currentSlug,
    terms,
    limit: 8,
  });

  if (!related.length) return null;

  return (
    <section className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-white to-blue-50 shadow-xl p-6 sm:p-8 print:hidden">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-bold mb-3">
          <Sparkles className="w-4 h-4" />
          Explore More
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Related Comparisons
        </h2>
        <p className="text-sm sm:text-base text-slate-600">
          Discover insights about{" "}
          <span className="font-bold text-blue-600">{prettyTerm(terms[0])}</span> and{" "}
          <span className="font-bold text-purple-600">{prettyTerm(terms[1])}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {related.map((row, idx) => (
          <Link
            key={row.slug}
            href={`/compare/${row.slug}`}
            className="group relative rounded-xl border-2 border-purple-200 bg-white hover:border-purple-500 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 p-4 overflow-hidden"
          >
            {/* Animated gradient background on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Rank badge */}
            <div className="relative z-10 flex items-start justify-between mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                {idx + 1}
              </div>
              <ArrowRight className="w-4 h-4 text-purple-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all duration-200" />
            </div>

            {/* Content */}
            <div className="relative z-10 space-y-2">
              <div className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-purple-600 transition-colors leading-tight break-words">
                {prettyTerm(row.terms[0])}
              </div>
              <div className="flex items-center gap-2">
                <div className="h-0.5 flex-1 bg-gradient-to-r from-purple-300 to-blue-300 rounded-full"></div>
                <span className="text-xs text-slate-400 font-bold flex-shrink-0">VS</span>
                <div className="h-0.5 flex-1 bg-gradient-to-r from-blue-300 to-purple-300 rounded-full"></div>
              </div>
              <div className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors leading-tight break-words">
                {prettyTerm(row.terms[1])}
              </div>
            </div>

            {/* Shine effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-slate-500">
          💡 Click any comparison to dive deeper into the data
        </p>
      </div>
    </section>
  );
}
