import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { fromSlug, toCanonicalSlug } from "@/lib/slug";
import { getOrBuildComparison } from "@/lib/getOrBuild";
import { generateDynamicMeta, calculateComparisonData } from "@/lib/dynamicMetaGenerator";
import TrendChart from "@/components/TrendChart";
import TrendArcScoreChart from "@/components/TrendArcScoreChart";
import TimeframeSelect from "@/components/TimeframeSelect";
import DataSourceBadge from "@/components/DataSourceBadge";
import MultiSourceBreakdown from "@/components/MultiSourceBreakdown";
import { smoothSeries, nonZeroRatio } from "@/lib/series";
import { getDataSources } from "@/lib/trends-router";
import BackButton from "@/components/BackButton";
import FAQSection from "@/components/FAQSection";
import RelatedComparisonsSidebar from "@/components/RelatedComparisonsSidebar";
import { validateTopic } from "@/lib/validateTermsServer";
import RelatedComparisons from "@/components/RelatedComparisons";
import AdSense from "@/components/AdSense";
import SocialShareButtons from "@/components/SocialShareButtons";
import PDFDownloadButton from "@/components/PDFDownloadButton";
import DataExportButton from "@/components/DataExportButton";
import SaveComparisonButton from "@/components/SaveComparisonButton";
import CreateAlertButton from "@/components/CreateAlertButton";
import ComparisonHistoryTracker from "@/components/ComparisonHistoryTracker";
import StructuredData from "@/components/StructuredData";
import GeographicBreakdown from "@/components/GeographicBreakdown";
import { getGeographicBreakdown } from "@/lib/getGeographicData";
import { prepareInsightData, getOrGenerateAIInsights } from "@/lib/aiInsightsGenerator";
import AIKeyInsights from "@/components/AI/AIKeyInsights";
import AIPeakExplanations from "@/components/AI/AIPeakExplanations";
import AIPrediction from "@/components/AI/AIPrediction";
import AIPracticalImplications from "@/components/AI/AIPracticalImplications";
import ComparisonViewTracker from "@/components/ComparisonViewTracker";
import ComparisonVerdict from "@/components/ComparisonVerdict";
import HistoricalTimeline from "@/components/HistoricalTimeline";
import SearchBreakdown from "@/components/SearchBreakdown";
import PeakEventCitations from "@/components/PeakEventCitations";
import ComparisonPoll from "@/components/ComparisonPoll";
import KeyMetricsDashboard from "@/components/KeyMetricsDashboard";
import ActionableInsightsPanel from "@/components/ActionableInsightsPanel";
import ForecastSection from "@/components/ForecastSection";
import { getOrComputeForecastPack } from "@/lib/forecasting/forecast-pack";
import { prisma } from "@/lib/db";
import VerifiedPredictionsPanel from "@/components/VerifiedPredictionsPanel";
import QuickSummaryCard from "@/components/QuickSummaryCard";
import ViewCounter from "@/components/ViewCounter";
import ScoreBreakdownTooltip from "@/components/ScoreBreakdownTooltip";
import { runIntelligentComparison } from "@/lib/intelligent-comparison";
import { InsufficientDataError, getUserFriendlyMessage } from "@/lib/utils/errors";
import { detectPeaksWithEvents } from "@/lib/peak-event-detector";

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
  params: Promise<{ slug: string }>;
  searchParams?: { tf?: string; geo?: string };
}): Promise<Metadata> {
  const { slug } = await params;
  const { tf, geo } = searchParams || {};

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
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tf?: string; geo?: string; smooth?: string }>;
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

  // All features are free - no premium restrictions
  let timeframe = tf ?? "12m";
  const region = geo ?? "";

  let row;
  try {
    row = await getOrBuildComparison({
      slug: canonical,
      terms,
      timeframe,
      geo: region,
    });
  } catch (error) {
    // Handle InsufficientDataError with helpful error page
    if (error instanceof InsufficientDataError) {
      return (
        <main className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
              <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">
              {terms.map(prettyTerm).join(" vs ")}
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {error.userMessage}
            </p>
            <div className="mt-8 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-2xl mx-auto">
                <h3 className="font-semibold text-blue-900 mb-2">Suggestions:</h3>
                <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
                  <li>Try a different timeframe (e.g., "5y" for longer trends)</li>
                  <li>Check if the terms are spelled correctly</li>
                  <li>Try more general terms (e.g., "iPhone" instead of "iPhone 15 Pro Max")</li>
                  <li>Some terms may not have enough search volume to compare</li>
                </ul>
              </div>
              <div className="flex gap-4 justify-center">
                <a
                  href="/"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Back to Home
                </a>
                <a
                  href={`/compare/${canonical}?tf=5y`}
                  className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Try 5 Year Timeframe
                </a>
              </div>
            </div>
          </div>
        </main>
      );
    }
    // Re-throw other errors
    throw error;
  }
  
  if (!row) return notFound();

  // Use terms from database (preserves special characters like C++, Node.js)
  const actualTerms = row.terms as string[];
  const { series: rawSeries, ai } = row;

  const smoothingWindow = smooth === "0" ? 1 : 4;
  
  // Ensure rawSeries is an array
  const rawSeriesArray = Array.isArray(rawSeries) ? rawSeries : [];
  if (!rawSeriesArray.length) {
    return (
      <main className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {actualTerms.map(prettyTerm).join(" vs ")}
            </h1>
            <p className="text-slate-600">
              No data available. Please try different terms or check back later.
            </p>
          </div>
        </div>
      </main>
    );
  }
  
  const series = smoothSeries(rawSeriesArray, smoothingWindow);
  
  // Ensure series is an array after smoothing
  if (!Array.isArray(series)) {
    console.error('[ComparePage] smoothSeries did not return an array:', { series, type: typeof series });
    return (
      <main className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {actualTerms.map(prettyTerm).join(" vs ")}
            </h1>
            <p className="text-slate-600">
              Invalid data format. Please try again or contact support.
            </p>
          </div>
        </div>
      </main>
    );
  }
  
  const sparse = nonZeroRatio(rawSeriesArray) < 0.1;

  if (!series.length || series.length < 8) {
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

  // compute totals and shares for stats (needed for fallback)
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

  // Run intelligent comparison FIRST (needed for AI insights)
  let intelligentComparison: any = null;
  let verdictData;

  try {
    intelligentComparison = await runIntelligentComparison(
      actualTerms,
      series as any[],
      {
        enableYouTube: !!process.env.YOUTUBE_API_KEY,
        enableTMDB: !!process.env.TMDB_API_KEY,
        enableBestBuy: !!process.env.BESTBUY_API_KEY,
        enableSpotify: !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET),
        enableSteam: true, // Steam API works without a key
        cachedCategory: row.category, // Pass cached category from database (TIER 1 caching)
      }
    );
    
    // Build verdict data from intelligent comparison
    const termAScore = intelligentComparison.scores.termA.overall;
    const termBScore = intelligentComparison.scores.termB.overall;
    const actualWinner = termAScore >= termBScore ? actualTerms[0] : actualTerms[1];
    const actualLoser = actualWinner === actualTerms[0] ? actualTerms[1] : actualTerms[0];
    
    verdictData = {
      winner: actualWinner,
      loser: actualLoser,
      winnerScore: Math.max(termAScore, termBScore),
      loserScore: Math.min(termAScore, termBScore),
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
    
    // Create fallback intelligentComparison structure for AI insights
    intelligentComparison = {
      scores: {
        termA: { overall: Math.round(Math.max(aShare, bShare) * 100), breakdown: { searchInterest: Math.round(Math.max(aShare, bShare) * 100), socialBuzz: 50, authority: 50, momentum: 50 } },
        termB: { overall: Math.round(Math.min(aShare, bShare) * 100), breakdown: { searchInterest: Math.round(Math.min(aShare, bShare) * 100), socialBuzz: 50, authority: 50, momentum: 50 } },
      },
      verdict: { margin, confidence: margin < 5 ? 40 : margin < 15 ? 60 : 80, headline: '', recommendation: '', evidence: [] },
      performance: { sourcesQueried: ['Google Trends'] },
      category: { category: 'general' as const },
    };
    
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
  
  // Get data sources for transparency badge (after intelligent comparison)
  const dataSources = await getDataSources(
    actualTerms, 
    { timeframe, geo },
    intelligentComparison?.performance?.sourcesQueried
  );

  // Run all async operations in parallel for faster loading ⚡
  // All features are free - no premium restrictions
  const [geographicData, aiInsights, aiInsightsError, peakEvents, forecastPack, trustStats] = await Promise.all([
    // Get geographic breakdown (FREE - no API costs)
    getGeographicBreakdown(actualTerms[0], actualTerms[1], series as any[]),

    // Get or generate AI insights with smart caching (cost-optimized)
    // NOW INCLUDES MULTI-SOURCE DATA!
    // All users get AI insights (free)
    (async () => {
      try {
        const insightData = prepareInsightData(
          actualTerms[0],
          actualTerms[1],
          series as any[],
          intelligentComparison // Pass full multi-source comparison data
        );
        const result = await getOrGenerateAIInsights(
          canonical || '',
          timeframe || '12m',
          geo || '',
          insightData,
          false,
          intelligentComparison?.category.category
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

    // Detect peaks and find event citations (runs in background, doesn't block)
    detectPeaksWithEvents(series as any[], actualTerms, 20).catch(error => {
      console.warn('[Peak Detection] Error detecting peaks:', error);
      return [];
    }),

        // Get forecast pack (new time-series forecasting system)
        // Uses TrendArc Score (multi-source combined data) instead of raw Google Trends
        getOrComputeForecastPack(
          row.id,
          actualTerms[0],
          actualTerms[1],
          series as any[],
          timeframe || '12m',
          28, // 4 weeks default
          intelligentComparison?.category?.category || row.category || 'general'
        ).catch(error => {
          console.error('[ComparePage] Error computing forecast pack:', error);
          return null;
        }),

    // Get trust statistics
    prisma.forecastTrustStats.findUnique({
      where: { period: 'alltime' },
    }).catch(() => null),
  ]);

  // Old prediction system removed - using new forecasting system (ForecastSection) instead

  // Note: Category and AI insights are now saved automatically by getOrGenerateAIInsights()
  // Note: intelligentComparison and verdictData are now computed above, before AI insights

  return (
    <main className="mx-auto max-w-7xl space-y-6 sm:space-y-8 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <BackButton label="Back to Home" />

      {/* Full-width sections - Header, Poll, Summary, Verdict, AI Insights, Chart, Metrics, Insights */}
      <div className="space-y-6 sm:space-y-8">
          {/* Header + insight */}
          <header className="space-y-6 sm:space-y-8 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-3 sm:mb-4 leading-tight">
                  <span className="block sm:inline bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">{prettyTerm(actualTerms[0])}</span>{" "}
                  <span className="text-slate-400 text-2xl sm:text-3xl lg:text-4xl font-normal mx-1">vs</span>{" "}
                  <span className="block sm:inline bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">{prettyTerm(actualTerms[1])}</span>
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-3xl">
                  {ai?.metaDescription ??
                    `Compare ${prettyTerm(actualTerms[0])} and ${prettyTerm(
                      actualTerms[1],
                    )} search interest trends with detailed insights and analysis.`}
                </p>
                {region && (
                  <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-1.5 rounded-full transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{region}</span>
                  </p>
                )}
                {sparse && (
                  <div className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg shadow-sm">
                    <p className="text-sm font-medium text-amber-900 flex items-start gap-2">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>Most interest comes in short spikes. Try a shorter timeframe for a clearer picture.</span>
                    </p>
                  </div>
                )}
              </div>
              <div className="flex-shrink-0">
                <TimeframeSelect />
              </div>
            </div>

            {/* Track comparison view in history */}
            <ComparisonHistoryTracker
              slug={canonical || slug}
              termA={actualTerms[0]}
              termB={actualTerms[1]}
              timeframe={timeframe || '12m'}
              geo={geo || ''}
            />
            
            {/* Track anonymous usage for signup prompt */}
            <ComparisonViewTracker />

            {/* Social Share, PDF Download & View Counter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                <SocialShareButtons
                  url={`https://trendarc.net/compare/${slug}`}
                  title={`${prettyTerm(actualTerms[0])} vs ${prettyTerm(actualTerms[1])} - Which is more popular?`}
                  description={`See which is trending more: ${prettyTerm(actualTerms[0])} or ${prettyTerm(actualTerms[1])}? Compare search trends, social buzz, and more.`}
                  termA={actualTerms[0]}
                  termB={actualTerms[1]}
                  winner={verdictData.winner}
                  winnerScore={verdictData.winnerScore}
                  loserScore={verdictData.loserScore}
                />
                <div className="flex items-center gap-3 flex-wrap">
                  <SaveComparisonButton
                    slug={canonical || slug}
                    termA={actualTerms[0]}
                    termB={actualTerms[1]}
                    category={verdictData.category}
                  />
                  <CreateAlertButton
                    slug={canonical || slug}
                    termA={actualTerms[0]}
                    termB={actualTerms[1]}
                  />
                  <DataExportButton
                    slug={canonical || slug}
                    termA={actualTerms[0]}
                    termB={actualTerms[1]}
                    timeframe={timeframe || '12m'}
                    geo={geo || ''}
                  />
                  <PDFDownloadButton
                    slug={canonical || slug}
                    timeframe={timeframe || '12m'}
                    geo={geo || ''}
                    termA={actualTerms[0]}
                    termB={actualTerms[1]}
                  />
                </div>
              </div>
              <ViewCounter slug={canonical} initialCount={(row as any).viewCount || 0} />
            </div>
          </header>

          {/* Comparison Poll - Before results */}
          <ComparisonPoll
            termA={actualTerms[0]}
            termB={actualTerms[1]}
            actualWinner={verdictData.winner}
            actualWinnerScore={verdictData.winnerScore}
            actualLoserScore={verdictData.loserScore}
          />

          {/* Quick Summary Card - At the top for immediate insight */}
          <QuickSummaryCard
            winner={verdictData.winner}
            loser={verdictData.loser}
            winnerScore={verdictData.winnerScore}
            loserScore={verdictData.loserScore}
            margin={verdictData.margin}
            confidence={verdictData.confidence}
            category={verdictData.category || 'general'}
            termA={actualTerms[0]}
            termB={actualTerms[1]}
          />

          {/* TrendArc Verdict - The main comparison result */}
          <ComparisonVerdict
            verdict={verdictData}
            termA={actualTerms[0]}
            termB={actualTerms[1]}
          />

          {/* AI Key Insights - Compact Top Section */}
          {aiInsights && (
            <AIKeyInsights
              whatDataTellsUs={aiInsights.whatDataTellsUs}
              category={aiInsights.category}
            />
          )}

          {/* Fallback when AI is unavailable */}
          {!aiInsights && aiInsightsError && (
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl sm:rounded-2xl border-2 border-purple-200 shadow-lg p-4 sm:p-6 print:hidden">
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                    AI-Powered Insights Unavailable
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm mb-3">
                    {aiInsightsError === 'API key not configured'
                      ? 'AI insights are not configured. Add your ANTHROPIC_API_KEY environment variable to enable AI-powered analysis.'
                      : `Generation failed: ${aiInsightsError}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TrendArc Score Chart - Primary visualization */}
          <section className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="bg-gradient-to-r from-violet-50/80 via-purple-50/80 to-indigo-50/80 px-5 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-slate-200/60">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 flex items-center gap-2.5 mb-2">
                    <span className="w-2 h-6 sm:h-7 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full" />
                    TrendArc Score Over Time
                  </h2>
                  <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                    Comprehensive popularity score combining search interest, social buzz, authority, and momentum. 
                    <span className="text-slate-600 ml-1">Higher scores indicate greater overall popularity.</span>
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <DataSourceBadge sources={dataSources} />
              </div>
            </div>
            <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-white via-violet-50/10 to-white">
              <TrendArcScoreChart 
                series={series} 
                termA={actualTerms[0]} 
                termB={actualTerms[1]}
                category={verdictData.category as any}
              />
            </div>
          </section>

          {/* Key Metrics Dashboard */}
          <KeyMetricsDashboard
            series={series as any[]}
            termA={actualTerms[0]}
            termB={actualTerms[1]}
            winner={verdictData.winner}
            winnerScore={verdictData.winnerScore}
            loserScore={verdictData.loserScore}
            breakdownA={intelligentComparison?.scores?.termA?.breakdown}
            breakdownB={intelligentComparison?.scores?.termB?.breakdown}
          />

          {/* Actionable Insights Panel */}
          <ActionableInsightsPanel
            winner={verdictData.winner}
            loser={verdictData.loser}
            winnerScore={verdictData.winnerScore}
            loserScore={verdictData.loserScore}
            margin={verdictData.margin}
            category={verdictData.category}
            termA={actualTerms[0]}
            termB={actualTerms[1]}
          />
      </div>

      {/* Grid layout starts from Verified Predictions - Sidebar appears here */}
      <div className="grid gap-6 sm:gap-8 lg:grid-cols-12">
        {/* Main content column */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
          {/* Verified Predictions Panel - Show verified predictions to users */}
          {canonical && (
            <VerifiedPredictionsPanel
              slug={canonical}
              termA={actualTerms[0]}
              termB={actualTerms[1]}
            />
          )}

          {/* Forecast Section - New time-series forecasting system */}
          {forecastPack && (
            <ForecastSection
              termA={actualTerms[0]}
              termB={actualTerms[1]}
              series={series as any[]}
              forecastPack={forecastPack}
              trustStats={trustStats ? {
                totalEvaluated: trustStats.totalEvaluated,
                winnerAccuracyPercent: trustStats.winnerAccuracyPercent,
                intervalCoveragePercent: trustStats.intervalCoveragePercent,
                last90DaysAccuracy: trustStats.last90DaysAccuracy,
                sampleSize: trustStats.sampleSize,
              } : null}
            />
          )}


          {/* Multi-Source Score Breakdown */}
          {verdictData && intelligentComparison && (
            <MultiSourceBreakdown
              termA={actualTerms[0]}
              termB={actualTerms[1]}
              scoreA={intelligentComparison.scores.termA.overall}
              scoreB={intelligentComparison.scores.termB.overall}
              sources={[
                {
                  name: 'Search Interest (Google Trends)',
                  termA: intelligentComparison.scores.termA.breakdown.searchInterest,
                  termB: intelligentComparison.scores.termB.breakdown.searchInterest,
                },
                {
                  name: 'Social Buzz (' + 
                    (intelligentComparison.performance.sourcesQueried.includes('YouTube') ? 'YouTube' : '') +
                    (intelligentComparison.performance.sourcesQueried.includes('YouTube') && intelligentComparison.performance.sourcesQueried.includes('Spotify') ? ', ' : '') +
                    (intelligentComparison.performance.sourcesQueried.includes('Spotify') ? 'Spotify' : '') +
                    (intelligentComparison.performance.sourcesQueried.includes('Wikipedia') ? 
                      ((intelligentComparison.performance.sourcesQueried.includes('YouTube') || intelligentComparison.performance.sourcesQueried.includes('Spotify')) ? ', Wikipedia' : 'Wikipedia') : '') +
                    ')',
                  termA: intelligentComparison.scores.termA.breakdown.socialBuzz,
                  termB: intelligentComparison.scores.termB.breakdown.socialBuzz,
                },
                // Only show Authority if we have authority sources (TMDB, Steam, Best Buy, OMDb, GitHub)
                ...(intelligentComparison.performance.sourcesQueried.some((s: string) =>
                  ['TMDB', 'Steam', 'Best Buy', 'OMDb', 'GitHub'].includes(s)
                ) ? [{
                  name: 'Authority' + (
                    intelligentComparison.performance.sourcesQueried.includes('TMDB') ? ' (TMDB)' :
                    intelligentComparison.performance.sourcesQueried.includes('Steam') ? ' (Steam)' :
                    intelligentComparison.performance.sourcesQueried.includes('Best Buy') ? ' (Best Buy)' :
                    ''
                  ),
                  termA: intelligentComparison.scores.termA.breakdown.authority,
                  termB: intelligentComparison.scores.termB.breakdown.authority,
                }] : []),
                {
                  name: 'Momentum (Trend Direction)',
                  termA: intelligentComparison.scores.termA.breakdown.momentum,
                  termB: intelligentComparison.scores.termB.breakdown.momentum,
                },
              ]}
              category={intelligentComparison.category.category}
              breakdownA={intelligentComparison.scores.termA.breakdown}
              breakdownB={intelligentComparison.scores.termB.breakdown}
            />
          )}

          {/* Peak Event Citations - Real events with citations */}
          {peakEvents && peakEvents.length > 0 && (
            <PeakEventCitations
              peaks={peakEvents}
              termA={actualTerms[0]}
              termB={actualTerms[1]}
            />
          )}

          {/* AI Peak Explanations - Right After Chart */}
          {aiInsights?.peakExplanations && (
            <AIPeakExplanations
              peakExplanations={aiInsights.peakExplanations}
              termA={actualTerms[0]}
              termB={actualTerms[1]}
            />
          )}

          {/* AI Prediction - Forecast */}
          {aiInsights?.prediction && (
            <AIPrediction prediction={aiInsights.prediction} />
          )}

          {/* Reasoning - Why This Matters & Key Differences */}
          {aiInsights && (aiInsights.whyThisMatters || aiInsights.keyDifferences || aiInsights.volatilityAnalysis) && (
            <section className="bg-white rounded-xl sm:rounded-2xl border-2 border-slate-200 shadow-lg p-4 sm:p-5 lg:p-6">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                <span className="w-1.5 h-5 sm:h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full flex-shrink-0" />
                <span>Why This Comparison Matters</span>
              </h2>
              <div className="space-y-3 sm:space-y-4">
                {aiInsights.whyThisMatters && (
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-emerald-200">
                    <h3 className="font-semibold text-emerald-800 mb-1.5 sm:mb-2 text-xs sm:text-sm uppercase tracking-wide">Context</h3>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{aiInsights.whyThisMatters}</p>
                  </div>
                )}
                {aiInsights.keyDifferences && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200">
                    <h3 className="font-semibold text-blue-800 mb-1.5 sm:mb-2 text-xs sm:text-sm uppercase tracking-wide">Key Differences</h3>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{aiInsights.keyDifferences}</p>
                  </div>
                )}
                {aiInsights.volatilityAnalysis && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-amber-200">
                    <h3 className="font-semibold text-amber-800 mb-1.5 sm:mb-2 text-xs sm:text-sm uppercase tracking-wide">Trend Behavior</h3>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{aiInsights.volatilityAnalysis}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Search Interest Breakdown */}
          <SearchBreakdown
            series={series as any[]}
            termA={actualTerms[0]}
            termB={actualTerms[1]}
          />

          {/* Historical Timeline with AI Peak Explanations */}
          <HistoricalTimeline
            termA={actualTerms[0]}
            termB={actualTerms[1]}
            series={series as any[]}
            peakExplanations={aiInsights?.peakExplanations}
          />

          {/* What This Means For You - Practical Implications */}
          {aiInsights?.practicalImplications && (
            <AIPracticalImplications
              practicalImplications={aiInsights.practicalImplications}
            />
          )}

          {/* Geographic Breakdown */}
          {geographicData && (geographicData.termA_dominance.length > 0 || geographicData.termB_dominance.length > 0 || geographicData.competitive_regions.length > 0) && (
            <GeographicBreakdown
              termA={actualTerms[0]}
              termB={actualTerms[1]}
              geoData={geographicData}
            />
          )}

          {/* Related Comparisons */}
          <RelatedComparisons
            currentSlug={canonical || slug}
            terms={actualTerms}
          />

          {/* FAQ Section */}
          <FAQSection />
        </div>

        {/* Sidebar - Trending Comparisons & Ads */}
        <aside className="lg:col-span-4 space-y-5 sm:space-y-6">
          <div className="lg:sticky lg:top-6 space-y-5 sm:space-y-6">
            {/* Related Comparisons */}
            <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <RelatedComparisonsSidebar
                currentSlug={canonical}
                category={intelligentComparison?.category?.category || row.category || null}
                terms={actualTerms}
                limit={6}
              />
            </section>
            
            {/* AdSense - Sidebar */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
              <AdSense
                adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR}
                adFormat="vertical"
                fullWidthResponsive
                className="min-h-[250px]"
              />
            </div>
          </div>
        </aside>
      </div>

      {/* AdSense - Bottom of Page */}
      <div className="my-8 flex justify-center">
        <AdSense
          adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_3}
          adFormat="horizontal"
          fullWidthResponsive
          className="min-h-[100px]"
        />
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
