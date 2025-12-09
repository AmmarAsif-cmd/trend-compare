import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { fromSlug, toCanonicalSlug } from "@/lib/slug";
import { getOrBuildComparison } from "@/lib/getOrBuild";
import { generateDynamicMeta, calculateComparisonData } from "@/lib/dynamicMetaGenerator";
import TrendChart from "@/components/TrendChart";
import TimeframeSelect from "@/components/TimeframeSelect";
import DataSourceBadge from "@/components/DataSourceBadge";
import { smoothSeries, nonZeroRatio } from "@/lib/series";
import { getDataSources, getMultiSourceData } from "@/lib/trends-router";
import BackButton from "@/components/BackButton";
import RedditBuzzSection from "@/components/RedditBuzzSection";
import WikipediaInterestSection from "@/components/WikipediaInterestSection";
import AmazonProductSection from "@/components/AmazonProductSection";
import { getProductComparison } from "@/lib/amazon-mock-data";
import FAQSection from "@/components/FAQSection";
import { buildHumanCopy } from "@/lib/humanize";
import TopThisWeekServer from "@/components/TopThisWeekServer";
import { validateTopic } from "@/lib/validateTermsServer";
import RelatedComparisons from "@/components/RelatedComparisons";
import CompareStats from "@/components/CompareStats";
import ContentEngineInsights from "@/components/ContentEngineInsights";
import { generateComparisonContent } from "@/lib/content-engine";
import SearchBreakdown from "@/components/SearchBreakdown";
import ReportActions from "@/components/ReportActions";
import RealTimeContext from "@/components/RealTimeContext";
import StructuredData from "@/components/StructuredData";
import HistoricalTimeline from "@/components/HistoricalTimeline";
import GeographicBreakdown from "@/components/GeographicBreakdown";
import { getGeographicBreakdown } from "@/lib/getGeographicData";
import DataSpecificAIInsights from "@/components/DataSpecificAIInsights";
import { prepareInsightData, getOrGenerateAIInsights } from "@/lib/aiInsightsGenerator";
import AIKeyInsights from "@/components/AI/AIKeyInsights";
import AIPeakExplanations from "@/components/AI/AIPeakExplanations";
import AIPrediction from "@/components/AI/AIPrediction";
import AIPracticalImplications from "@/components/AI/AIPracticalImplications";
import { prisma } from "@/lib/db";

