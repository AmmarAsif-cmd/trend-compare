import { fromSlug, toCanonicalSlug } from "@/lib/slug";
import { fetchSeries } from "@/lib/trends";
import { computeStats } from "@/lib/stats";
import { generateCopy } from "@/lib/ai";
import TrendChart from "@/components/TrendChart";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

// Revalidate weekly
export const revalidate = 60 * 60 * 24 * 7;

// 👇 params is a Promise in Next 15 – await it here
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const terms = fromSlug(slug);
  const canonical = toCanonicalSlug(terms);
  if (!canonical) return { title: "Not available", robots: { index: false } };
  return {
    title: `${terms.join(" vs ")} — Compare Popularity`,
    description: `See ${terms.join(" vs ")} trend comparison with a simple popularity chart and summary.`,
    alternates: { canonical: `/compare/${canonical}` },
  };
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // 👇 unwrap the promise
  const { slug } = await params;

  if (!slug) return notFound();

  const terms = fromSlug(slug);
  const canonical = toCanonicalSlug(terms);
  if (!canonical) return notFound();
  if (canonical !== slug) redirect(`/compare/${canonical}`);

  const series = await fetchSeries(terms);
  if (!series?.length || series.length < 8) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-xl font-semibold">Insufficient data</h1>
        <p>Try different keywords.</p>
      </main>
    );
  }

  const stats = computeStats(series, terms);
  const ai = generateCopy(terms, stats);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{ai.title}</h1>
        <p className="text-gray-600">{ai.metaDescription}</p>
      </header>

      <section className="bg-white border p-4 rounded h-[360px]">
        <TrendChart series={series} />
      </section>

      <section className="space-y-2">
        <p>{ai.summary}</p>
        <p><strong>{ai.verdict}</strong></p>
        <ul className="list-disc pl-5">
          {ai.insights.map((i, idx) => <li key={idx}>{i}</li>)}
        </ul>
      </section>
    </main>
  );
}
