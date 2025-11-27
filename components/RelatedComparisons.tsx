// components/RelatedComparisons.tsx
import Link from "next/link";
import { getRelatedComparisons } from "@/lib/relatedComparisons";

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
    limit: 6,
  });

  if (!related.length) return null;

  return (
    <section className="rounded-xl sm:rounded-2xl border-2 border-slate-200 bg-white shadow-md p-5 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
        🔗 Related Comparisons
      </h2>
      <p className="text-sm sm:text-base text-slate-600 mb-5 leading-relaxed">
        Explore similar matchups featuring{" "}
        <span className="font-semibold text-blue-600">{prettyTerm(terms[0])}</span> or{" "}
        <span className="font-semibold text-purple-600">{prettyTerm(terms[1])}</span>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {related.map((row, idx) => (
          <Link
            key={row.slug}
            href={`/compare/${row.slug}`}
            className="group flex items-center justify-between rounded-lg border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white px-4 py-3 text-sm font-medium text-slate-700 transition-all duration-300 hover:border-blue-400 hover:shadow-lg hover:scale-105 hover:-translate-y-0.5 animate-fadeIn"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <span className="group-hover:text-blue-600 transition-colors duration-200">
              {prettyTerm(row.terms[0])} <span className="text-slate-400">vs</span> {prettyTerm(row.terms[1])}
            </span>
            <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </section>
  );
}
