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
    )} are basically tied — people search for both at nearly the same rate.`;
  } else if (gapPct < 30) {
    headline = `${prettyTerm(
      leader,
    )} gets more searches than ${prettyTerm(trailer)}, but it's not a blowout.`;
  } else {
    headline = `${prettyTerm(
      leader,
    )} crushes ${prettyTerm(trailer)} in search volume.`;
  }

  const subline = `Over the ${cleanTf}, ${prettyTerm(
    leader,
  )} averages ${leaderAvg} and ${prettyTerm(
    trailer,
  )} sits at ${trailerAvg} (on a 0-100 scale). The higher the number, the more people are searching for it.`;

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
    prediction = `${prettyTerm(A)} and ${prettyTerm(B)} are dead even right now, and neither is pulling away. Looks like they'll stay neck-and-neck unless something big changes.`;
  } else if (leader === A && aSlope > 0.2 && bSlope <= 0) {
    prediction = `${prettyTerm(
      A,
    )} is already ahead and still growing, while ${prettyTerm(
      B,
    )} is flat or dropping. ${prettyTerm(
      A,
    )} will probably keep winning.`;
  } else if (leader === B && bSlope > 0.2 && aSlope <= 0) {
    prediction = `${prettyTerm(
      B,
    )} is already ahead and still growing, while ${prettyTerm(
      A,
    )} is flat or dropping. ${prettyTerm(
      B,
    )} will probably keep winning.`;
  } else if (leader === A && aSlope < 0 && bSlope > 0.2) {
    prediction = `${prettyTerm(
      A,
    )} is winning now, but ${prettyTerm(
      B,
    )} is surging. If this trend continues, ${prettyTerm(
      B,
    )} could overtake it soon.`;
  } else if (leader === B && bSlope < 0 && aSlope > 0.2) {
    prediction = `${prettyTerm(
      B,
    )} is winning now, but ${prettyTerm(
      A,
    )} is surging. If this trend continues, ${prettyTerm(
      A,
    )} could overtake it soon.`;
  } else {
    prediction = `Based on what we're seeing, things will probably stay about the same. Nothing dramatic happening here — just a snapshot of where ${prettyTerm(A)} and ${prettyTerm(B)} stand right now.`;
  }

  // Moments
  const moments: string[] = [];
  if (pkA.value) {
    moments.push(
      `${prettyTerm(A)} peaked in ${monthYearLabel(
        pkA.date,
      )} at ${pkA.value}.`,
    );
  }
  if (pkB.value) {
    moments.push(
      `${prettyTerm(B)} peaked in ${monthYearLabel(
        pkB.date,
      )} at ${pkB.value}.`,
    );
  }
  if (xo.count > 0) {
    moments.push(
      `They swapped leads ${xo.count} time${xo.count === 1 ? "" : "s"}. Last crossover was ${shortDateLabel(
        xo.last,
      )}.`,
    );
  } else {
    moments.push(
      `No lead changes. One term stayed on top the entire time.`,
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
    <main className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8 py-6">
      <BackButton label="Back to Home" />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main content */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header + insight */}
          <header className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-3">
                  {prettyTerm(terms[0])} <span className="text-slate-400">vs</span> {prettyTerm(terms[1])}
                </h1>
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                  {ai?.metaDescription ??
                    `Compare ${prettyTerm(terms[0])} and ${prettyTerm(
                      terms[1],
                    )} search interest trends with detailed insights and analysis.`}
                </p>
                {region && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    <span className="font-medium">Region:</span> {region}
                  </p>
                )}
                {sparse && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      ⚠️ Most interest comes in short spikes. Try a shorter timeframe for a clearer picture.
                    </p>
                  </div>
                )}
              </div>
              <TimeframeSelect />
            </div>

            <section className="grid gap-4 sm:gap-6 md:grid-cols-5">
              {/* Headline insight */}
              <div className="md:col-span-3 rounded-xl sm:rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/80 via-white to-blue-50/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 p-5 sm:p-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <p className="text-xs font-bold tracking-wide text-blue-600 mb-2 uppercase flex items-center gap-1.5">
                    <span className="text-base">📊</span> Key Insight
                  </p>
                  <p className="text-base sm:text-lg font-bold text-slate-900 mb-3 leading-snug">
                    {insight.headline}
                  </p>
                  <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{insight.subline}</p>
                </div>
              </div>

              {/* Quick context */}
              <div className="md:col-span-2 rounded-xl sm:rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/80 via-white to-slate-50/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 p-5 sm:p-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <p className="text-xs font-bold tracking-wide text-slate-600 mb-3 uppercase flex items-center gap-1.5">
                    <span className="text-base">⚡</span> Quick Context
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {insight.badges.map((b) => (
                      <span
                        key={b}
                        className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {insight.moments[0] ?? ""}
                  </p>
                </div>
              </div>
            </section>
          </header>

          {/* Chart */}
          <section className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
            <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 px-5 sm:px-6 py-4 border-b border-slate-200 group-hover:border-slate-300 transition-colors">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
                How {prettyTerm(terms[0])} and {prettyTerm(terms[1])} Compare Over Time
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Search volume for each term on a 0-100 scale. The higher the line, the more searches happening.
              </p>
            </div>
            <div className="p-4 sm:p-6 bg-gradient-to-br from-slate-50/30 to-white">
              <TrendChart series={series} />
            </div>
          </section>

          {/* Compare Stats */}
          <section className="rounded-xl sm:rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 shadow-xl hover:shadow-2xl transition-all duration-300 p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
              {prettyTerm(terms[0])} vs {prettyTerm(terms[1])}: The Numbers
            </h2>
            <CompareStats
              totalSearches={totalSearches}
              aLabel={prettyTerm(keyA)}
              bLabel={prettyTerm(keyB)}
              aShare={aShare}
              bShare={bShare}
            />
          </section>
          {/* Per-term insight cards */}
          <section className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {insight.termInsights.map((ti, idx) => (
              <div
                key={ti.term}
                className={`rounded-xl sm:rounded-2xl border ${idx === 0 ? 'border-blue-200 bg-gradient-to-br from-blue-50/70 via-white to-blue-50/40' : 'border-purple-200 bg-gradient-to-br from-purple-50/70 via-white to-purple-50/40'} backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 p-5 sm:p-6 relative overflow-hidden group`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${idx === 0 ? 'from-blue-400/5' : 'from-purple-400/5'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative z-10">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-sm' : 'bg-gradient-to-br from-purple-400 to-purple-600 shadow-sm'} animate-pulse`}></span>
                    {ti.term} Analysis
                  </h3>
                  <p className="text-xs text-slate-600 mb-4">
                    Detailed breakdown for this keyword
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                      <span className="text-sm font-medium text-slate-700">Average Interest</span>
                      <span className={`text-lg font-bold ${idx === 0 ? 'text-blue-600' : 'text-purple-600'}`}>{ti.avg}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                      <span className="text-sm font-medium text-slate-700">Trend Direction</span>
                      <span className="text-sm font-semibold text-slate-900 capitalize">{ti.trendWord}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                      <span className="text-sm font-medium text-slate-700">Volatility</span>
                      <span className="text-sm font-semibold text-slate-900 capitalize">{ti.stabilityWord}</span>
                    </div>
                    <div className="pt-2">
                      <p className="text-xs font-medium text-slate-700 mb-1">Peak Performance</p>
                      <p className="text-sm text-slate-900 font-medium">{ti.peakLabel}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-700 mb-1">Best Month</p>
                      <p className="text-sm text-slate-900 font-medium">{ti.bestMonthLabel}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Trend moments + prediction */}
          <section className="grid gap-4 sm:gap-6 md:grid-cols-3">
            <div className="md:col-span-2 rounded-xl sm:rounded-2xl border-2 border-slate-200 bg-white shadow-md p-5 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                📈 What Happened with {prettyTerm(terms[0])} and {prettyTerm(terms[1])}
              </h2>
              <ul className="space-y-3 text-sm sm:text-base text-slate-700">
                {insight.moments.map((m, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-blue-500 font-bold">•</span>
                    <span className="leading-relaxed">{m}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl sm:rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white shadow-md p-5 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                🔮 Where This Is Heading
              </h2>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{insight.prediction}</p>
            </div>
          </section>

          {/* Summary + At a glance */}
          <section className="grid gap-4 sm:gap-6 md:grid-cols-3">
            <div className="md:col-span-2 rounded-xl sm:rounded-2xl border-2 border-slate-200 bg-white shadow-md p-5 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                📝 Breaking Down {prettyTerm(terms[0])} vs {prettyTerm(terms[1])}
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed">
                <p>{human.summary}</p>
                {human.extraBullets.length > 0 && (
                  <ul className="space-y-2 pl-5">
                    {human.extraBullets.map((line, i) => (
                      <li key={i} className="list-disc">{line}</li>
                    ))}
                  </ul>
                )}
                {human.infoNote && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">{human.infoNote}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl sm:rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-md p-5 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                ⚡ {prettyTerm(terms[0])} & {prettyTerm(terms[1])} at a Glance
              </h2>
              <ul className="space-y-3">
                {human.atAGlance.map((line, i) => (
                  <li key={i} className="flex gap-3 text-sm sm:text-base text-slate-700">
                    <span className="text-blue-500 font-bold">✓</span>
                    <span className="leading-relaxed">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Side by side */}
          <section className="rounded-xl sm:rounded-2xl border-2 border-slate-200 bg-white shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-white px-5 sm:px-6 py-4 border-b-2 border-slate-200">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                📊 {prettyTerm(terms[0])} and {prettyTerm(terms[1])} Head-to-Head
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm sm:text-base">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-100 to-slate-50">
                    <th className="p-3 sm:p-4 text-left font-bold text-slate-700">Metric</th>
                    <th className="p-3 sm:p-4 text-left font-bold text-blue-600">{prettyTerm(terms[0])}</th>
                    <th className="p-3 sm:p-4 text-left font-bold text-purple-600">{prettyTerm(terms[1])}</th>
                  </tr>
                </thead>
                <tbody>
                  {human.table.rows.map((r, i) => (
                    <tr key={i} className="border-t border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="p-3 sm:p-4 font-medium text-slate-700">{r.label}</td>
                      <td className="p-3 sm:p-4 text-slate-900">{r.a}</td>
                      <td className="p-3 sm:p-4 text-slate-900">{r.b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Deep dive */}
          <section className="rounded-xl sm:rounded-2xl border-2 border-slate-200 bg-white shadow-md p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              🔍 The Full Story: {prettyTerm(terms[0])} vs {prettyTerm(terms[1])}
            </h2>
            <div className="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed">
              {human.longForm.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>

          {/* Scale explainer */}
          <section className="rounded-xl sm:rounded-2xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white shadow-md p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              ℹ️ How to Read This {prettyTerm(terms[0])} vs {prettyTerm(terms[1])} Data
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{human.scaleExplainer}</p>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="lg:sticky lg:top-24 space-y-6">
            <section className="rounded-xl sm:rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-md">
              <TopThisWeekServer />
            </section>
          </div>
        </aside>
      </div>

      {/* Related comparisons + FAQ */}
      <div className="space-y-8">
        <RelatedComparisons currentSlug={canonical} terms={terms} />
        <FAQSection />
      </div>
    </main>
  );
}