// Revalidate every 10 minutes for fresh data while maintaining performance
export const revalidate = 600; // 10 minutes

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
  if (std >= 20) return "highly variable";
  if (std >= 10) return "somewhat variable";
  return "consistent";
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
        ? `Peaked in ${monthYearLabel(pk.date)}`
        : "no clear peak",
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
  const { tf, geo } = await searchParams;

  const raw = fromSlug(slug);
  const checked = raw.map(validateTopic);
  const valid = checked.filter(isValidTopic);
  if (valid.length !== checked.length) {
    return { title: "Not available", robots: { index: false } };
  }

  const terms = valid.map((c) => c.term);
  const canonical = toCanonicalSlug(terms);
  if (!canonical) return { title: "Not available", robots: { index: false } };

  const timeframe = tf ?? "12m";
  const region = geo ?? "";

  // Fetch comparison data to generate dynamic meta content
  try {
    const row = await getOrBuildComparison({
      slug: canonical,
      terms,
      timeframe,
      geo: region,
    });

    if (row && row.series && row.series.length > 0) {
      // Use terms from database (preserves special characters like C++, Node.js)
      const actualTerms = row.terms as string[];

      // Calculate comparison data from series
      const comparisonData = calculateComparisonData(
        actualTerms[0],
        actualTerms[1],
        row.series as Array<{ date: string; [key: string]: any }>
      );

      // Generate dynamic meta content based on actual data
      const { title, description } = generateDynamicMeta(
        comparisonData,
        actualTerms[0],
        actualTerms[1]
      );

      return {
        title: `${title} | TrendArc`,
        description,
        alternates: { canonical: `/compare/${canonical}` },
        openGraph: {
          title: `${title} | TrendArc`,
          description,
          type: "website",
          url: `/compare/${canonical}`,
        },
        twitter: {
          card: "summary_large_image",
          title: `${title} | TrendArc`,
          description,
        },
      };
    }
  } catch (error) {
    console.error("Error generating dynamic metadata:", error);
  }

  // Fallback to simple meta if dynamic generation fails
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

  // Use terms from database (preserves special characters like C++, Node.js)
  const actualTerms = row.terms as string[];
  const { series: rawSeries, ai } = row;

  const smoothingWindow = smooth === "0" ? 1 : 4;
  const series = smoothSeries(rawSeries as any[], smoothingWindow);
  const sparse = nonZeroRatio(rawSeries as any[]) < 0.1;

  if (!series?.length || series.length < 8) {
    return (
      <main className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {actualTerms.map(prettyTerm).join(" vs ")}
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

  const insight = buildInsightBundle(series as any, actualTerms, timeframe);

  // Get data sources for transparency badge
  const dataSources = await getDataSources(actualTerms, { timeframe, geo });

  // Run all async operations in parallel for faster loading ⚡
  const [contentEngineResult, geographicData, aiInsights, aiInsightsError, multiSourceData, productData] = await Promise.all([
    // Generate Content Engine insights (advanced pattern detection)
    generateComparisonContent(actualTerms, rawSeries as any[], {
      deepAnalysis: true,
      useMultiSource: true,
    }).catch((error) => {
      console.error('Content Engine error:', error);
      return null;
    }),

    // Get geographic breakdown (FREE - no API costs)
    getGeographicBreakdown(actualTerms[0], actualTerms[1], series as any[]),

    // Get or generate AI insights with smart caching (cost-optimized)
    // Only calls Claude API if: no insights exist, or insights are >7 days old
    (async () => {
      try {
        const insightData = prepareInsightData(actualTerms[0], actualTerms[1], series as any[]);
        const result = await getOrGenerateAIInsights(
          canonical || '',
          timeframe || '12m',
          geo || '',
          insightData,
          false // Set to true to force refresh
        );

        if (result) {
          console.log('[AI Insights] ✅ Retrieved insights for:', actualTerms.join(' vs '));
          return result;
        } else {
          console.log('[AI Insights] ⚠️ Not available - check cache, budget limits or API key');
          return null;
        }
      } catch (error) {
        console.error('[AI Insights] ❌ Error:', error);
        return null;
      }
    })(),

    // Error tracking for AI insights
    (async () => {
      if (!process.env.ANTHROPIC_API_KEY) {
        return 'API key not configured';
      }
      return null;
    })(),

    // Get multi-source data for source-specific insights (Option A architecture)
    getMultiSourceData(actualTerms, { timeframe, geo }).catch((error) => {
      console.error('[Multi-Source] Failed to fetch multi-source data:', error);
      return { termA: null, termB: null };
    }),

    // Get Amazon product data (DEMO MODE - uses mock data)
    getProductComparison(actualTerms[0], actualTerms[1]).catch((error) => {
      console.error('[Amazon Products] Failed to fetch product data:', error);
      return { productA: null, productB: null };
    }),
  ]);

  // Note: Category and AI insights are now saved automatically by getOrGenerateAIInsights()

  // compute totals and shares for stats
  const keyA = actualTerms[0];
  const keyB = actualTerms[1];

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
                  {prettyTerm(actualTerms[0])} <span className="text-slate-400">vs</span> {prettyTerm(actualTerms[1])}
                </h1>
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                  {ai?.metaDescription ??
                    `Compare ${prettyTerm(actualTerms[0])} and ${prettyTerm(
                      actualTerms[1],
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

            {/* Report Actions - PDF and Share */}
            <ReportActions
              title={`${prettyTerm(actualTerms[0])} vs ${prettyTerm(actualTerms[1])} - Trend Comparison`}
              url={typeof window !== 'undefined' ? window.location.href : `https://trendarc.com/compare/${slug}`}
              termA={actualTerms[0]}
              termB={actualTerms[1]}
            />

            {/* Real-Time Context - Live comparison status */}
            <RealTimeContext
              termA={actualTerms[0]}
              termB={actualTerms[1]}
              series={series as any[]}
              timeframe={timeframe}
            />

            <section className="grid gap-4 sm:gap-6 lg:grid-cols-5">
              {/* Headline insight */}
              <div className="lg:col-span-3 rounded-xl sm:rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/80 via-white to-blue-50/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-5 lg:p-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <p className="text-xs font-bold tracking-wide text-blue-600 mb-2 uppercase flex items-center gap-1.5">
                    <span className="text-base">📊</span> Key Insight
                  </p>
                  <p className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 mb-3 leading-snug">
                    {insight.headline}
                  </p>
                  <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{insight.subline}</p>
                </div>
              </div>

              {/* Quick context */}
              <div className="lg:col-span-2 rounded-xl sm:rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/80 via-white to-slate-50/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-5 lg:p-6 relative overflow-hidden group">
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

          {/* AI Key Insights - Compact Top Section */}
          {aiInsights && (
            <AIKeyInsights
              whatDataTellsUs={aiInsights.whatDataTellsUs}
              category={aiInsights.category}
            />
          )}

          {/* Fallback when AI is unavailable */}
          {!aiInsights && (
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 shadow-lg p-6 print:hidden">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    AI-Powered Insights Unavailable
                  </h3>
                  <p className="text-slate-600 text-sm mb-3">
                    {aiInsightsError === 'API key not configured'
                      ? 'AI insights are not configured. Add your ANTHROPIC_API_KEY environment variable to enable AI-powered analysis.'
                      : aiInsightsError
                      ? `Generation failed: ${aiInsightsError}`
                      : 'Daily or monthly budget limit reached. AI insights will be available again soon.'}
                  </p>
                  <div className="bg-white/60 rounded-lg p-3 text-xs text-slate-600">
                    <p className="font-semibold mb-1">What you're missing:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Data-specific analysis with exact numbers and dates</li>
                      <li>Volatility insights and trend predictions</li>
                      <li>Practical implications for your use case</li>
                      <li>AI-powered pattern detection</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          <section className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
            <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 px-4 sm:px-5 lg:px-6 py-3 sm:py-4 border-b border-slate-200 group-hover:border-slate-300 transition-colors">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="w-1.5 h-5 sm:h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
                How {prettyTerm(terms[0])} and {prettyTerm(terms[1])} Compare Over Time
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Search volume for each term on a 0-100 scale. The higher the line, the more searches happening.
              </p>
              <div className="mt-3">
                <DataSourceBadge sources={dataSources} />
              </div>
            </div>
            <div className="p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-slate-50/30 to-white">
              <TrendChart series={series} />
            </div>
          </section>

          {/* AI Peak Explanations - Right After Chart */}
          {aiInsights?.peakExplanations && (
            <AIPeakExplanations
              peakExplanations={aiInsights.peakExplanations}
              termA={actualTerms[0]}
              termB={actualTerms[1]}
            />
          )}

          {/* Compare Stats */}
          <section className="rounded-xl sm:rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 shadow-xl hover:shadow-2xl transition-all duration-300 p-4 sm:p-5 lg:p-6">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 sm:h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
              {prettyTerm(actualTerms[0])} vs {prettyTerm(actualTerms[1])}: The Numbers
            </h2>
            <CompareStats
              totalSearches={totalSearches}
              aLabel={prettyTerm(keyA)}
              bLabel={prettyTerm(keyB)}
              aShare={aShare}
              bShare={bShare}
            />
          </section>

          {/* AI Prediction - Forecast */}
          {aiInsights?.prediction && (
            <AIPrediction prediction={aiInsights.prediction} />
          )}

          {/* Per-term insight cards */}
          <section className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            {insight.termInsights.map((ti, idx) => (
              <div
                key={ti.term}
                className={`rounded-xl sm:rounded-2xl border ${idx === 0 ? 'border-blue-200 bg-gradient-to-br from-blue-50/70 via-white to-blue-50/40' : 'border-purple-200 bg-gradient-to-br from-purple-50/70 via-white to-purple-50/40'} backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-5 lg:p-6 relative overflow-hidden group`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${idx === 0 ? 'from-blue-400/5' : 'from-purple-400/5'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative z-10">
                  <h3 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-sm' : 'bg-gradient-to-br from-purple-400 to-purple-600 shadow-sm'} animate-pulse`}></span>
                    {ti.term} Analysis
                  </h3>
                  <div className="space-y-3 mt-4">
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
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Search Interest Breakdown */}
          <SearchBreakdown series={series} termA={keyA} termB={keyB} />

          {/* Prediction */}
          <section className="rounded-xl sm:rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white shadow-md p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              🔮 Where This Is Heading
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{insight.prediction}</p>
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

      {/* Deeper Insights Section */}
      {contentEngineResult && (
        <div className="border-t-2 border-slate-200 pt-8 space-y-6">
          <div className="text-center mb-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Deeper Insights
            </h2>
            <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto mt-2">
              Advanced pattern detection with real event analysis from multiple verified sources
            </p>
          </div>
          <ContentEngineInsights
            narrative={contentEngineResult.narrative}
            terms={actualTerms}
          />
        </div>
      )}

      {/* Historical Timeline - Key moments */}
      <HistoricalTimeline
        termA={actualTerms[0]}
        termB={actualTerms[1]}
        series={series as any[]}
      />

      {/* Geographic Breakdown - Regional preferences */}
      <GeographicBreakdown
        geoData={geographicData}
        termA={actualTerms[0]}
        termB={actualTerms[1]}
      />

      {/* Multi-Source Insights - Reddit Buzz */}
      {multiSourceData && (
        <RedditBuzzSection
          termA={actualTerms[0]}
          termB={actualTerms[1]}
          dataA={multiSourceData.termA?.sources.find(s => s.source === 'reddit') || null}
          dataB={multiSourceData.termB?.sources.find(s => s.source === 'reddit') || null}
        />
      )}

      {/* Multi-Source Insights - Wikipedia Interest */}
      {multiSourceData && (
        <WikipediaInterestSection
          termA={actualTerms[0]}
          termB={actualTerms[1]}
          dataA={multiSourceData.termA?.sources.find(s => s.source === 'wikipedia') || null}
          dataB={multiSourceData.termB?.sources.find(s => s.source === 'wikipedia') || null}
        />
      )}

      {/* Amazon Product Comparison (DEMO MODE) */}
      {productData && (productData.productA || productData.productB) && (
        <AmazonProductSection
          termA={actualTerms[0]}
          termB={actualTerms[1]}
          productA={productData.productA}
          productB={productData.productB}
          isDemoMode={true}
        />
      )}

      {/* AI Practical Implications - Actionable Insights */}
      {aiInsights?.practicalImplications && (
        <AIPracticalImplications
          practicalImplications={aiInsights.practicalImplications}
        />
      )}

      {/* Related comparisons + FAQ */}
      <div className="space-y-8">
        <RelatedComparisons currentSlug={canonical} terms={actualTerms} />
        <FAQSection />
      </div>

      {/* Structured Data for SEO */}
      <StructuredData
        termA={actualTerms[0]}
        termB={actualTerms[1]}
        slug={canonical}
        series={series as any[]}
        leader={aShare > bShare ? actualTerms[0] : actualTerms[1]}
        advantage={Math.round(Math.abs((aShare - bShare) * 100))}
      />
    </main>
  );
}
