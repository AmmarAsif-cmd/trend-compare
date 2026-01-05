import { notFound, redirect, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { fromSlug, toCanonicalSlug } from "@/lib/slug";
import { getOrBuildComparison } from "@/lib/getOrBuild";
import { generateDynamicMeta, calculateComparisonData } from "@/lib/dynamicMetaGenerator";
import { getComparisonCanonicalUrl } from "@/lib/canonical-url";
import { getRobotsForParams } from "@/lib/seo/params";
import TrendChart from "@/components/TrendChart";
import TrendArcScoreChart from "@/components/TrendArcScoreChart";
import TopActionsBar from "@/components/TopActionsBar";
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
import SnapshotSaver from "@/components/SnapshotSaver";
import StructuredData from "@/components/StructuredData";
import GeographicBreakdown from "@/components/GeographicBreakdown";
import { getGeographicBreakdown } from "@/lib/getGeographicData";
import { prepareInsightData, getOrGenerateAIInsights } from "@/lib/aiInsightsGenerator";
import AIPeakExplanations from "@/components/AI/AIPeakExplanations";
import AIPrediction from "@/components/AI/AIPrediction";
import ComparisonViewTracker from "@/components/ComparisonViewTracker";
import HistoricalTimeline from "@/components/HistoricalTimeline";
import SearchBreakdown from "@/components/SearchBreakdown";
import ComparisonPoll from "@/components/ComparisonPoll";
import ForecastSection from "@/components/ForecastSection";
import { getOrComputeForecastPack } from "@/lib/forecasting/forecast-pack";
import { prisma } from "@/lib/db";
import VerifiedPredictionsPanel from "@/components/VerifiedPredictionsPanel";
import ViewCounter from "@/components/ViewCounter";
import ScoreBreakdownTooltip from "@/components/ScoreBreakdownTooltip";
import { runIntelligentComparison } from "@/lib/intelligent-comparison";
import { InsufficientDataError, getUserFriendlyMessage } from "@/lib/utils/errors";
import { detectPeaksWithEvents } from "@/lib/peak-event-detector";
import { computeComparisonMetrics, type ComparisonMetrics } from "@/lib/comparison-metrics";
import { calculateComparisonConfidence } from "@/lib/confidence-calculator";
import { getLatestSnapshot } from "@/lib/comparison-snapshots";
import { prepareEvidenceCards } from "@/lib/prepare-evidence";
import WhatChanged from "@/components/WhatChanged";
import VerdictCardV2 from "@/components/VerdictCardV2";
import KeyEvidenceSection from "@/components/KeyEvidenceSection";
import WhatToDoNext from "@/components/WhatToDoNext";
import DeepDiveAccordion from "@/components/DeepDiveAccordion";
import TrustAndInsights from "@/components/TrustAndInsights";
import { getCurrentUser } from "@/lib/user-auth-helpers";
import { checkAnonymousLimit, incrementAnonymousCount } from "@/lib/anonymous-limit-server";
import { buildComparisonFaqs } from "@/lib/faqs/comparison-faqs";
import { isComparisonSaved } from "@/lib/saved-comparisons";
import { shouldShowForecast } from "@/lib/forecast-guardrails";
import { AlertTriangle } from "lucide-react";
import LazyDeepDive from "@/components/LazyDeepDive";
import ComparisonOverview from "@/components/compare/ComparisonOverview";
import KeyTakeaways from "@/components/compare/KeyTakeaways";
import HowToInterpret from "@/components/compare/HowToInterpret";
import FAQSchema from "@/components/compare/FAQSchema";
import RelatedAnalysis from "@/components/compare/RelatedAnalysis";

// Revalidate every 10 minutes for fresh data while maintaining performance
export const revalidate = 600; // 10 minutes

// Enable edge caching for public comparison pages
export const dynamic = 'force-dynamic'; // Allow dynamic rendering but cache at edge

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
  searchParams?: Promise<{ tf?: string; geo?: string; [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const { tf, geo } = resolvedSearchParams;

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

  // Check for non-indexable params (utm_*, gclid, fbclid, ref, source, etc.)
  // Note: tf and geo are indexable params, so we only check for non-indexable ones
  const robots = getRobotsForParams(resolvedSearchParams);

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

      // Canonical URL must exclude query params always
      const canonicalUrl = getComparisonCanonicalUrl(canonical);
      
      return {
        title: `${title} | TrendArc`,
        description,
        alternates: { canonical: canonicalUrl },
        robots,
        openGraph: {
          title: `${title} | TrendArc`,
          description,
          type: "website",
          url: canonicalUrl,
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

  // Canonical URL must exclude query params always
  const canonicalUrl = getComparisonCanonicalUrl(canonical);
  
  return {
    title: `${cleanTerms.join(" vs ")} | TrendArc`,
    description: `Compare ${cleanTerms.join(
      " vs ",
    )} search interest${tf ? ` (${tf})` : ""} with clear charts and human-friendly summaries.`,
    alternates: { canonical: canonicalUrl },
    robots,
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

  // Check anonymous comparison limit (server-side enforcement)
  const limitCheck = await checkAnonymousLimit();
  if (!limitCheck.allowed && limitCheck.needsSignup) {
    // User has exceeded limit, redirect to signup with return URL
    const returnUrl = encodeURIComponent(`/compare/${slug}${tf ? `?tf=${tf}` : ''}${geo ? `${tf ? '&' : '?'}geo=${geo}` : ''}`);
    redirect(`/signup?redirect=${returnUrl}&reason=limit_exceeded`);
  }

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
    // 301 redirect to clean canonical slug (no query params)
    // This ensures single-hop redirect to final canonical URL
    // Query params (tf, geo) are for functionality but not part of canonical URL
    permanentRedirect(`/compare/${canonical}`);
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
      verdict: { margin, confidence: 50, headline: '', recommendation: '', evidence: [] }, // Confidence will be computed in computeComparisonMetrics
      performance: { sourcesQueried: ['Google Trends'] },
      category: { category: 'general' as const },
    };
    
    // Calculate continuous confidence for fallback case
    // Note: This will be overridden by computeComparisonMetrics with better data
    const fallbackConfidence = calculateComparisonConfidence(
      50, // agreementIndex (unknown in fallback)
      30, // volatility (estimate - will be computed properly)
      series.length, // dataPoints
      1, // sourceCount (only Google Trends)
      margin, // margin
      50 // leaderChangeRisk (estimated)
    ).score;
    
    verdictData = {
      winner,
      loser,
      winnerScore: Math.round(Math.max(aShare, bShare) * 100),
      loserScore: Math.round(Math.min(aShare, bShare) * 100),
      margin,
      confidence: fallbackConfidence,
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

  // OPTIMIZATION: Only load essential data for initial page load
  // Deep dive sections (forecast, geographic, AI insights) are lazy-loaded via API
  // This reduces initial TTFB from ~3s to <800ms
  
  // Load only lightweight, essential data in parallel
  const [peakEvents, trustStats] = await Promise.all([
    // Detect peaks (lightweight, cached)
    detectPeaksWithEvents(series as any[], actualTerms, 20).catch(error => {
      console.warn('[Peak Detection] Error detecting peaks:', error);
      return [];
    }),

    // Get trust statistics (lightweight DB query)
    prisma.forecastTrustStats.findUnique({
      where: { period: 'alltime' },
    }).catch(() => null),
  ]);

  // Generate real peak explanations using Peak Explanation Engine (with caching)
  let realPeakExplanations: { termA?: any; termB?: any } | null = null;
  try {
    const { explainPeakWithCache } = await import('@/lib/peak-explanation-engine');
    
    // Find top peak for each term
    const topPeakA = peakEvents
      .filter(p => p.term === actualTerms[0])
      .sort((a, b) => b.value - a.value)[0];
    
    const topPeakB = peakEvents
      .filter(p => p.term === actualTerms[1])
      .sort((a, b) => b.value - a.value)[0];

    const [peakExplanationA, peakExplanationB] = await Promise.all([
      topPeakA ? explainPeakWithCache({
        keywords: [actualTerms[0], actualTerms[0].replace(/-/g, ' ')],
        peakDate: topPeakA.date,
        peakValue: topPeakA.value,
        category: verdictData?.category || 'general',
        windowDays: 7,
        minRelevance: 25,
      }).catch(err => {
        console.warn('[Peak Explanation] Error for termA:', err);
        return null;
      }) : Promise.resolve(null),
      topPeakB ? explainPeakWithCache({
        keywords: [actualTerms[1], actualTerms[1].replace(/-/g, ' ')],
        peakDate: topPeakB.date,
        peakValue: topPeakB.value,
        category: verdictData?.category || 'general',
        windowDays: 7,
        minRelevance: 25,
      }).catch(err => {
        console.warn('[Peak Explanation] Error for termB:', err);
        return null;
      }) : Promise.resolve(null),
    ]);

    if (peakExplanationA || peakExplanationB) {
      realPeakExplanations = {
        termA: peakExplanationA,
        termB: peakExplanationB,
      };
    }
  } catch (error) {
    console.warn('[Peak Explanations] Error generating real peak explanations:', error);
  }

  // Deep dive sections will be loaded lazily via /api/comparison/deepdive-lazy
  // This includes: geographicData, aiInsights, forecastPack
  const geographicData = null; // Lazy-loaded
  const aiInsights = null; // Lazy-loaded
  const aiInsightsError = !process.env.ANTHROPIC_API_KEY ? 'API key not configured' : null;
  const forecastPack = null; // Lazy-loaded (only if guardrails pass)

  // Compute metrics and get snapshot for "since last check"
  const user = await getCurrentUser();
  
  // Increment anonymous comparison count (server-side tracking)
  // This happens after limit check passes, so we know they're allowed
  // Only increment if user is not authenticated
  if (!user) {
    await incrementAnonymousCount().catch(err => {
      console.error('[ComparePage] Error incrementing anonymous count:', err);
    });
  }
  
  const previousSnapshot = user
    ? await getLatestSnapshot(canonical || slug, timeframe || '12m', geo || '')
    : null;

  // Compute comparison metrics (this recalculates confidence from real data)
  const metrics = computeComparisonMetrics(
    series as any[],
    actualTerms[0],
    actualTerms[1],
    {
      winner: verdictData.winner,
      loser: verdictData.loser,
      winnerScore: verdictData.winnerScore,
      loserScore: verdictData.loserScore,
      margin: verdictData.margin,
      confidence: verdictData.confidence, // This will be recalculated in computeComparisonMetrics
    },
    intelligentComparison?.scores?.termA?.breakdown || {},
    intelligentComparison?.scores?.termB?.breakdown || {},
    previousSnapshot
  );

  // Update verdictData with the computed confidence (from real data)
  verdictData.confidence = metrics.confidence;

  // Prepare evidence cards
  const evidenceCards = prepareEvidenceCards(
    intelligentComparison?.scores?.termA?.breakdown || {},
    intelligentComparison?.scores?.termB?.breakdown || {},
    actualTerms[0],
    actualTerms[1]
  );

  // Note: Snapshot saving is now handled client-side by SnapshotSaver component
  // This ensures it happens after the page loads and data is ready

  // Prepare key insights from AI insights (lazy-loaded, so empty initially)
  const keyInsights: string[] = [];
  // aiInsights is lazy-loaded, so keyInsights will be populated by LazyDeepDive component

  // Check if user is tracking this comparison
  const isTracking = user ? await isComparisonSaved(canonical || slug) : false;

  // Build comparison-specific FAQs
  const comparisonFaqs = buildComparisonFaqs({
    termA: actualTerms[0],
    termB: actualTerms[1],
    winner: verdictData.winner,
    loser: verdictData.loser,
    topDrivers: metrics.topDrivers,
    agreementIndex: metrics.agreementIndex,
    disagreementFlag: metrics.disagreementFlag,
    stability: metrics.stability,
    volatility: metrics.volatility,
    gapChangePoints: metrics.gapChangePoints,
    series: series as any[],
    geoData: geographicData || undefined,
  });

  // Determine volatility level for actions
  const volatilityLevel: 'low' | 'medium' | 'high' =
    metrics.volatility < 20 ? 'low' : metrics.volatility < 40 ? 'medium' : 'high';

  // Check if forecast should be shown
  // forecastPack is lazy-loaded, so qualityFlags will be undefined initially
  const forecastGuardrail = shouldShowForecast({
    seriesLength: series.length,
    volatility: metrics.volatility,
    disagreementFlag: metrics.disagreementFlag,
    agreementIndex: metrics.agreementIndex,
    qualityFlags: undefined, // Will be computed inside getOrComputeForecastPack when lazy-loaded
  });

  // Old prediction system removed - using new forecasting system (ForecastSection) instead

  // Note: Category and AI insights are now saved automatically by getOrGenerateAIInsights()
  // Note: intelligentComparison and verdictData are now computed above, before AI insights

  return (
    <main className="mx-auto max-w-7xl space-y-6 sm:space-y-8 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-0">
      <BackButton label="Back to Home" />

      {/* Full-width sections - V2 Layout: What Changed, Verdict Hero, Key Insights, Trust, Evidence, Actions */}
      <div className="space-y-4 sm:space-y-6">
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
            </div>

            {/* Comparison Overview - Server-rendered narrative content */}
            <ComparisonOverview
              termA={actualTerms[0]}
              termB={actualTerms[1]}
              winner={verdictData.winner}
              loser={verdictData.loser}
              margin={verdictData.margin}
              confidence={metrics.confidence}
              timeframe={timeframe || '12m'}
              stability={metrics.stability}
              category={verdictData.category}
              currentSlug={canonical || slug}
            />

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
            
            {/* Save snapshot for logged-in users (client-side) */}
            {user && (
              <SnapshotSaver
                slug={canonical || slug}
                termA={actualTerms[0]}
                termB={actualTerms[1]}
                timeframe={timeframe || '12m'}
                geo={geo || ''}
                winner={verdictData.winner}
                marginPoints={metrics.marginPoints}
                confidence={metrics.confidence}
                volatility={metrics.volatility}
                agreementIndex={metrics.agreementIndex}
                winnerScore={verdictData.winnerScore}
                loserScore={verdictData.loserScore}
                category={verdictData.category}
                computedAt={new Date().toISOString()}
              />
            )}

            {/* Two-row Toolbar */}
            <TopActionsBar
              slug={canonical || slug}
              termA={actualTerms[0]}
              termB={actualTerms[1]}
              isLoggedIn={!!user}
              viewCount={(row as any).viewCount || 0}
              lastUpdatedAt={row.updatedAt.toISOString()}
            />
          </header>

          {/* Comparison Poll removed - wastes space above the fold */}

          {/* V2: What Changed Since Last Check (Above the fold) */}
          <WhatChanged
            gapChangePoints={metrics.gapChangePoints}
            confidenceChange={metrics.confidenceChange}
            agreementChange={metrics.agreementChange}
            volatilityDelta={metrics.volatilityDelta}
            hasHistory={!!previousSnapshot}
          />

          {/* V2: Verdict Hero Card (Above the fold - Single source of truth) */}
          <VerdictCardV2
            winner={verdictData.winner}
            loser={verdictData.loser}
            winnerScore={verdictData.winnerScore}
            loserScore={verdictData.loserScore}
            margin={verdictData.margin}
            confidence={metrics.confidence}
            stability={metrics.stability}
            volatility={metrics.volatility}
            agreementIndex={metrics.agreementIndex}
            topDrivers={metrics.topDrivers}
            riskFlags={metrics.riskFlags}
            gapChangePoints={metrics.gapChangePoints}
            termA={actualTerms[0]}
            termB={actualTerms[1]}
          />

          {/* Key Takeaways - Semantic H2 + bullets */}
          <KeyTakeaways
            winner={verdictData.winner}
            loser={verdictData.loser}
            margin={verdictData.margin}
            confidence={metrics.confidence}
            volatility={metrics.volatility}
            stability={metrics.stability}
            agreementIndex={metrics.agreementIndex}
          />

          {/* V2: Why you can trust this result (merged Key Insights + Trust) */}
          <TrustAndInsights
            insights={keyInsights}
            confidence={metrics.confidence}
            agreementIndex={metrics.agreementIndex}
            dataFreshness={{
              lastUpdatedAt: row.updatedAt.toISOString(),
              source: dataSources.join(', '),
            }}
          />

          {/* V2: Key Evidence Section (3 items max, expandable - Above the fold) */}
          {evidenceCards.length > 0 && (
            <KeyEvidenceSection
              evidence={evidenceCards}
              termA={actualTerms[0]}
              termB={actualTerms[1]}
            />
          )}

          {/* V2: What to Do Next (Above the fold) */}
          <WhatToDoNext
            slug={canonical || slug}
            termA={actualTerms[0]}
            termB={actualTerms[1]}
            isLoggedIn={!!user}
            isTracking={isTracking}
            volatility={volatilityLevel}
            confidence={metrics.confidence}
            gapChangePoints={metrics.gapChangePoints}
            disagreementFlag={metrics.disagreementFlag}
            agreementIndex={metrics.agreementIndex}
          />
      </div>

      {/* How to Interpret This Comparison - Plain-text section */}
      <HowToInterpret />

      {/* V2: Deep Dive Accordion (collapsed by default - Everything analytical goes here) */}
      <DeepDiveAccordion>
        {/* Score Over Time Chart */}
        <section className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="bg-gradient-to-r from-violet-50/80 via-purple-50/80 to-indigo-50/80 px-5 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-slate-200/60">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 flex items-center gap-2.5 mb-2">
                  <span className="w-2 h-6 sm:h-7 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full" />
                  Score Over Time
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

        {/* Lazy-loaded Deep Dive Sections (Forecast, Geographic, AI Insights) */}
        <LazyDeepDive
          slug={canonical || slug}
          termA={actualTerms[0]}
          termB={actualTerms[1]}
          timeframe={timeframe}
          geo={region}
          series={series as any[]}
          forecastGuardrail={forecastGuardrail}
          trustStats={trustStats ? {
            totalEvaluated: trustStats.totalEvaluated,
            winnerAccuracyPercent: trustStats.winnerAccuracyPercent,
            intervalCoveragePercent: trustStats.intervalCoveragePercent,
            last90DaysAccuracy: trustStats.last90DaysAccuracy,
            sampleSize: trustStats.sampleSize,
          } : null}
        />

        {/* Multi-Source Breakdown */}
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

        {/* Search Interest Breakdown */}
        {series && series.length >= 12 && (
          <SearchBreakdown
            termA={actualTerms[0]}
            termB={actualTerms[1]}
            series={series as any[]}
          />
        )}

        {/* Real Peak Explanations with Citations */}
        {realPeakExplanations && (realPeakExplanations.termA || realPeakExplanations.termB) && (
          <AIPeakExplanations
            peakExplanations={realPeakExplanations}
            termA={actualTerms[0]}
            termB={actualTerms[1]}
          />
        )}

        {/* Geographic Breakdown - now lazy-loaded via LazyDeepDive */}

        {/* Context behind sudden changes, Why This Comparison Matters, and Historical Timeline - now lazy-loaded via LazyDeepDive */}

        {/* FAQs */}
        <FAQSection comparisonFaqs={comparisonFaqs} />
      </DeepDiveAccordion>

      {/* Grid layout for sidebar - Additional content below Deep Dive */}
      <div className="grid gap-6 sm:gap-8 lg:grid-cols-12">
        {/* Main content column */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
          {/* Verified Predictions Panel */}
          {canonical && (
            <VerifiedPredictionsPanel
              slug={canonical}
              termA={actualTerms[0]}
              termB={actualTerms[1]}
            />
          )}
        </div>

        {/* Sidebar - Ads only (Related Comparisons removed to avoid duplication) */}
        <aside className="lg:col-span-4 space-y-5 sm:space-y-6">
          <div className="lg:sticky lg:top-6 space-y-5 sm:space-y-6">
            {/* AdSense - Sidebar */}
            {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                <AdSense
                  adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR}
                  adFormat="vertical"
                  fullWidthResponsive
                />
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Related Comparisons - Full width */}
      <RelatedComparisons
        currentSlug={canonical || slug}
        terms={actualTerms}
        category={intelligentComparison?.category?.category || row.category || null}
      />

      {/* Related Analysis - Blog posts that provide context (at the end) */}
      <RelatedAnalysis
        comparisonSlug={canonical || slug}
        comparisonTerms={actualTerms}
        comparisonCategory={intelligentComparison?.category?.category || row.category || null}
      />

      {/* AdSense - Bottom of Page */}
      {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && process.env.NEXT_PUBLIC_ADSENSE_SLOT_3 && (
        <div className="mt-6 sm:mt-8 flex justify-center">
          <AdSense
            adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_3}
            adFormat="horizontal"
            fullWidthResponsive
          />
        </div>
      )}

      {/* Structured Data for SEO */}
      <StructuredData
        termA={actualTerms[0]}
        termB={actualTerms[1]}
        slug={canonical}
        series={series as any[]}
        leader={aShare > bShare ? actualTerms[0] : actualTerms[1]}
        advantage={Math.round(Math.abs((aShare - bShare) * 100))}
      />

      {/* FAQ JSON-LD Schema - Server-rendered */}
      <FAQSchema comparisonFaqs={comparisonFaqs} />
    </main>
  );
}
