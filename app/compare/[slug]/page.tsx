import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { fromSlug, toCanonicalSlug } from "@/lib/slug";
import { getOrBuildComparison } from "@/lib/getOrBuild";
import { generateDynamicMeta, calculateComparisonData } from "@/lib/dynamicMetaGenerator";
import TrendChart from "@/components/TrendChart";
import TimeframeSelect from "@/components/TimeframeSelect";
import DataSourceBadge from "@/components/DataSourceBadge";
import { smoothSeries, nonZeroRatio } from "@/lib/series";
import { getDataSources } from "@/lib/trends-router";
import BackButton from "@/components/BackButton";
import FAQSection from "@/components/FAQSection";
import TopThisWeekServer from "@/components/TopThisWeekServer";
import { validateTopic } from "@/lib/validateTermsServer";
import RelatedComparisons from "@/components/RelatedComparisons";
import CompareStats from "@/components/CompareStats";
import SocialShareButtons from "@/components/SocialShareButtons";
import StructuredData from "@/components/StructuredData";
import GeographicBreakdown from "@/components/GeographicBreakdown";
import { getGeographicBreakdown } from "@/lib/getGeographicData";
import { prepareInsightData, getOrGenerateAIInsights } from "@/lib/aiInsightsGenerator";
import AIKeyInsights from "@/components/AI/AIKeyInsights";
import AIPeakExplanations from "@/components/AI/AIPeakExplanations";
import AIPrediction from "@/components/AI/AIPrediction";
import ComparisonVerdict from "@/components/ComparisonVerdict";
import { runIntelligentComparison } from "@/lib/intelligent-comparison";

// Revalidate every 10 minutes for fresh data while maintaining performance
export const revalidate = 600; // 10 minutes

/* ---------------- helpers ---------------- */

function prettyTerm(t: string) {
  return t.replace(/-/g, " ");
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

      const ogImageUrl = `/api/og?a=${encodeURIComponent(actualTerms[0])}&b=${encodeURIComponent(actualTerms[1])}&winner=${encodeURIComponent(comparisonData.leader)}&advantage=${Math.round(comparisonData.advantage)}`;

      return {
        title: `${title} | TrendArc`,
        description,
        alternates: { canonical: `/compare/${canonical}` },
        openGraph: {
          title: `${title} | TrendArc`,
          description,
          type: "website",
          url: `/compare/${canonical}`,
          images: [
            {
              url: ogImageUrl,
              width: 1200,
              height: 630,
              alt: `${actualTerms[0]} vs ${actualTerms[1]} trend comparison`,
            },
          ],
        },
        twitter: {
          card: "summary_large_image",
          title: `${title} | TrendArc`,
          description,
          images: [ogImageUrl],
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

  // Get data sources for transparency badge
  const dataSources = await getDataSources(actualTerms, { timeframe, geo });

  // Run all async operations in parallel for faster loading ⚡
  const [geographicData, aiInsights, aiInsightsError] = await Promise.all([
    // Get geographic breakdown (FREE - no API costs)
    getGeographicBreakdown(actualTerms[0], actualTerms[1], series as any[]),

    // Get or generate AI insights with smart caching (cost-optimized)
    (async () => {
      try {
        const insightData = prepareInsightData(actualTerms[0], actualTerms[1], series as any[]);
        const result = await getOrGenerateAIInsights(
          canonical || '',
          timeframe || '12m',
          geo || '',
          insightData,
          false
        );
        return result || null;
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

  // Run intelligent multi-source comparison with error handling
  let verdictData;
  try {
    const intelligentComparison = await runIntelligentComparison(
      actualTerms,
      series as any[],
      {
        enableYouTube: !!process.env.YOUTUBE_API_KEY,
        enableTMDB: !!process.env.TMDB_API_KEY,
      }
    );
    
    // Build verdict data from intelligent comparison
    verdictData = {
      winner: intelligentComparison.verdict.winner,
      loser: intelligentComparison.verdict.loser,
      winnerScore: intelligentComparison.verdict.winnerScore.overall,
      loserScore: intelligentComparison.verdict.loserScore.overall,
      margin: intelligentComparison.verdict.margin,
      confidence: intelligentComparison.verdict.confidence,
      headline: intelligentComparison.verdict.headline,
      recommendation: intelligentComparison.verdict.recommendation,
      evidence: intelligentComparison.verdict.evidence || [],
      category: intelligentComparison.category.category,
      sources: intelligentComparison.performance.sourcesQueried || ['Google Trends'],
    };
  } catch (error) {
    console.error('[Intelligent Comparison] Error:', error);
    // Fallback to basic verdict based on Google Trends data
    const winner = aShare > bShare ? actualTerms[0] : actualTerms[1];
    const loser = winner === actualTerms[0] ? actualTerms[1] : actualTerms[0];
    const margin = Math.abs(aShare - bShare) * 100;
    
    verdictData = {
      winner,
      loser,
      winnerScore: Math.round(Math.max(aShare, bShare) * 100),
      loserScore: Math.round(Math.min(aShare, bShare) * 100),
      margin,
      confidence: margin < 5 ? 40 : margin < 15 ? 60 : 80,
      headline: margin < 5 
        ? `${prettyTerm(actualTerms[0])} and ${prettyTerm(actualTerms[1])} are virtually tied`
        : `${prettyTerm(winner)} leads in search interest`,
      recommendation: `Based on search trends, ${prettyTerm(winner)} shows ${margin >= 10 ? 'significantly' : 'slightly'} more interest.`,
      evidence: ['Based on Google Trends data'],
      category: 'general' as const,
      sources: ['Google Trends'],
    };
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

            {/* Social Share */}
            <SocialShareButtons
              url={`https://trendarc.net/compare/${slug}`}
              title={`${prettyTerm(actualTerms[0])} vs ${prettyTerm(actualTerms[1])} - Which is more popular?`}
              termA={actualTerms[0]}
              termB={actualTerms[1]}
            />

            {/* TrendArc Verdict - The main comparison result */}
            <ComparisonVerdict
              verdict={verdictData}
              termA={actualTerms[0]}
              termB={actualTerms[1]}
            />
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

      {/* Geographic Breakdown - Regional preferences */}
      <GeographicBreakdown
        geoData={geographicData}
        termA={actualTerms[0]}
        termB={actualTerms[1]}
      />

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
