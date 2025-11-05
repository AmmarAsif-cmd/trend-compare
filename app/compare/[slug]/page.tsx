import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { fromSlug, toCanonicalSlug } from "@/lib/slug";
import { getOrBuildComparison } from "@/lib/getOrBuild";
import TrendChart from "@/components/TrendChart";
import TimeframeSelect from "@/components/TimeframeSelect";
import { smoothSeries, nonZeroRatio } from "@/lib/series";
import BackButton from "@/components/BackButton";
import FAQSection from "@/components/FAQSection";

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
  const terms = fromSlug(slug);
  const canonical = toCanonicalSlug(terms);
  if (!canonical) return { title: "Not available", robots: { index: false } };

  // Helper: remove dashes and make them look natural in titles/descriptions
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

/* -------- helper functions for humanized stats -------- */

function avg(nums: number[]) {
  const v = nums.filter((n) => Number.isFinite(n));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
}
function rollingAvg(nums: number[], window = 6) {
  const n = nums.slice(-window);
  return avg(n);
}
function earliestAvg(nums: number[], window = 6) {
  return avg(nums.slice(0, window));
}
function momentumPct(nums: number[]) {
  const early = earliestAvg(nums, 6);
  const late = rollingAvg(nums, 6);
  if (!early) return 0;
  return ((late - early) / early) * 100;
}
function peak(nums: number[], dates: string[]) {
  let max = -1, idx = -1;
  nums.forEach((n, i) => { if (n > max) { max = n; idx = i; } });
  return { value: Math.max(0, Math.round(max)), date: dates[idx] ?? "" };
}
function prettyTerm(t: string) {
  // show "open-ai" as "open ai" in UI without breaking slugs
  return t.replace(/-/g, " ");
}

type TableRow = {
  term: string;
  avg: number;
  latest: number;
  momentumPct: number;
  peakValue: number;
  peakDate: string;
};

function buildRows(series: any[], terms: string[]): TableRow[] {
  const dates = series.map((r) => String(r.date));
  return terms.map((t) => {
    const values = series.map((r) => Number(r[t] ?? 0));
    const { value: peakValue, date: peakDate } = peak(values, dates);
    return {
      term: prettyTerm(t),
      avg: avg(values),
      latest: values.at(-1) ?? 0,
      momentumPct: momentumPct(values),
      peakValue,
      peakDate,
    };
  });
}

function quickTake(rows: TableRow[]) {
  if (rows.length < 2) return { title: "Quick take", lines: [] as string[] };
  const [a, b] = rows;

  // Who led on average
  const leader = a.avg >= b.avg ? a : b;
  const runner = leader === a ? b : a;
  const leadPct = leader.avg
    ? Math.round(((leader.avg - runner.avg) / leader.avg) * 100)
    : 0;

  // Who looks stronger right now (latest point)
  const nowLeader = a.latest >= b.latest ? a.term : b.term;

  // Who’s trending up more (momentum)
  const momentumLeader = a.momentumPct >= b.momentumPct ? a.term : b.term;

  return {
    title: "What the data says at a glance",
    lines: [
      `${leader.term} has been ahead on average over this period — roughly ${Math.abs(leadPct)}% higher than ${runner.term}.`,
      `Right now, ${nowLeader} looks stronger based on the most recent data point.`,
      `${momentumLeader} shows better upward momentum when you compare the start vs the latest data.`,
    ],
  };
}

function pctText(x: number) {
  const n = Math.round(x);
  return `${n >= 0 ? "+" : ""}${n}%`;
}

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

  const terms = fromSlug(slug);
  const canonical = toCanonicalSlug(terms);
  if (!canonical) return notFound();

  // Keep tf & geo on canonical redirect
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

  // Build humanized rows and summary
  const rows = buildRows(series, terms);
  const summary = quickTake(rows);

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <BackButton label="Back to Home" />

      {/* Top header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {prettyTerm(terms[0])} vs {prettyTerm(terms[1])}
          </h1>
          <p className="text-slate-600">
            {ai?.metaDescription ??
              `Compare ${prettyTerm(terms[0])} and ${prettyTerm(terms[1])} over the past ${timeframe}.`}
          </p>
          {sparse && (
            <p className="text-sm text-amber-700 mt-2">
              Most interest comes in short spikes. Try a shorter timeframe (30 days / 12 months) for a clearer picture.
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

      {/* Human summary + Quick stats */}
      <section className="grid gap-4 md:grid-cols-3">
        {/* Humanized summary */}
        <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <h2 className="text-lg font-semibold mb-2">
            {summary.title}
          </h2>
          <ul className="list-disc pl-5 text-slate-700 space-y-1">
            {summary.lines.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>

          {/* Keep your AI content if available */}
          {ai?.summary && (
            <p className="mt-4 text-slate-700">
              {ai.summary}
            </p>
          )}
          {ai?.verdict && (
            <p className="mt-2 font-medium">
              <strong>{prettyTerm(ai.verdict)}</strong>
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

        {/* Friendly quick stats */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <h2 className="text-lg font-semibold mb-2">Quick stats</h2>
          <ul className="space-y-2 text-slate-700">
            <li>
              <span className="font-medium">Timeframe:</span> last {timeframe === "12m" ? "12 months" : timeframe}
            </li>
            <li>
              <span className="font-medium">Region:</span> {region || "Worldwide"}
            </li>

            <li className="mt-3 font-medium">Peaks</li>
            {(stats?.peaks ?? rows.map(r => ({ term: r.term, date: r.peakDate, value: r.peakValue }))).map((p: any, i: number) => (
              <li key={`${p.term}-${i}`} className="text-sm">
                {prettyTerm(p.term)} had its biggest week on <span className="tabular-nums">{p.date}</span> with a score of {p.value}.
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Comparison table (self-explanatory) */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
        <h2 className="text-lg font-semibold mb-3">Side-by-side comparison</h2>
        <p className="text-slate-600 mb-4">
          Scores are normalized from 0 to 100. Think of them as “how popular this term was on Google relative to its own best week.”
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="text-left px-4 py-3">Term</th>
                <th className="text-right px-4 py-3">Typical level (avg)</th>
                <th className="text-right px-4 py-3">Right now (latest)</th>
                <th className="text-right px-4 py-3">Trend since start</th>
                <th className="text-right px-4 py-3">Best week</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.term} className="text-slate-800">
                  <td className="px-4 py-3 font-medium">{r.term}</td>
                  <td className="px-4 py-3 text-right">{Math.round(r.avg)}</td>
                  <td className="px-4 py-3 text-right">{Math.round(r.latest)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={r.momentumPct >= 0 ? "text-emerald-600" : "text-rose-600"}>
                      {pctText(r.momentumPct)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.peakValue} on <span className="tabular-nums">{r.peakDate}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-slate-600 mt-4 text-sm">
          Tip: “Trend since start” compares the first few weeks with the most recent weeks.
          Positive = building interest; negative = cooling off.
        </p>
      </section>
      <FAQSection />
    </main>
  );
}
