// components/RelatedComparisons.tsx
import Link from "next/link";
import { getRelatedComparisons } from "@/lib/relatedComparisons";
import { TrendingUp, ArrowRight } from "lucide-react";

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
    <section className="rounded-xl sm:rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-lg p-6 sm:p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            You Might Also Like
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Similar comparisons featuring{" "}
            <span className="font-semibold text-blue-600">{prettyTerm(terms[0])}</span> or{" "}
            <span className="font-semibold text-purple-600">{prettyTerm(terms[1])}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {related.map((row, idx) => (
          <Link
            key={row.slug}
            href={`/compare/${row.slug}`}
            className="group relative rounded-xl border-2 border-slate-200 bg-white hover:border-purple-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-4 overflow-hidden"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {/* Gradient background on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                  {idx + 1}
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all duration-200" />
              </div>

              <div className="space-y-1">
                <div className="font-bold text-sm text-slate-900 group-hover:text-purple-600 transition-colors line-clamp-1">
                  {prettyTerm(row.terms[0])}
                </div>
                <div className="text-xs text-slate-400 font-medium">VS</div>
                <div className="font-bold text-sm text-slate-900 group-hover:text-purple-600 transition-colors line-clamp-1">
                  {prettyTerm(row.terms[1])}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-slate-500">
          Click any comparison to explore detailed trends and insights
        </p>
      </div>
    </section>
  );
}
