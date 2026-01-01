/**
 * GET /api/comparisons/export
 * 
 * Export endpoint with zero recomputation
 * 
 * Requirements:
 * - Exports must use stored InsightsPack + cached chart data
 * - JSON export: return InsightsPack directly
 * - CSV export: include raw series points, Signals, Interpretations, forecast points
 * - Ensure exports never trigger AI calls
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrBuildComparison } from '@/lib/getOrBuild';
import { fromSlug, toCanonicalSlug } from '@/lib/slug';
import { validateTopic } from '@/lib/validateTermsServer';
import { getInsightsPack } from '@/lib/insights/generate';
import { generateSignals } from '@/lib/insights/generate';
import { generateInterpretations } from '@/lib/insights/generate';
import { generateDecisionGuidance } from '@/lib/insights/generate';
import { runIntelligentComparison } from '@/lib/intelligent-comparison';
import { getCache } from '@/lib/cache';
import { createCacheKey } from '@/lib/cache/hash';
import { smoothSeries } from '@/lib/series';
import type { ForecastBundleSummary } from '@/lib/insights/contracts/forecast-bundle-summary';
import type { AIInsights } from '@/lib/insights/contracts/ai-insights';
import { computeComparisonMetrics } from '@/lib/comparison-metrics';
import { calculateVolatility } from '@/lib/comparison-metrics';
import { getCurrentUser } from '@/lib/user-auth-helpers';
import { recordExport } from '@/lib/dashboard-helpers';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Rate limiting: 10 exports per user per minute
const EXPORT_RATE_LIMIT_MS = 60 * 1000; // 1 minute
const EXPORT_RATE_LIMIT_COUNT = 10;

/**
 * Check if user can export (rate limit)
 */
