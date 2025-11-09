import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { fromSlug, toCanonicalSlug } from "@/lib/slug";
import { getOrBuildComparison } from "@/lib/getOrBuild";
import TrendChart from "@/components/TrendChart";
import TimeframeSelect from "@/components/TimeframeSelect";
import { smoothSeries, nonZeroRatio } from "@/lib/series";
import BackButton from "@/components/BackButton";
import FAQSection from "@/components/FAQSection";
import { cleanTerm, isTermAllowed } from "@/lib/validateTerms";
import { deepValidateTerm } from "@/lib/validateTermsServer";
import { buildHumanCopy } from "@/lib/humanize";
import TopThisWeekServer from "@/components/TopThisWeekServer";

/* ---------------- SEO ---------------- */

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
  const humanTerms = raw.map(cleanTerm);
  if (humanTerms.some((t) => !isTermAllowed(t))) return notFound();

  const terms = humanTerms;
  const canonical = toCanonicalSlug(terms);
  if (!canonical) return { title: "Not available", robots: { index: false } };

  const pretty = (t: string) => t.replace(/-/g, " ");
  const cleanTerms = terms.map(pretty);

  return {
    title: `${cleanTerms.join(" vs ")} — TrendArc`,
    description: `Compare ${cleanTerms.join(
      " vs "
    )} search interest${tf ? ` (${tf})` : ""} with clear charts and human-friendly summaries.`,
    alternates: { canonical: `/compare/${canonical}` },
  };
}

/* -------- small helpers for local UI text -------- */

