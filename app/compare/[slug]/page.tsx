import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { fromSlug, toCanonicalSlug } from "@/lib/slug";
import { getOrBuildComparison } from "@/lib/getOrBuild";
import TrendChart from "@/components/TrendChart";
import TimeframeSelect from "@/components/TimeframeSelect";
import { smoothSeries, nonZeroRatio } from "@/lib/series";
import BackButton from "@/components/BackButton";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { tf?: string; geo?: string };
}): Promise<Metadata> {
  const { slug } = await params;
  const { tf } = await searchParams;
  const terms = fromSlug(slug);
  const canonical = toCanonicalSlug(terms);
  if (!canonical) return { title: "Not available", robots: { index: false } };
  return {
    title: `${terms.join(" vs ")} — TrendArc`,
    description: `Compare ${terms.join(" vs ")} search interest${tf ? ` (${tf})` : ""} with clear charts and summaries.`,
    alternates: { canonical: `/compare/${canonical}` },
  };
}

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tf?: string; geo?: string; smooth?: string }>;
}) {
  const { slug } = await params;
  const { tf, geo, smooth } = await searchParams;
  if (!slug) return notFound();

  const terms = fromSlug(slug);
  const canonical = toCanonicalSlug(terms);
  if (!canonical) return notFound();
  if (canonical !== slug) {
    const q = new URLSearchParams();
    if (tf) q.set("tf", tf);
    if (geo) q.set("geo", geo);
    redirect(`/compare/${canonical}${q.toString() ? `?${q.toString()}` : ""}`);
  }

  const timeframe = tf ?? "12m";
  const region = geo ?? "";

  const row = await getOrBuildComparison({
    slug: canonical,
    terms,
    timeframe,
    geo: region,
  });
  if (!row) return notFound();

  const { series: rawSeries, stats, ai } = row;

  const smoothingWindow = smooth === "0" ? 1 : 4;
  const series = smoothSeries(rawSeries, smoothingWindow);
  const sparse = nonZeroRatio(rawSeries) < 0.1;

  if (!series?.length || series.length < 8) {
    return (
      <main className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{terms.join(" vs ")}</h1>
            <p className="text-slate-600">Not enough data. Try a longer timeframe or different terms.</p>
          </div>
          <TimeframeSelect />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <BackButton label="Back to Home" />
      {/* Top header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{terms.join(" vs ")}</h1>
          <p className="text-slate-600">
            {ai?.metaDescription ??
              `Compare ${terms.join(" and ")} search interest over ${timeframe}.`}
          </p>
          {sparse && (
            <p className="text-sm text-amber-700 mt-2">
              Interest spikes are sparse. Try a shorter timeframe (30d / 12m) for clearer detail.
            </p>
          )}
        </div>
        <TimeframeSelect />
      </div>

      {/* Chart card */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-4 sm:p-6">
          <TrendChart series={series} />
        </div>
      </section>

      {/* Summary + quick stats */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <h2 className="text-lg font-semibold mb-2">Summary</h2>
          {ai?.summary ? <p className="text-slate-700">{ai.summary}</p> : <p className="text-slate-700">Auto-generated summary coming soon.</p>}
          {ai?.verdict && (
            <p className="mt-3 font-medium">
              <strong>{ai.verdict}</strong>
            </p>
          )}
          {Array.isArray(ai?.insights) && ai.insights.length > 0 && (
            <ul className="mt-3 list-disc pl-5 text-slate-700">
              {ai.insights.map((i: string, idx: number) => (
                <li key={idx}>{i}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <h2 className="text-lg font-semibold mb-2">Quick stats</h2>
          <ul className="space-y-2 text-slate-700">
            <li><span className="font-medium">Timeframe:</span> {timeframe}</li>
            <li><span className="font-medium">Region:</span> {region || "Worldwide"}</li>
            {stats?.peaks?.length ? (
              <>
                <li className="mt-2 font-medium">Peaks</li>
                {stats.peaks.map((peak, i) => (
                  <li key={`${peak.term}-${i}`} className="text-sm">
                    {peak.term} peaked on {peak.date} at {peak.value}.
                  </li>
                ))}
              </>
            ) : null}
          </ul>
        </div>
      </section>
    </main>
  );
}
