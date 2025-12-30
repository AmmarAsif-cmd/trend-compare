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

export const dynamic = 'force-dynamic';

function isValidTopic(
  r: ReturnType<typeof validateTopic>,
): r is { ok: true; term: string } {
  return r.ok;
}

export async function GET(request: NextRequest) {
  try {
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

    if (format === 'json') {
      // JSON export: return InsightsPack directly
      return NextResponse.json(insightsPack, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        },
      });
    } else if (format === 'csv') {
      // CSV export: include raw series points, Signals, Interpretations, forecast points
      const csvRows: string[] = [];

      // Header
      csvRows.push('TrendArc Comparison Export');
      csvRows.push(`Comparison: ${formatTerm(termA)} vs ${formatTerm(termB)}`);
      csvRows.push(`Timeframe: ${timeframe}, Geo: ${geo || 'Worldwide'}`);
      csvRows.push(`Exported: ${new Date().toISOString()}`);
      csvRows.push('');

      // Raw Series Points
      csvRows.push('=== Raw Series Points ===');
      csvRows.push('Date,' + [termA, termB].map(t => `"${formatTerm(t)}"`).join(','));
      for (const point of series) {
        const date = point.date || '';
        const valueA = Number(point[termA] || 0);
        const valueB = Number(point[termB] || 0);
        csvRows.push(`${date},${valueA},${valueB}`);
      }
      csvRows.push('');

      // Signals
      csvRows.push('=== Signals ===');
      csvRows.push('Type,Severity,Term,Description,Confidence');
      for (const signal of signals) {
        csvRows.push(`${signal.type},${signal.severity},${signal.term || 'both'},"${signal.description || ''}",${signal.confidence || 0}`);
      }
      csvRows.push('');

      // Interpretations
      csvRows.push('=== Interpretations ===');
      csvRows.push('Category,Term,Confidence,Text,Evidence');
      for (const interpretation of insightsPack.interpretations) {
        const evidence = interpretation.evidence?.join('; ') || '';
        csvRows.push(`${interpretation.category},${interpretation.term},${interpretation.confidence},"${interpretation.text || ''}","${evidence}"`);
      }
      csvRows.push('');

      // Forecast Points
      if (insightsPack.forecasts.termA || insightsPack.forecasts.termB) {
        csvRows.push('=== Forecast Points ===');
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

      // Summary Statistics
      csvRows.push('=== Summary Statistics ===');
      csvRows.push(`Term,Overall Score,Search Interest,Social Buzz,Authority,Momentum`);
      csvRows.push(`${termA},${scores.termA.overall},${scores.termA.breakdown.searchInterest},${scores.termA.breakdown.socialBuzz},${scores.termA.breakdown.authority},${scores.termA.breakdown.momentum}`);
      csvRows.push(`${termB},${scores.termB.overall},${scores.termB.breakdown.searchInterest},${scores.termB.breakdown.socialBuzz},${scores.termB.breakdown.authority},${scores.termB.breakdown.momentum}`);

      const csv = csvRows.join('\n');

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
