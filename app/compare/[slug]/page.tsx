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
import TopThisWeekServer from "@/components/TopThisWeekServer";
import { validateTopic } from "@/lib/validateTermsServer";
import RelatedComparisons from "@/components/RelatedComparisons";
import AdSense from "@/components/AdSense";
import SocialShareButtons from "@/components/SocialShareButtons";
import PDFDownloadButton from "@/components/PDFDownloadButton";
import DataExportButton from "@/components/DataExportButton";
import SaveComparisonButton from "@/components/SaveComparisonButton";
import CreateAlertButton from "@/components/CreateAlertButton";
import ComparisonHistoryTracker from "@/components/ComparisonHistoryTracker";
import DailyLimitStatus from "@/components/DailyLimitStatus";
import StructuredData from "@/components/StructuredData";
import GeographicBreakdown from "@/components/GeographicBreakdown";
import { getGeographicBreakdown } from "@/lib/getGeographicData";
import { prepareInsightData, getOrGenerateAIInsights } from "@/lib/aiInsightsGenerator";
import AIKeyInsights from "@/components/AI/AIKeyInsights";
import AIPeakExplanations from "@/components/AI/AIPeakExplanations";
import AIPrediction from "@/components/AI/AIPrediction";
import AIPracticalImplications from "@/components/AI/AIPracticalImplications";
import { canAccessPremium } from "@/lib/user-auth-helpers";
import ComparisonVerdict from "@/components/ComparisonVerdict";
import HistoricalTimeline from "@/components/HistoricalTimeline";
import SearchBreakdown from "@/components/SearchBreakdown";
import PeakEventCitations from "@/components/PeakEventCitations";
import ComparisonPoll from "@/components/ComparisonPoll";
import KeyMetricsDashboard from "@/components/KeyMetricsDashboard";
import ActionableInsightsPanel from "@/components/ActionableInsightsPanel";
import TrendPrediction from "@/components/TrendPrediction";
import SimplePrediction from "@/components/SimplePrediction";
import PredictionAccuracyBadge from "@/components/PredictionAccuracyBadge";
import { predictTrend } from "@/lib/prediction-engine-enhanced";
import { getMaxHistoricalData } from "@/lib/get-max-historical-data";
import { savePrediction, verifyPredictions } from "@/lib/prediction-tracking-enhanced";
import VerifiedPredictionsPanel from "@/components/VerifiedPredictionsPanel";
import { getDaysToStore, samplePredictions, getStorageStats } from "@/lib/prediction-sampling";
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

  // Check premium access early to enforce timeframe restrictions
  const hasPremiumAccess = await canAccessPremium();
  
  // Enforce timeframe restrictions for free users (only 12m allowed)
  let timeframe = tf ?? "12m";
  if (!hasPremiumAccess && timeframe !== "12m") {
    // Free users trying to access premium timeframe - redirect to 12m
    const q = new URLSearchParams();
    q.set("tf", "12m");
    if (geo) q.set("geo", geo);
    redirect(`/compare/${canonical}?${q.toString()}`);
  }
  
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
      performance: { sourcesQueried: ['Google Trends'] },
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
  // Note: hasPremiumAccess is already checked earlier for timeframe enforcement
  const [geographicData, aiInsights, aiInsightsError, peakEvents] = await Promise.all([
    // Get geographic breakdown (FREE - no API costs)
    getGeographicBreakdown(actualTerms[0], actualTerms[1], series as any[]),

    // Get or generate AI insights with smart caching (cost-optimized)
    // NOW INCLUDES MULTI-SOURCE DATA!
    // PREMIUM ONLY: Rich AI insights
    (async () => {
      if (!hasPremiumAccess) {
        return null; // Free users don't get rich AI insights
      }

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
      if (!hasPremiumAccess) {
        return 'Premium subscription required';
      }
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
  ]);

  // Generate trend predictions - PREMIUM ONLY
  // Free users get simple predictions
  let predictionsA: any = null;
  let predictionsB: any = null;
  let simplePredictionA: any = null;
  let simplePredictionB: any = null;
  let maxHistoricalSeries: any[] = []; // Declare outside try block for scope
  
  if (hasPremiumAccess) {
    // Premium: Full predictions with 5-year data
    try {
      console.log('[Predictions] 🔮 Generating premium predictions with maximum historical data...');
      
      // Fetch maximum historical data (5 years if available) for predictions
      maxHistoricalSeries = await getMaxHistoricalData(actualTerms, region || '');
      
      if (maxHistoricalSeries.length < 7) {
        console.warn('[Predictions] ⚠️ Insufficient historical data for predictions, using current series');
        const fallbackSeries = series as any[];
        [predictionsA, predictionsB] = await Promise.all([
          predictTrend({
            series: fallbackSeries,
            term: actualTerms[0],
            forecastDays: 30,
            methods: ['all'],
            category: intelligentComparison?.category?.category || 'general',
            useTrendArcScore: true, // Use TrendArc Score for better accuracy
          }).catch(err => {
            console.warn('[Predictions] Error predicting termA:', err);
            return null;
          }),
          predictTrend({
            series: fallbackSeries,
            term: actualTerms[1],
            forecastDays: 30,
            methods: ['all'],
            category: intelligentComparison?.category?.category || 'general',
            useTrendArcScore: true, // Use TrendArc Score for better accuracy
          }).catch(err => {
            console.warn('[Predictions] Error predicting termB:', err);
            return null;
          }),
        ]);
      } else {
        console.log(`[Predictions] ✅ Using ${maxHistoricalSeries.length} data points (${maxHistoricalSeries.length > 200 ? '5 years' : '1 year'}) for predictions`);
        
        [predictionsA, predictionsB] = await Promise.all([
          predictTrend({
            series: maxHistoricalSeries as any[],
            term: actualTerms[0],
            forecastDays: 30,
            methods: ['all'],
            category: intelligentComparison?.category?.category || 'general',
            useTrendArcScore: true, // Use TrendArc Score for better accuracy
          }).catch(err => {
            console.warn('[Predictions] Error predicting termA:', err);
            return null;
          }),
          predictTrend({
            series: maxHistoricalSeries as any[],
            term: actualTerms[1],
            forecastDays: 30,
            methods: ['all'],
            category: intelligentComparison?.category?.category || 'general',
            useTrendArcScore: true, // Use TrendArc Score for better accuracy
          }).catch(err => {
            console.warn('[Predictions] Error predicting termB:', err);
            return null;
          }),
        ]);
        
        // Verify old predictions (background task, don't wait)
        if (canonical) {
          Promise.all([
            verifyPredictions(canonical, actualTerms[0], maxHistoricalSeries as any[]),
            verifyPredictions(canonical, actualTerms[1], maxHistoricalSeries as any[]),
          ]).then(([resultA, resultB]) => {
            const totalVerified = resultA.verified + resultB.verified;
            if (totalVerified > 0) {
              console.log(`[PredictionTracking] ✅ Verified ${totalVerified} predictions (${resultA.verified} for ${actualTerms[0]}, ${resultB.verified} for ${actualTerms[1]})`);
              if (resultA.newlyVerified.length > 0 || resultB.newlyVerified.length > 0) {
                console.log(`[PredictionTracking] 📊 Newly verified predictions are now available for users to view`);
              }
            }
          }).catch(err => console.warn('[PredictionTracking] Verification failed:', err));
        }
      }
      
      console.log('[Predictions] ✅ Premium predictions generated:', {
        termA: predictionsA ? `✓ (${predictionsA.predictions?.length || 0} predictions)` : '✗',
        termB: predictionsB ? `✓ (${predictionsB.predictions?.length || 0} predictions)` : '✗',
        dataPoints: maxHistoricalSeries.length,
        slug: canonical || 'MISSING',
      });
      
      // Smart sampling: Store only key milestones instead of all 30 days
      const forecastDays = predictionsA?.forecastPeriod || predictionsB?.forecastPeriod || 30;
      const daysToStore = getDaysToStore(forecastDays, 'smart');
      const storageStats = getStorageStats(forecastDays, 'smart');
      
      console.log(`[Predictions] 📊 Storage optimization: Storing ${storageStats.storedDays} key milestones instead of ${storageStats.totalDays} days (${storageStats.reduction}% reduction)`);
      
      const historicalDataForDate = maxHistoricalSeries.length > 0 ? maxHistoricalSeries : series;
      const lastHistoricalDate = historicalDataForDate.length > 0 
        ? new Date(historicalDataForDate[historicalDataForDate.length - 1].date)
        : new Date();
      
      // Save only sampled predictions
      if (predictionsA && predictionsA.predictions.length > 0 && canonical) {
        const sampledPredictionsA = samplePredictions(
          predictionsA.predictions,
          daysToStore,
          lastHistoricalDate
        );
        
        console.log(`[Predictions] 💾 Saving ${sampledPredictionsA.length} key predictions (out of ${predictionsA.predictions.length} total) for ${actualTerms[0]}...`);
        const savePromisesA = sampledPredictionsA.map((pred: any) => 
          savePrediction({
            slug: canonical,
            term: actualTerms[0],
            forecastDate: pred.date,
            predictedValue: pred.value,
            confidence: pred.confidence,
            method: predictionsA.methods.join('+'),
          })
        );
        const savedA = await Promise.allSettled(savePromisesA);
        const successA = savedA.filter(r => r.status === 'fulfilled').length;
        console.log(`[Predictions] ✅ Saved ${successA}/${sampledPredictionsA.length} key predictions for ${actualTerms[0]}`);
      }
      
      if (predictionsB && predictionsB.predictions.length > 0 && canonical) {
        const sampledPredictionsB = samplePredictions(
          predictionsB.predictions,
          daysToStore,
          lastHistoricalDate
        );
        
        console.log(`[Predictions] 💾 Saving ${sampledPredictionsB.length} key predictions (out of ${predictionsB.predictions.length} total) for ${actualTerms[1]}...`);
        const savePromisesB = sampledPredictionsB.map((pred: any) => 
          savePrediction({
            slug: canonical,
            term: actualTerms[1],
            forecastDate: pred.date,
            predictedValue: pred.value,
            confidence: pred.confidence,
            method: predictionsB.methods.join('+'),
          })
        );
        const savedB = await Promise.allSettled(savePromisesB);
        const successB = savedB.filter(r => r.status === 'fulfilled').length;
        console.log(`[Predictions] ✅ Saved ${successB}/${sampledPredictionsB.length} key predictions for ${actualTerms[1]}`);
      }
    } catch (error) {
      console.error('[Predictions] ❌ Error generating premium predictions:', error);
    }
  } else {
    // Free: Simple predictions only
    try {
      const { generateSimplePrediction } = await import('@/lib/simple-prediction');
      simplePredictionA = generateSimplePrediction(series as any[], actualTerms[0]);
      simplePredictionB = generateSimplePrediction(series as any[], actualTerms[1]);
      console.log('[Predictions] ✅ Simple predictions generated for free user');
    } catch (error) {
      console.error('[Predictions] ❌ Error generating simple predictions:', error);
    }
  }

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

            {/* Daily Limit Status (Free Users) */}
            <DailyLimitStatus />

            {/* Track comparison view in history */}
            <ComparisonHistoryTracker
              slug={canonical || slug}
              termA={actualTerms[0]}
              termB={actualTerms[1]}
              timeframe={timeframe || '12m'}
              geo={geo || ''}
            />

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
                    isPremium={hasPremiumAccess}
                  />
                  <DataExportButton
                    slug={canonical || slug}
                    termA={actualTerms[0]}
                    termB={actualTerms[1]}
                    timeframe={timeframe || '12m'}
                    geo={geo || ''}
                    hasPremiumAccess={hasPremiumAccess}
                  />
                  <PDFDownloadButton
                    slug={canonical || slug}
                    timeframe={timeframe || '12m'}
                    geo={geo || ''}
                    termA={actualTerms[0]}
                    termB={actualTerms[1]}
                    hasPremiumAccess={hasPremiumAccess}
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
          {!aiInsights && aiInsightsError === 'Premium subscription required' && (
            <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl sm:rounded-2xl border-2 border-purple-300 shadow-xl p-4 sm:p-6 print:hidden">
              <div className="flex flex-col items-start gap-4">
                <div className="flex items-start gap-3 sm:gap-4 w-full">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                      Unlock Rich AI Insights
                      <span className="text-xs font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full">PREMIUM</span>
                    </h3>
                    <p className="text-slate-700 text-sm sm:text-base mb-4">
                      Get advanced AI-powered analysis with category detection, trend predictions, and actionable insights for just <strong>$4.99/month</strong>
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 w-full">
                  <div className="bg-white/80 backdrop-blur rounded-lg p-3 border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-2 text-sm flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Category Analysis
                    </h4>
                    <p className="text-xs text-slate-600">Automatic categorization and domain-specific insights</p>
                  </div>
                  <div className="bg-white/80 backdrop-blur rounded-lg p-3 border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-2 text-sm flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Trend Predictions
                    </h4>
                    <p className="text-xs text-slate-600">AI-powered forecasts based on historical patterns</p>
                  </div>
                  <div className="bg-white/80 backdrop-blur rounded-lg p-3 border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-2 text-sm flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Practical Implications
                    </h4>
                    <p className="text-xs text-slate-600">Actionable insights for your specific use case</p>
                  </div>
                  <div className="bg-white/80 backdrop-blur rounded-lg p-3 border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-2 text-sm flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Peak Explanations
                    </h4>
                    <p className="text-xs text-slate-600">Understand why trends spike at specific times</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
                  <a
                    href="/pricing"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl text-center"
                  >
                    Upgrade to Premium
                  </a>
                  <a
                    href="/signup"
                    className="px-6 py-3 bg-white text-purple-700 font-semibold rounded-lg hover:bg-purple-50 transition-colors border-2 border-purple-300 text-center"
                  >
                    Sign Up Free
                  </a>
                </div>
              </div>
            </div>
          )}
          {!aiInsights && aiInsightsError !== 'Premium subscription required' && aiInsightsError && (
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

          {/* Trend Prediction - Premium: Full predictions, Free: Simple predictions */}
          {hasPremiumAccess && (predictionsA || predictionsB) && (
            <>
              <PredictionAccuracyBadge
                slug={canonical || ''}
                termA={actualTerms[0]}
                termB={actualTerms[1]}
              />
              <TrendPrediction
                termA={actualTerms[0]}
                termB={actualTerms[1]}
                series={series as any[]}
                predictionsA={predictionsA}
                predictionsB={predictionsB}
                historicalDataPoints={(maxHistoricalSeries && maxHistoricalSeries.length > 0) ? maxHistoricalSeries.length : series.length}
                category={verdictData.category as any}
              />
            </>
          )}
          
          {!hasPremiumAccess && (simplePredictionA || simplePredictionB) && (
            <SimplePrediction
              termA={actualTerms[0]}
              termB={actualTerms[1]}
              predictionA={simplePredictionA}
              predictionB={simplePredictionB}
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
          {geographicData && geographicData.countries && geographicData.countries.length > 0 && (
            <GeographicBreakdown
              termA={actualTerms[0]}
              termB={actualTerms[1]}
              data={geographicData}
            />
          )}

          {/* Related Comparisons */}
          <RelatedComparisons
            slug={canonical || slug}
            termA={actualTerms[0]}
            termB={actualTerms[1]}
            category={verdictData.category}
          />

          {/* FAQ Section */}
          <FAQSection
            termA={actualTerms[0]}
            termB={actualTerms[1]}
          />
        </div>

        {/* Sidebar - Trending Comparisons & Ads */}
        <aside className="lg:col-span-4 space-y-5 sm:space-y-6">
          <div className="lg:sticky lg:top-6 space-y-5 sm:space-y-6">
            {/* Trending Comparisons */}
            <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <TopThisWeekServer />
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