function prettyTerm(t: string) {
  return t.replace(/-/g, " ");
}
// function suggestionToHref(
//   label: string,
//   fallbackA: string,
//   fallbackB: string
// ): string {
//   const m = label.match(/^(.+?)\s+vs\s+(.+)$/i);
//   if (m) {
//     const strip = (s: string) =>
//       s.replace(/\b(meanings?|definition|definitions|alternative|alternatives)\b/i, "").trim();
//     const a = strip(m[1]);
//     const b = strip(m[2]);
//     try {
//       const slug = toCanonicalSlug([a, b]);
//       if (slug) return `/compare/${slug}`;
//     } catch {
//       /* fall through to prefill */
//     }
//   }
//   // Prefill the home form if it wasn't a clean "A vs B"
//   const qp = new URLSearchParams({
//     a: fallbackA,
//     b: fallbackB,
//   }).toString();
//   return `/?${qp}`;
// }
/* -------------------- page -------------------- */

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

  // Convert slug to raw search terms
  const raw = fromSlug(slug);

  // Deep validation — server-only protection
  const checked = raw.map(deepValidateTerm);
  if (checked.some((c) => !c.ok)) {
    console.warn("Blocked term(s):", checked.filter((c) => !c.ok));
    return notFound();
  }

  // Safe, cleaned terms
  const terms = checked.map((c) => c.term!);

  // Canonicalize URL
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

  const { series: rawSeries } = row;

  const smoothingWindow = smooth === "0" ? 1 : 4;
  const series = smoothSeries(rawSeries, smoothingWindow);
  const sparse = nonZeroRatio(rawSeries) < 0.1;

  if (!series?.length || series.length < 8) {
    return (
      <main className="mx-auto max-w-5xl space-y-6">
        <BackButton label="Back to Home" />
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">
            {prettyTerm(terms[0])} vs {prettyTerm(terms[1])}
          </h1>
          <p className="mt-1 text-slate-600">
            Not enough data. Try a longer timeframe or different terms.
          </p>
          <div className="mt-4">
            <TimeframeSelect />
          </div>
        </div>
      </main>
    );
  }

  // Human write-up (summary, bullets, table, long form)
  const human = buildHumanCopy(terms, series, { timeframe });

  return (
    <main className="mx-auto max-w-6xl">
      <BackButton label="Back to Home" />

      {/* Page grid: main + sticky sidebar */}
      <div className="grid gap-4 md:grid-cols-12 mt-4">
        {/* Main content */}
        <div className="md:col-span-9 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between ">
            <div className="pr-4 sm:col-span-12">
              <h1 className="text-3xl font-semibold tracking-tight">
                {prettyTerm(terms[0])} vs {prettyTerm(terms[1])}
              </h1>
              <p className="mt-1 max-w-prose text-slate-600">
                Compare {prettyTerm(terms[0])} and {prettyTerm(terms[1])} over the past{" "}
                {timeframe === "12m" ? "12 months" : timeframe}. Scores range from 0 to
                100 and reflect relative interest for each term in the selected period.
              </p>
              {sparse && (
                <p className="mt-2 text-sm text-amber-700">
                  Interest looks spiky. Try a shorter timeframe like 30 days or 12 months
                  for clearer detail.
                </p>
              )}
            </div>
            <div className="shrink-0 sm:col-span-12">
              <TimeframeSelect />
            </div>
          </div>

          {/* Chart */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="p-4 sm:p-6">
              <TrendChart series={series} />
            </div>
          </section>

          {/* Summary and At a glance */}
          <section className="grid gap-6 md:grid-cols-2">
            {/* Summary card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-2">Summary</h2>
              <div className="space-y-3 text-slate-700">
                <p>{human.summary}</p>

                {human.extraBullets.length > 0 && (
                  <ul className="list-disc pl-5 space-y-1">
                    {human.extraBullets.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                )}

                {human.infoNote && (
                  <p className="text-sm text-amber-700">{human.infoNote}</p>
                )}

                {!!human.suggestions.length && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {human.suggestions.map((s) => (
                      <a
                        key={s}
                        href={`/?q=${encodeURIComponent(
                          s.replace(/\s+vs\s+/i, " ")
                        )}`}
                        className="text-xs rounded-full bg-slate-100 px-3 py-1 hover:bg-slate-200"
                      >
                        {s}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* At a glance */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-2">At a glance</h2>
              <ul className="space-y-2 text-slate-700">
                {human.atAGlance.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* Five-year highlights (only when 5y/all) */}
          {(timeframe === "5y" || timeframe === "all") && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-2">Five year highlights</h2>
              <div className="space-y-2 text-slate-700">
                {human.longForm
                  .filter((p) =>
                    /Year by year|yearly average winner|tends to be highest|Over the long run/.test(
                      p
                    )
                  )
                  .map((p, i) => (
                    <p key={`five-${i}`}>{p}</p>
                  ))}
              </div>
            </section>
          )}

          {/* Side by side table */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-3">Side by side</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-2 text-left">Metric</th>
                    <th className="p-2 text-left">{prettyTerm(terms[0])}</th>
                    <th className="p-2 text-left">{prettyTerm(terms[1])}</th>
                  </tr>
                </thead>
                <tbody>
                  {human.table.rows.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 text-slate-600 text-left">{r.label}</td>
                      <td className="p-2">{r.a}</td>
                      <td className="p-2">{r.b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Deep dive narrative */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-2">Deep dive</h2>
            <div className="space-y-3 text-slate-700">
              {human.longForm.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>

          {/* Scale explainer */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-2">What this means</h2>
            <p className="text-slate-700">{human.scaleExplainer}</p>
          </section>

          {/* FAQ */}
          <FAQSection />
        </div>

        {/* Sticky Sidebar */}
        <aside className="md:col-span-3 space-y-6">
          <div className="md:sticky md:top-20 space-y-3">
            
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <TopThisWeekServer />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-md font-semibold mb-4">
                Try these
              </h2>
              <ul className="grid sm:grid-cols-1 gap-2">
                <li className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <a className="hover:underline" href="/compare/usa-vs-china">
                    Usa vs China
                  </a>
                </li>
                <li className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">

                  <a className="hover:underline" href="/compare/spotify-vs-youtube-music">
                    spotify vs youtube music
                  </a>
                </li>
                <li className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">

                  <a className="hover:underline" href="/compare/angular-vs-react">
                    Angular vs React
                  </a>
                </li>
              </ul>
            </section>
          </div>
        </aside>
      </div>
    </main>
  );
}
