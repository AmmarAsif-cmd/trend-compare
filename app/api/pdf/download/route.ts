/**
 * API Route: Generate and download PDF report
 * Premium feature - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { canAccessPremium } from '@/lib/user-auth-helpers';
import { generateComparisonPDF } from '@/lib/pdf-generator';
import { getOrBuildComparison } from '@/lib/getOrBuild';
import { runIntelligentComparison } from '@/lib/intelligent-comparison';
import { getOrGenerateAIInsights, prepareInsightData } from '@/lib/aiInsightsGenerator';
import { getGeographicBreakdown } from '@/lib/getGeographicData';
import { predictTrend } from '@/lib/prediction-engine-enhanced';
import { getMaxHistoricalData } from '@/lib/get-max-historical-data';

export async function GET(request: NextRequest) {
  try {
    // Check premium access
    const hasPremium = await canAccessPremium();
    if (!hasPremium) {
      return NextResponse.json(
        { error: 'Premium subscription required to download PDF reports' },
        { status: 403 }
      );
    }

    // Get parameters
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');
    const timeframe = searchParams.get('timeframe') || '12m';
    const geo = searchParams.get('geo') || '';

    if (!slug) {
      return NextResponse.json(
        { error: 'Missing required parameter: slug' },
        { status: 400 }
      );
    }

    // Fetch comparison data
    const row = await getOrBuildComparison({
      slug,
      terms: [],
      timeframe,
      geo,
    });

    if (!row || !row.series || row.series.length === 0) {
      return NextResponse.json(
        { error: 'Comparison not found or has no data' },
        { status: 404 }
      );
    }

    const terms = row.terms as string[];
    if (terms.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid comparison - must have exactly 2 terms' },
        { status: 400 }
      );
    }

    const series = row.series as Array<{ date: string; [key: string]: any }>;

    // Get intelligent comparison data
    let intelligentComparison;
    try {
      intelligentComparison = await runIntelligentComparison(
        terms,
        series,
        {
          enableYouTube: !!process.env.YOUTUBE_API_KEY,
          enableTMDB: !!process.env.TMDB_API_KEY,
          enableBestBuy: !!process.env.BESTBUY_API_KEY,
          enableSpotify: !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET),
          enableSteam: true,
          cachedCategory: row.category,
        }
      );
    } catch (error) {
      console.error('[PDF] Error getting intelligent comparison:', error);
      return NextResponse.json(
        { error: 'Failed to generate comparison data' },
        { status: 500 }
      );
    }

    // Get AI insights (premium feature)
    let aiInsights = null;
    try {
      const insightData = prepareInsightData(
        terms[0],
        terms[1],
        series,
        intelligentComparison
      );
      aiInsights = await getOrGenerateAIInsights(
        slug,
        timeframe,
        geo,
        insightData,
        false,
        intelligentComparison.category.category
      );
    } catch (error) {
      console.warn('[PDF] Error getting AI insights (continuing without):', error);
    }

    // Get geographic data
    let geographicData = null;
    try {
      geographicData = await getGeographicBreakdown(terms[0], terms[1], series);
    } catch (error) {
      console.warn('[PDF] Error getting geographic data (continuing without):', error);
    }

    // Get predictions
    let predictionsA = null;
    let predictionsB = null;
    let historicalDataPoints = series.length;
    try {
      const maxHistoricalSeries = await getMaxHistoricalData(terms, geo || '');
      if (maxHistoricalSeries.length > 0) {
        historicalDataPoints = maxHistoricalSeries.length;
        const predictionSeries = maxHistoricalSeries.length >= series.length ? maxHistoricalSeries : series;
        [predictionsA, predictionsB] = await Promise.all([
          predictTrend({
            series: predictionSeries as any[],
            term: terms[0],
            forecastDays: 30,
            methods: ['all'],
          }).catch(() => null),
          predictTrend({
            series: predictionSeries as any[],
            term: terms[1],
            forecastDays: 30,
            methods: ['all'],
          }).catch(() => null),
        ]);
      }
    } catch (error) {
      console.warn('[PDF] Error getting predictions (continuing without):', error);
    }

    // Prepare PDF data
    const termAScore = intelligentComparison.scores.termA.overall;
    const termBScore = intelligentComparison.scores.termB.overall;
    const winner = termAScore >= termBScore ? terms[0] : terms[1];
    const loser = winner === terms[0] ? terms[1] : terms[0];

    const pdfData = {
      termA: terms[0],
      termB: terms[1],
      slug,
      timeframe,
      geo: geo || 'Worldwide',
      verdict: {
        winner,
        loser,
        winnerScore: Math.max(termAScore, termBScore),
        loserScore: Math.min(termAScore, termBScore),
        margin: intelligentComparison.verdict.margin,
        confidence: intelligentComparison.verdict.confidence,
        headline: intelligentComparison.verdict.headline,
        recommendation: intelligentComparison.verdict.recommendation,
        category: intelligentComparison.category.category,
        sources: intelligentComparison.performance.sourcesQueried || ['Google Trends'],
      },
      scores: {
        termA: {
          overall: intelligentComparison.scores.termA.overall,
          breakdown: intelligentComparison.scores.termA.breakdown,
        },
        termB: {
          overall: intelligentComparison.scores.termB.overall,
          breakdown: intelligentComparison.scores.termB.breakdown,
        },
      },
      aiInsights: aiInsights,
      geographicData: geographicData,
      predictions: (predictionsA || predictionsB) ? {
        predictionsA,
        predictionsB,
        historicalDataPoints,
      } : undefined,
      generatedAt: new Date().toISOString(),
      reportUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://trendarc.net'}/compare/${slug}?tf=${timeframe}${geo ? `&geo=${geo}` : ''}`,
    };

    // Generate PDF
    const pdfBuffer = await generateComparisonPDF(pdfData);

    // Format term names for filename
    const formatTerm = (term: string) => term.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const filename = `${formatTerm(terms[0])}-vs-${formatTerm(terms[1])}-Trend-Report.pdf`;

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('[PDF] Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error?.message },
      { status: 500 }
    );
  }
}