async function checkExportRateLimit(userId: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  const oneMinuteAgo = new Date(Date.now() - EXPORT_RATE_LIMIT_MS);
  const recentExports = await prisma.exportHistory.count({
    where: {
      userId,
      createdAt: {
        gte: oneMinuteAgo,
      },
    },
  });

  if (recentExports >= EXPORT_RATE_LIMIT_COUNT) {
    // Find oldest export in the window
    const oldestExport = await prisma.exportHistory.findFirst({
      where: {
        userId,
        createdAt: {
          gte: oneMinuteAgo,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (oldestExport) {
      const retryAfter = Math.ceil((EXPORT_RATE_LIMIT_MS - (Date.now() - oldestExport.createdAt.getTime())) / 1000);
      return { allowed: false, retryAfter };
    }
  }

  return { allowed: true };
}

function isValidTopic(
  r: ReturnType<typeof validateTopic>,
): r is { ok: true; term: string } {
  return r.ok;
}

export async function GET(request: NextRequest) {
  try {
    // Get user for rate limiting (optional - exports work for anonymous too)
    const user = await getCurrentUser();
    const userId = user ? (user as any).id : null;

    // Check rate limit (only for authenticated users)
    if (userId) {
      const rateLimitCheck = await checkExportRateLimit(userId);
      if (!rateLimitCheck.allowed) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded. Please wait before exporting again.',
            retryAfter: rateLimitCheck.retryAfter,
          },
          { status: 429 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const format = searchParams.get('format') || 'json'; // 'json' or 'csv'
    const timeframe = searchParams.get('timeframe') || '12m';
    const geo = searchParams.get('geo') || '';

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      );
    }

    if (!['json', 'csv'].includes(format)) {
      return NextResponse.json(
        { error: 'Format must be "json" or "csv"' },
        { status: 400 }
      );
    }

    // Validate and normalize slug
    const raw = fromSlug(slug);
    const checked = raw.map(validateTopic);
    const valid = checked.filter(isValidTopic);
    
    if (valid.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid slug format' },
        { status: 400 }
      );
    }

    const terms = valid.map((c) => c.term);
    const canonical = toCanonicalSlug(terms);
    
    if (!canonical || canonical !== slug) {
      return NextResponse.json(
        { error: 'Invalid slug format' },
        { status: 400 }
      );
    }

    const termA = terms[0];
    const termB = terms[1];

    // Get comparison data (cached, no recomputation)
    const row = await getOrBuildComparison({
      slug: canonical,
      terms,
      timeframe,
      geo,
    });

    if (!row || !Array.isArray(row.series) || row.series.length === 0) {
      return NextResponse.json(
        { error: 'Comparison data not found' },
        { status: 404 }
      );
    }

    const series = smoothSeries(row.series as any[], 4);

    // Get intelligent comparison for scores (cached, no recomputation)
    let intelligentComparison: any = null;
    try {
      intelligentComparison = await runIntelligentComparison(
        terms,
        series,
        {
          enableYouTube: !!process.env.YOUTUBE_API_KEY,
          enableTMDB: !!process.env.TMDB_API_KEY,
          enableBestBuy: !!process.env.BESTBUY_API_KEY,
          enableSpotify: !!process.env.SPOTIFY_CLIENT_ID,
          enableSteam: !!process.env.STEAM_API_KEY,
          cachedCategory: row.category || null,
        }
      );
    } catch (error) {
      console.warn('[Export] Could not fetch intelligent comparison data:', error);
    }

    const scores = intelligentComparison ? {
      termA: intelligentComparison.scores.termA,
      termB: intelligentComparison.scores.termB,
    } : {
      termA: { overall: 50, breakdown: { searchInterest: 50, socialBuzz: 50, authority: 50, momentum: 50 }, confidence: 50, sources: [], explanation: '' },
      termB: { overall: 50, breakdown: { searchInterest: 50, socialBuzz: 50, authority: 50, momentum: 50 }, confidence: 50, sources: [], explanation: '' },
    };

    // Generate signals and interpretations (deterministic, fast, no AI)
    const signals = generateSignals({
      termA,
      termB,
      timeframe,
      series,
      scores,
      dataSource: 'google-trends',
      lastUpdatedAt: row.updatedAt.toISOString(),
    });

    const interpretations = generateInterpretations({
      termA,
      termB,
      signals,
      scores: {
        termA: { overall: scores.termA.overall, breakdown: scores.termA.breakdown },
        termB: { overall: scores.termB.overall, breakdown: scores.termB.breakdown },
      },
      seriesLength: series.length,
      dataSource: 'google-trends',
      lastUpdatedAt: row.updatedAt.toISOString(),
    });

    const decisionGuidance = generateDecisionGuidance({
      termA,
      termB,
      signals,
      interpretations,
      scores: {
        termA: { overall: scores.termA.overall, breakdown: { momentum: scores.termA.breakdown.momentum } },
        termB: { overall: scores.termB.overall, breakdown: { momentum: scores.termB.breakdown.momentum } },
      },
      dataSource: 'google-trends',
      lastUpdatedAt: row.updatedAt.toISOString(),
    });

    // Try to load cached forecasts and AI insights (read-only, no generation)
    const cache = getCache();
    const forecastKeyA = createCacheKey('forecast', canonical, termA, timeframe);
    const forecastKeyB = createCacheKey('forecast', canonical, termB, timeframe);
    const aiInsightsKey = createCacheKey('ai-insights', canonical, timeframe);
    
    const [cachedForecastA, cachedForecastB, cachedAIInsights] = await Promise.all([
      cache.get<ForecastBundleSummary>(forecastKeyA),
      cache.get<ForecastBundleSummary>(forecastKeyB),
      cache.get<AIInsights>(aiInsightsKey),
    ]);

    // Get InsightsPack (read-only, no AI generation)
    const insightsPackResult = await getInsightsPack({
      slug: canonical,
      termA,
      termB,
      timeframe,
      geo,
      category: row.category || undefined,
      series,
      signals,
      interpretations,
      scores: {
        termA: { overall: scores.termA.overall, breakdown: { momentum: scores.termA.breakdown.momentum } },
        termB: { overall: scores.termB.overall, breakdown: { momentum: scores.termB.breakdown.momentum } },
      },
      decisionGuidance: {
        marketer: decisionGuidance.marketer,
        founder: decisionGuidance.founder,
      },
      forecasts: {
        termA: cachedForecastA || undefined,
        termB: cachedForecastB || undefined,
      },
      peaks: {
        termA: [],
        termB: [],
      },
      aiInsights: cachedAIInsights || undefined,
      dataSource: 'google-trends',
      lastUpdatedAt: row.updatedAt.toISOString(),
    });

    const insightsPack = insightsPackResult.pack;

    // Generate filename
    const formatTerm = (term: string) => term.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const filename = `${formatTerm(termA)}-vs-${formatTerm(termB)}-Trend-Data-${timeframe}${geo ? `-${geo}` : ''}`;

    // userId already fetched at the top of the function

    if (format === 'json') {
      // JSON export: return InsightsPack directly
      const jsonString = JSON.stringify(insightsPack, null, 2);
      const jsonBuffer = Buffer.from(jsonString, 'utf-8');

      // Record export in history (async, don't wait)
      if (userId) {
        recordExport({
          userId,
          slug: canonical,
          termA,
          termB,
          type: 'json',
          timeframe,
          geo,
          fileSize: jsonBuffer.length,
        }).catch(err => console.error('[Export] Error recording JSON export:', err));
      }

      return NextResponse.json(insightsPack, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        },
      });
    } else if (format === 'csv') {
      // CSV export V2: Analysis-ready format with derived metrics
      const csvRows: string[] = [];

      // Compute metrics for derived values
      const metrics = intelligentComparison ? computeComparisonMetrics(
        series,
        termA,
        termB,
        {
          winner: intelligentComparison.verdict.winner,
          loser: intelligentComparison.verdict.winner === termA ? termB : termA,
          winnerScore: Math.max(intelligentComparison.scores.termA.overall, intelligentComparison.scores.termB.overall),
          loserScore: Math.min(intelligentComparison.scores.termA.overall, intelligentComparison.scores.termB.overall),
          margin: intelligentComparison.verdict.margin,
          confidence: intelligentComparison.verdict.confidence,
        },
        intelligentComparison.scores.termA.breakdown,
        intelligentComparison.scores.termB.breakdown,
        null
      ) : null;

      // Metadata Header Section
      csvRows.push('=== METADATA ===');
      csvRows.push('Field,Value');
      csvRows.push(`exportVersion,2.0`);
      csvRows.push(`modelVersion,TrendArc v1.0`);
      csvRows.push(`computedAt,${new Date().toISOString()}`);
      csvRows.push(`dataFreshness,${row.updatedAt.toISOString()}`);
      csvRows.push(`region,${geo || 'Worldwide'}`);
      csvRows.push(`timeframe,${timeframe}`);
      csvRows.push(`termA,${termA}`);
      csvRows.push(`termB,${termB}`);
      csvRows.push(`comparison,${formatTerm(termA)} vs ${formatTerm(termB)}`);
      csvRows.push(`sources,${intelligentComparison?.performance?.sourcesQueried?.join('; ') || 'Google Trends'}`);
      csvRows.push('');

      // Summary Section
      csvRows.push('=== SUMMARY ===');
      csvRows.push('Metric,TermA,TermB');
      if (intelligentComparison) {
        csvRows.push(`Overall Score,${intelligentComparison.scores.termA.overall.toFixed(2)},${intelligentComparison.scores.termB.overall.toFixed(2)}`);
        csvRows.push(`Search Interest,${intelligentComparison.scores.termA.breakdown.searchInterest.toFixed(2)},${intelligentComparison.scores.termB.breakdown.searchInterest.toFixed(2)}`);
        csvRows.push(`Social Buzz,${intelligentComparison.scores.termA.breakdown.socialBuzz.toFixed(2)},${intelligentComparison.scores.termB.breakdown.socialBuzz.toFixed(2)}`);
        csvRows.push(`Authority,${intelligentComparison.scores.termA.breakdown.authority.toFixed(2)},${intelligentComparison.scores.termB.breakdown.authority.toFixed(2)}`);
        csvRows.push(`Momentum,${intelligentComparison.scores.termA.breakdown.momentum.toFixed(2)},${intelligentComparison.scores.termB.breakdown.momentum.toFixed(2)}`);
        csvRows.push(`Confidence,${intelligentComparison.verdict.confidence},${intelligentComparison.verdict.confidence}`);
        if (metrics) {
          csvRows.push(`Volatility,${metrics.volatility.toFixed(2)},${metrics.volatility.toFixed(2)}`);
          csvRows.push(`Agreement Index,${metrics.agreementIndex.toFixed(2)},${metrics.agreementIndex.toFixed(2)}`);
          csvRows.push(`Stability,${metrics.stability},${metrics.stability}`);
        }
      }
      csvRows.push('');

      // Time Series with Derived Metrics
      csvRows.push('=== TIME SERIES ===');
      csvRows.push('Date,TermA_Raw,TermB_Raw,TermA_Normalized,TermB_Normalized,Momentum_A,Momentum_B,RollingAvg_A_7d,RollingAvg_B_7d,Volatility_A,Volatility_B,Gap,Confidence');
      
      // Calculate rolling averages and momentum
      const windowSize = 7;
      for (let i = 0; i < series.length; i++) {
        const point = series[i];
        const date = point.date || '';
        const valueA = Number(point[termA] || 0);
        const valueB = Number(point[termB] || 0);
        
        // Normalize to 0-100 scale (assuming max is 100)
        const normalizedA = valueA;
        const normalizedB = valueB;
        
        // Calculate momentum (change from previous point)
        const prevA = i > 0 ? Number(series[i - 1][termA] || 0) : valueA;
        const prevB = i > 0 ? Number(series[i - 1][termB] || 0) : valueB;
        const momentumA = valueA - prevA;
        const momentumB = valueB - prevB;
        
        // Calculate rolling average (7-day window)
        const windowStart = Math.max(0, i - windowSize + 1);
        const windowData = series.slice(windowStart, i + 1);
        const rollingAvgA = windowData.reduce((sum, p) => sum + Number(p[termA] || 0), 0) / windowData.length;
        const rollingAvgB = windowData.reduce((sum, p) => sum + Number(p[termB] || 0), 0) / windowData.length;
        
        // Calculate volatility (rolling std dev over window)
        const varianceA = windowData.reduce((sum, p) => {
          const val = Number(p[termA] || 0);
          return sum + Math.pow(val - rollingAvgA, 2);
        }, 0) / windowData.length;
        const varianceB = windowData.reduce((sum, p) => {
          const val = Number(p[termB] || 0);
          return sum + Math.pow(val - rollingAvgB, 2);
        }, 0) / windowData.length;
        const volatilityA = Math.sqrt(varianceA);
        const volatilityB = Math.sqrt(varianceB);
        
        // Gap and confidence
        const gap = Math.abs(valueA - valueB);
        const confidence = intelligentComparison?.verdict?.confidence || 0;
        
        csvRows.push(`${date},${valueA.toFixed(2)},${valueB.toFixed(2)},${normalizedA.toFixed(2)},${normalizedB.toFixed(2)},${momentumA.toFixed(2)},${momentumB.toFixed(2)},${rollingAvgA.toFixed(2)},${rollingAvgB.toFixed(2)},${volatilityA.toFixed(2)},${volatilityB.toFixed(2)},${gap.toFixed(2)},${confidence}`);
      }
      csvRows.push('');

      // Source Breakdown (if available)
      if (intelligentComparison) {
        csvRows.push('=== SOURCE BREAKDOWN ===');
        csvRows.push('Source,TermA_Value,TermB_Value,Difference,Leader');
        const sources = [
          { name: 'Search Interest', termA: intelligentComparison.scores.termA.breakdown.searchInterest, termB: intelligentComparison.scores.termB.breakdown.searchInterest },
          { name: 'Social Buzz', termA: intelligentComparison.scores.termA.breakdown.socialBuzz, termB: intelligentComparison.scores.termB.breakdown.socialBuzz },
          { name: 'Authority', termA: intelligentComparison.scores.termA.breakdown.authority, termB: intelligentComparison.scores.termB.breakdown.authority },
          { name: 'Momentum', termA: intelligentComparison.scores.termA.breakdown.momentum, termB: intelligentComparison.scores.termB.breakdown.momentum },
        ];
        for (const source of sources) {
          const diff = source.termA - source.termB;
          const leader = diff > 0 ? termA : diff < 0 ? termB : 'Tie';
          csvRows.push(`${source.name},${source.termA.toFixed(2)},${source.termB.toFixed(2)},${diff.toFixed(2)},${leader}`);
        }
        csvRows.push('');
      }

      // Signals
      if (signals.length > 0) {
        csvRows.push('=== SIGNALS ===');
        csvRows.push('Type,Severity,Term,Description,Confidence');
        for (const signal of signals) {
          csvRows.push(`${signal.type},${signal.severity},${signal.term || 'both'},"${signal.description || ''}",${signal.confidence || 0}`);
        }
        csvRows.push('');
      }

      // Interpretations
      if (insightsPack.interpretations.length > 0) {
        csvRows.push('=== INTERPRETATIONS ===');
        csvRows.push('Category,Term,Confidence,Text,Evidence');
        for (const interpretation of insightsPack.interpretations) {
          const evidence = interpretation.evidence?.join('; ') || '';
          csvRows.push(`${interpretation.category},${interpretation.term},${interpretation.confidence},"${interpretation.text || ''}","${evidence}"`);
        }
        csvRows.push('');
      }

      // Forecast Points
      if (insightsPack.forecasts.termA || insightsPack.forecasts.termB) {
        csvRows.push('=== FORECAST POINTS ===');
        csvRows.push('Term,Period,Date,Value,LowerBound,UpperBound,Confidence');
        
        if (insightsPack.forecasts.termA) {
          const forecastA = insightsPack.forecasts.termA;
          for (const point of forecastA.forecast14Day.keyPoints) {
            csvRows.push(`${termA},14-day,${point.date},${point.value},${point.lowerBound},${point.upperBound},${point.confidence}`);
          }
          for (const point of forecastA.forecast30Day.keyPoints) {
            csvRows.push(`${termA},30-day,${point.date},${point.value},${point.lowerBound},${point.upperBound},${point.confidence}`);
          }
        }
        
        if (insightsPack.forecasts.termB) {
          const forecastB = insightsPack.forecasts.termB;
          for (const point of forecastB.forecast14Day.keyPoints) {
            csvRows.push(`${termB},14-day,${point.date},${point.value},${point.lowerBound},${point.upperBound},${point.confidence}`);
          }
          for (const point of forecastB.forecast30Day.keyPoints) {
            csvRows.push(`${termB},30-day,${point.date},${point.value},${point.lowerBound},${point.upperBound},${point.confidence}`);
          }
        }
        csvRows.push('');
      }

      const csv = csvRows.join('\n');
      const csvBuffer = Buffer.from(csv, 'utf-8');

      // Record export in history (async, don't wait)
      if (userId) {
        recordExport({
          userId,
          slug: canonical,
          termA,
          termB,
          type: 'csv',
          timeframe,
          geo,
          fileSize: csvBuffer.length,
        }).catch(err => console.error('[Export] Error recording CSV export:', err));
      }

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid format' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Export] Error:', error);
    return NextResponse.json(
      { error: 'Failed to export comparison data' },
      { status: 500 }
    );
  }
}
