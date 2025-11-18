import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { fromSlug, toCanonicalSlug } from "@/lib/slug";
import { getOrBuildComparison } from "@/lib/getOrBuild";
import TrendChart from "@/components/TrendChart";
import TimeframeSelect from "@/components/TimeframeSelect";
import { smoothSeries, nonZeroRatio } from "@/lib/series";
import BackButton from "@/components/BackButton";
import FAQSection from "@/components/FAQSection";
import { buildHumanCopy } from "@/lib/humanize";
import TopThisWeekServer from "@/components/TopThisWeekServer";
import { validateTopic } from "@/lib/validateTermsServer";
import RelatedComparisons from "@/components/RelatedComparisons";

/* ---------------- SEO ---------------- */

// small helper inside this file
function isValidTopic(
  r: ReturnType<typeof validateTopic>
): r is { ok: true; term: string } {
  return r.ok;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { tf?: string; geo?: string };
}): Promise<Metadata> {
  const { slug } = await params;
  const { tf } = await searchParams;

  const raw = fromSlug(slug);
  const checked = raw.map(validateTopic);

  const valid = checked.filter(isValidTopic);
if (valid.length !== checked.length) {
  return { title: "Not available", robots: { index: false } };
}

 const terms = valid.map(c => c.term);
const canonical = toCanonicalSlug(terms);
if (!canonical) return { title: "Not available", robots: { index: false } };

  const pretty = (t: string) => t.replace(/-/g, " ");
  const cleanTerms = terms.map(pretty);

  return {
    title: `${cleanTerms.join(" vs ")} | TrendArc`,
    description: `Compare ${cleanTerms.join(" vs ")} search interest${tf ? ` (${tf})` : ""} with clear charts and human-friendly summaries.`,
    alternates: { canonical: `/compare/${canonical}` },
  };
}

/* ---------------- page ---------------- */

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { tf?: string; geo?: string; smooth?: string };
}) {
  const { slug } = await params;
  const { tf, geo, smooth } = await searchParams;
  if (!slug) return notFound();

  // Validate the two terms on the server with relaxed, shared rules
const raw = fromSlug(slug);
const checked = raw.map(validateTopic);

const valid = checked.filter(isValidTopic);
if (valid.length !== checked.length) {
  console.warn("Blocked term(s):", checked.filter(c => !c.ok));
  return notFound();
}

const terms = valid.map(c => c.term);

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

  const { series: rawSeries, ai } = row;

  const smoothingWindow = smooth === "0" ? 1 : 4;
  const series = smoothSeries(rawSeries, smoothingWindow);
  const human = buildHumanCopy(terms, series, { timeframe });
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

  const pretty = (t: string) => t.replace(/-/g, " ");

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <BackButton label="Back to Home" />
<div className="grid gap-4 md:grid-cols-12 mt-4">
        {/* Main content */}
        <div className="md:col-span-9 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {pretty(terms[0])} vs {pretty(terms[1])}
          </h1>
          <p className="text-slate-600">
            {ai?.metaDescription ?? `Compare ${pretty(terms[0])} and ${pretty(terms[1])} over the past ${timeframe}.`}
          </p>
          {sparse && (
            <p className="text-sm text-amber-700 mt-2">
              Most interest comes in short spikes. Try a shorter timeframe for a clearer picture.
            </p>
          )}
        </div>
        <TimeframeSelect />
      </div>

      {/* Chart */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-4 sm:p-6">
          <TrendChart series={series} />
        </div>
      </section>

      {/* Summary + Quick stats */}
      <section className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-2">Summary</h2>
          <div className="space-y-3 text-slate-700">
            <p>{human.summary}</p>
            {human.extraBullets.length > 0 && (
              <ul className="list-disc pl-5 space-y-1">
                {human.extraBullets.map((line, i) => <li key={i}>{line}</li>)}
              </ul>
            )}
            {human.infoNote && <p className="text-sm text-amber-700">{human.infoNote}</p>}
            
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-2">At a glance</h2>
          <ul className="space-y-2 text-slate-700">
            {human.atAGlance.map((line, i) => <li key={i}>{line}</li>)}
          </ul>
        </div>
      </section>

      {/* Side by side */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-3">Side by side</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-2 text-left">Metric</th>
                <th className="p-2 text-left">{pretty(terms[0])}</th>
                <th className="p-2 text-left">{pretty(terms[1])}</th>
              </tr>
            </thead>
            <tbody>
              {human.table.rows.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2 text-slate-600">{r.label}</td>
                  <td className="p-2">{r.a}</td>
                  <td className="p-2">{r.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Deep dive */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-2">Deep dive</h2>
        <div className="space-y-3 text-slate-700">
          {human.longForm.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </section>

      {/* Scale explainer */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-2">What this means</h2>
        <p className="text-slate-700">{human.scaleExplainer}</p>
      </section>
</div>
      {/* Trending this week */}
      <aside className="md:col-span-3 space-y-6">
          <div className="md:sticky md:top-20 space-y-3">
            
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <TopThisWeekServer />
            </section>
            </div>
</aside>
</div>
   {/* Related comparisons */}
      <RelatedComparisons currentSlug={canonical} terms={terms} />
      <FAQSection />
    </main>
  );
}
