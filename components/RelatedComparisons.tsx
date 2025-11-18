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
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-2">Related comparisons</h2>
      <p className="text-sm text-slate-600 mb-3">
        Other matchups people have checked that include{" "}
        <span className="font-medium">{prettyTerm(terms[0])}</span> or{" "}
        <span className="font-medium">{prettyTerm(terms[1])}</span>.
      </p>

      <div className="flex flex-wrap gap-2">
        {related.map((row) => (
          <Link
            key={row.slug}
            href={`/compare/${row.slug}`}
            className="text-sm rounded-full border border-slate-200 bg-slate-50 px-3 py-1 hover:bg-slate-100 hover:border-slate-300"
          >
            {prettyTerm(row.terms[0])} vs {prettyTerm(row.terms[1])}
          </Link>
        ))}
      </div>
    </section>
  );
}
