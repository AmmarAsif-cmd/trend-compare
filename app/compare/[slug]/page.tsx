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
import CompareStats from "@/components/CompareStats";
/* ---------------- helpers ---------------- */

type TrendPoint = {
  date: string | number | Date;
  [key: string]: unknown;
};

type TermInsight = {
  term: string;
  avg: number;
  trendWord: string;
  stabilityWord: string;
  peakLabel: string;
  bestMonthLabel: string;
};

type InsightBundle = {
  headline: string;
  subline: string;
  badges: string[];
  prediction: string;
  moments: string[];
  termInsights: TermInsight[];
};

function prettyTerm(t: string) {
  return t.replace(/-/g, " ");
}

function toDate(d: string | number | Date): Date | null {
  const dt =
    typeof d === "number"
      ? new Date(d * 1000)
      : d instanceof Date
      ? d
      : new Date(String(d));
  return isNaN(dt.getTime()) ? null : dt;
}

function monthYearLabel(d: Date | null) {
  if (!d) return "no clear month";
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function shortDateLabel(d: Date | null) {
  if (!d) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function avg(nums: number[]) {
  const v = nums.filter((n) => Number.isFinite(n));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
}

function stdev(xs: number[]) {
  if (xs.length < 2) return 0;
  const m = avg(xs);
  const v = xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(v);
}

function slope(xs: number[]) {
  const n = xs.length;
  if (n < 2) return 0;
  const xbar = (n - 1) / 2;
  const ybar = avg(xs);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xbar) * (xs[i] - ybar);
    den += (i - xbar) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

function trendWord(m: number) {
  if (m > 0.6) return "rising fast";
  if (m > 0.2) return "rising";
  if (m < -0.6) return "falling fast";
  if (m < -0.2) return "falling";
  return "steady";
}

function volatilityWord(std: number) {
  if (std >= 20) return "very choppy";
  if (std >= 10) return "choppy";
  return "steady";
}

function peakFor(term: string, series: TrendPoint[]) {
  let bestValue = -1;
  let bestDate: Date | null = null;
  for (const row of series) {
    const v = Number(row[term] ?? 0);
    if (v > bestValue) {
      bestValue = v;
      bestDate = toDate(row.date);
    }
  }
  return { value: bestValue < 0 ? 0 : Math.round(bestValue), date: bestDate };
}

function monthlyBest(term: string, series: TrendPoint[]) {
  const buckets = new Map<string, number[]>();
  for (const r of series) {
    const d = toDate(r.date);
    if (!d) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0",
    )}`;
    const v = Number(r[term] ?? 0);
    const arr = buckets.get(key) ?? [];
    arr.push(v);
    buckets.set(key, arr);
  }
  const rows = Array.from(buckets.entries()).map(([key, arr]) => ({
    key,
    avg: avg(arr),
  }));
  if (!rows.length) return "not clear";
  rows.sort((a, b) => (a.key < b.key ? -1 : 1));
  const best = rows.reduce((p, c) => (c.avg > p.avg ? c : p), rows[0]);
  const [y, m] = best.key.split("-");
  return monthYearLabel(new Date(Number(y), Number(m) - 1, 1));
}

function crossovers(aVals: number[], bVals: number[], dates: TrendPoint[]) {
  let count = 0;
  let last: Date | null = null;
  for (let i = 1; i < Math.min(aVals.length, bVals.length); i++) {
    const prev = aVals[i - 1] - bVals[i - 1];
    const curr = aVals[i] - bVals[i];
    if ((prev <= 0 && curr > 0) || (prev >= 0 && curr < 0)) {
      count++;
      last = toDate(dates[i]?.date);
    }
  }
  return { count, last };
}

function buildInsightBundle(
  series: TrendPoint[],
  terms: string[],
  timeframe: string,
): InsightBundle {
  const [A, B] = terms;
  const aVals = series.map((r) => Number(r[A] ?? 0));
  const bVals = series.map((r) => Number(r[B] ?? 0));

  const aAvg = Math.round(avg(aVals));
  const bAvg = Math.round(avg(bVals));

  const leader = aAvg >= bAvg ? A : B;
  const trailer = leader === A ? B : A;
  const leaderAvg = leader === A ? aAvg : bAvg;
  const trailerAvg = leader === A ? bAvg : aAvg;
  const gapPct = leaderAvg
    ? Math.round(((leaderAvg - trailerAvg) / leaderAvg) * 100)
    : 0;

  const aSlope = slope(aVals);
  const bSlope = slope(bVals);
  const aStd = stdev(aVals);
  const bStd = stdev(bVals);

  const aTrend = trendWord(aSlope);
  const bTrend = trendWord(bSlope);
  const aVol = volatilityWord(aStd);
  const bVol = volatilityWord(bStd);

  const pkA = peakFor(A, series);
  const pkB = peakFor(B, series);
  const xo = crossovers(aVals, bVals, series);

  const cleanTf =
    timeframe === "12m"
      ? "past 12 months"
      : timeframe === "30d"
      ? "past 30 days"
      : timeframe === "5y"
      ? "past 5 years"
      : "chosen period";

  // Headline
  let headline: string;
  if (Math.abs(gapPct) <= 10) {
    headline = `${prettyTerm(A)} and ${prettyTerm(
      B,
    )} are very close in search interest right now.`;
  } else if (gapPct < 30) {
    headline = `${prettyTerm(
      leader,
    )} has a slight lead over ${prettyTerm(trailer)} at the moment.`;
  } else {
    headline = `${prettyTerm(
      leader,
    )} has a clear lead over ${prettyTerm(trailer)} right now.`;
  }

  const subline = `Over the ${cleanTf}, ${prettyTerm(
    leader,
  )} has averaged about ${leaderAvg} on the Google Trends scale, while ${prettyTerm(
    trailer,
  )} sits around ${trailerAvg}.`;

   // Badges
  const badges: string[] = [];

  if (Math.abs(gapPct) <= 10) badges.push("Close race");
  else if (gapPct < 30) badges.push("Moderate lead");
  else badges.push("Strong lead");

  // use numeric volatility (std dev), not the text labels
  if (aStd <= 10 && bStd <= 10) {
    badges.push("Stable interest");
  } else if (aStd >= 20 || bStd >= 20) {
    badges.push("Quite spiky");
  }

  if (aSlope > 0.2 || bSlope > 0.2) badges.push("Interest growing");
  if (aSlope < -0.2 || bSlope < -0.2) badges.push("Softening demand");

  if (xo.count > 0) badges.push("Lead changes over time");

  // Prediction hint (very soft)
  let prediction: string;
  if (Math.abs(gapPct) <= 10 && Math.abs(aSlope - bSlope) < 0.1) {
    prediction =
      "Right now this looks like a balanced matchup. Unless something big happens, neither term is likely to run away in the near term.";
  } else if (leader === A && aSlope > 0.2 && bSlope <= 0) {
    prediction = `${prettyTerm(
      A,
    )} already leads and is trending up, while ${prettyTerm(
      B,
    )} is flat or softening. If that continues, ${prettyTerm(
      A,
    )} should stay comfortably ahead.`;
  } else if (leader === B && bSlope > 0.2 && aSlope <= 0) {
    prediction = `${prettyTerm(
      B,
    )} already leads and is trending up, while ${prettyTerm(
      A,
    )} is flat or softening. If that continues, ${prettyTerm(
      B,
    )} should stay comfortably ahead.`;
  } else if (leader === A && aSlope < 0 && bSlope > 0.2) {
    prediction = `${prettyTerm(
      A,
    )} is ahead right now, but ${prettyTerm(
      B,
    )} is the one trending up. Over time the gap could narrow if that pattern holds.`;
  } else if (leader === B && bSlope < 0 && aSlope > 0.2) {
    prediction = `${prettyTerm(
      B,
    )} is ahead right now, but ${prettyTerm(
      A,
    )} is the one trending up. Over time the gap could narrow if that pattern holds.`;
  } else {
    prediction =
      "The chart does not point to a dramatic shift either way. Think of this as a snapshot of current interest rather than a strong forecast.";
  }

  // Moments
  const moments: string[] = [];
  if (pkA.value) {
    moments.push(
      `${prettyTerm(A)} peaked around ${monthYearLabel(
        pkA.date,
      )} at a score of ${pkA.value}.`,
    );
  }
  if (pkB.value) {
    moments.push(
      `${prettyTerm(B)} peaked around ${monthYearLabel(
        pkB.date,
      )} at a score of ${pkB.value}.`,
    );
  }
  if (xo.count > 0) {
    moments.push(
      `The lines crossed ${xo.count} time${xo.count === 1 ? "" : "s"}, most recently on ${shortDateLabel(
        xo.last,
      )}.`,
    );
  } else {
    moments.push(
      `There is no clear crossover. One term has held the lead through most of the period.`,
    );
  }

  // Per-term insight cards
  const makeTermInsight = (term: string, vals: number[]): TermInsight => {
    const pk = term === A ? pkA : pkB;
    const std = stdev(vals);
    const sl = slope(vals);
    const bestMonth = monthlyBest(term, series);
    return {
      term: prettyTerm(term),
      avg: Math.round(avg(vals)),
      trendWord: trendWord(sl),
      stabilityWord: volatilityWord(std),
      peakLabel: pk.value
        ? `${monthYearLabel(pk.date)} (score ${pk.value})`
        : "no obvious peak",
      bestMonthLabel: bestMonth,
    };
  };

  const termInsights: TermInsight[] = [
    makeTermInsight(A, aVals),
    makeTermInsight(B, bVals),
  ];

  return { headline, subline, badges, prediction, moments, termInsights };
}

/* ---------------- SEO helpers ---------------- */

// small helper inside this file
function isValidTopic(
  r: ReturnType<typeof validateTopic>,
): r is { ok: true; term: string } {
  return r.ok;
}

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
  const checked = raw.map(validateTopic);
  const valid = checked.filter(isValidTopic);
  if (valid.length !== checked.length) {
    return { title: "Not available", robots: { index: false } };
  }

  const terms = valid.map((c) => c.term);
  const canonical = toCanonicalSlug(terms);
  if (!canonical) return { title: "Not available", robots: { index: false } };

  const pretty = (t: string) => t.replace(/-/g, " ");
  const cleanTerms = terms.map(pretty);

  return {
    title: `${cleanTerms.join(" vs ")} | TrendArc`,
    description: `Compare ${cleanTerms.join(
      " vs ",
    )} search interest${tf ? ` (${tf})` : ""} with clear charts and human-friendly summaries.`,
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

  const raw = fromSlug(slug);
  const checked = raw.map(validateTopic);
  const valid = checked.filter(isValidTopic);
  if (valid.length !== checked.length) {
    console.warn("Blocked term(s):", checked.filter((c) => !c.ok));
    return notFound();
  }

  const terms = valid.map((c) => c.term);

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
  const series = smoothSeries(rawSeries as any[], smoothingWindow);
  const human = buildHumanCopy(terms, series as any, { timeframe });
  const sparse = nonZeroRatio(rawSeries as any[]) < 0.1;

  if (!series?.length || series.length < 8) {
    return (
      <main className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {terms.map(prettyTerm).join(" vs ")}
            </h1>
            <p className="text-slate-600">
              Not enough data. Try a longer timeframe or different terms.
            </p>
          </div>
          <TimeframeSelect />
        </div>
      </main>
    );
  }

  const insight = buildInsightBundle(series as any, terms, timeframe);
// compute totals and shares for stats
  const keyA = terms[0];
  const keyB = terms[1];

  const aVals = (series as any[]).map((row) => Number(row[keyA] ?? 0));
  const bVals = (series as any[]).map((row) => Number(row[keyB] ?? 0));

  const totalA = aVals.reduce((sum, v) => sum + v, 0);
  const totalB = bVals.reduce((sum, v) => sum + v, 0);
  const totalSearches = totalA + totalB;

  let aShare = 0;
  let bShare = 0;
  if (totalSearches > 0) {
    aShare = totalA / totalSearches;
    bShare = totalB / totalSearches;
  }
  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <BackButton label="Back to Home" />

      <div className="grid gap-4 md:grid-cols-12 mt-4">
        {/* Main content */}
        <div className="md:col-span-9 space-y-6">
          {/* Header + insight */}
          <header className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                  {prettyTerm(terms[0])} vs {prettyTerm(terms[1])}
                </h1>
                <p className="mt-1 text-slate-600">
                  {ai?.metaDescription ??
                    `Compare ${prettyTerm(terms[0])} and ${prettyTerm(
                      terms[1],
                    )} over the past year with a simple trend chart.`}
                </p>
                {region && (
                  <p className="mt-1 text-xs text-slate-500">
                    Region: <span className="font-medium">{region}</span>
                  </p>
                )}
                {sparse && (
                  <p className="mt-2 text-sm text-amber-700">
                    Most interest comes in short spikes. Try a shorter
                    timeframe for a clearer picture.
                  </p>
                )}
              </div>
              <TimeframeSelect />
            </div>

            <section className="grid gap-4 md:grid-cols-5">
              {/* Headline insight */}
              <div className="md:col-span-3 rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
                <p className="text-xs font-semibold tracking-wide text-slate-500 mb-1">
                  HEADLINE INSIGHT
                </p>
                <p className="font-semibold text-slate-900 mb-2">
                  {insight.headline}
                </p>
                <p className="text-sm text-slate-700">{insight.subline}</p>
              </div>

              {/* Quick context */}
              <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
                <p className="text-xs font-semibold tracking-wide text-slate-500 mb-2">
                  QUICK CONTEXT
                </p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {insight.badges.map((b) => (
                    <span
                      key={b}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-700"
                    >
                      {b}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-600">
                  {insight.moments[0] ?? ""}
                </p>
              </div>
            </section>
          </header>

          {/* Chart */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="p-4 sm:p-6">
              <TrendChart series={series} />
            </div>
          </section>
<CompareStats
    totalSearches={totalSearches}        // replace with your real total value
    aLabel={keyA }               // first keyword label
    bLabel={keyB }                // second keyword label
    aShare={aShare }                    // 62 means 62 percent
    bShare={bShare }
  />
          {/* Per-term insight cards */}
          <section className="grid gap-4 md:grid-cols-2">
            {insight.termInsights.map((ti) => (
              <div
                key={ti.term}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5"
              >
                <h2 className="text-sm font-semibold text-slate-900 mb-1">
                  {ti.term} insight
                </h2>
                <p className="text-xs text-slate-500 mb-3">
                  Based on the same timeframe as the chart.
                </p>
                <ul className="space-y-1.5 text-sm text-slate-700">
                  <li>
                    <span className="font-medium">Average level:</span>{" "}
                    {ti.avg}
                  </li>
                  <li>
                    <span className="font-medium">Trend:</span> {ti.trendWord}
                  </li>
                  <li>
                    <span className="font-medium">Stability:</span>{" "}
                    {ti.stabilityWord}
                  </li>
                  <li>
                    <span className="font-medium">Sharpest peak:</span>{" "}
                    {ti.peakLabel}
                  </li>
                  <li>
                    <span className="font-medium">Best month by average:</span>{" "}
                    {ti.bestMonthLabel}
                  </li>
                </ul>
              </div>
            ))}
          </section>

          {/* Trend moments + prediction */}
          <section className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
              <h2 className="text-lg font-semibold mb-2">Trend moments</h2>
              <ul className="space-y-1.5 text-sm text-slate-700">
                {insight.moments.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
              <h2 className="text-lg font-semibold mb-2">What might happen next</h2>
              <p className="text-sm text-slate-700">{insight.prediction}</p>
            </div>
          </section>

          {/* Summary + At a glance */}
          <section className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-2">Full summary</h2>
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
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-2">At a glance</h2>
              <ul className="space-y-2 text-slate-700">
                {human.atAGlance.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
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
                    <th className="p-2 text-left">{prettyTerm(terms[0])}</th>
                    <th className="p-2 text-left">{prettyTerm(terms[1])}</th>
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
              {human.longForm.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>

          {/* Scale explainer */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-2">What this scale means</h2>
            <p className="text-slate-700">{human.scaleExplainer}</p>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="md:col-span-3 space-y-6">
          <div className="md:sticky md:top-20 space-y-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <TopThisWeekServer />
            </section>
          </div>
        </aside>
      </div>

      {/* Related comparisons + FAQ */}
      <RelatedComparisons currentSlug={canonical} terms={terms} />
      <FAQSection />
    </main>
  );
}
