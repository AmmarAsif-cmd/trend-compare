/**
 * POST /api/jobs/generate-pdf
 * 
 * Background job to generate PDF reports
 * 
 * Requirements:
 * - Secure with secret token
 * - Use stored InsightsPack + cached chart data
 * - Never trigger AI calls
 * - Store fileUrl and generate signed URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getOrBuildComparison } from '@/lib/getOrBuild';
import { getInsightsPack } from '@/lib/insights/generate';
import { generateSignals } from '@/lib/insights/generate';
import { generateInterpretations } from '@/lib/insights/generate';
import { generateDecisionGuidance } from '@/lib/insights/generate';
import { runIntelligentComparison } from '@/lib/intelligent-comparison';
import { getCache } from '@/lib/cache';
import { createCacheKey } from '@/lib/cache/hash';
import { smoothSeries } from '@/lib/series';
import { generatePDF } from '@/lib/pdf-generator-enhanced';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

/**
 * Generate signed URL for PDF (placeholder - implement with your storage provider)
 */
async function uploadPdfToStorage(pdfBuffer: Buffer, filename: string): Promise<string> {
  // TODO: Implement PDF upload to your storage provider (S3, Cloudflare R2, etc.)
  // For now, return a placeholder URL
  // In production, upload to S3/R2 and return the public URL
  return `https://storage.example.com/pdfs/${filename}`;
}

/**
 * Generate signed URL for PDF
 */
async function generateSignedUrl(fileUrl: string, expiresInSeconds: number = 3600): Promise<string> {
  // TODO: Implement signed URL generation with your storage provider
  // For now, return the fileUrl directly
  return fileUrl;
}

export async function POST(request: NextRequest) {
  try {
    // Verify secret
    const secret = request.headers.get('X-Job-Secret');
    const expectedSecret = process.env.JOB_SECRET || 'default-job-secret-change-in-production';
    
    if (secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { jobId, slug, timeframe, geo, userId } = body;

    if (!jobId || !slug || !timeframe || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Update job status to processing
    await prisma.pdfJob.update({
      where: { id: jobId },
      data: {
        status: 'processing',
      },
    });

    try {
      // Get comparison data (cached, no recomputation)
      const row = await getOrBuildComparison({
        slug,
        terms: slug.split('-vs-'),
        timeframe,
        geo,
      });

      if (!row || !Array.isArray(row.series) || row.series.length === 0) {
        throw new Error('Comparison data not found');
      }

      const terms = row.terms as string[];
      const termA = terms[0];
      const termB = terms[1];
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
        console.warn('[PDF Job] Could not fetch intelligent comparison:', error);
      }

      const scores = intelligentComparison ? {
        termA: intelligentComparison.scores.termA,
        termB: intelligentComparison.scores.termB,
      } : {
        termA: { overall: 50, breakdown: { searchInterest: 50, socialBuzz: 50, authority: 50, momentum: 50 }, confidence: 50, sources: [], explanation: '' },
        termB: { overall: 50, breakdown: { searchInterest: 50, socialBuzz: 50, authority: 50, momentum: 50 }, confidence: 50, sources: [], explanation: '' },
      };

      // Generate signals and interpretations (deterministic, no AI)
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

      // Try to load cached forecasts and AI insights (read-only)
      const cache = getCache();
      const forecastKeyA = createCacheKey('forecast', slug, termA, timeframe);
      const forecastKeyB = createCacheKey('forecast', slug, termB, timeframe);
      const aiInsightsKey = createCacheKey('ai-insights', slug, timeframe);
      
      const [cachedForecastA, cachedForecastB, cachedAIInsights] = await Promise.all([
        cache.get(forecastKeyA),
        cache.get(forecastKeyB),
        cache.get(aiInsightsKey),
      ]);

      // Get InsightsPack (read-only, no AI generation)
      const insightsPackResult = await getInsightsPack({
        slug,
        termA,
        termB,
        timeframe,
        geo,
        category: row.category || undefined,
        series,
        signals,
        interpretations,
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

      // Prepare PDF data
      const pdfData = {
        termA,
        termB,
        slug,
        timeframe,
        geo,
        verdict: intelligentComparison ? {
          winner: scores.termA.overall >= scores.termB.overall ? termA : termB,
          loser: scores.termA.overall >= scores.termB.overall ? termB : termA,
          winnerScore: Math.max(scores.termA.overall, scores.termB.overall),
          loserScore: Math.min(scores.termA.overall, scores.termB.overall),
          margin: Math.abs(scores.termA.overall - scores.termB.overall),
          confidence: intelligentComparison.verdict?.confidence || 70,
          headline: intelligentComparison.verdict?.headline || '',
          recommendation: intelligentComparison.verdict?.recommendation || '',
          category: row.category || 'general',
          sources: intelligentComparison.performance?.sourcesQueried || ['Google Trends'],
        } : {
          winner: termA,
          loser: termB,
          winnerScore: 50,
          loserScore: 50,
          margin: 0,
          confidence: 50,
          headline: '',
          recommendation: '',
          category: row.category || 'general',
          sources: ['Google Trends'],
        },
        scores,
        aiInsights: cachedAIInsights ? {
          category: row.category || 'general',
          whatDataTellsUs: [],
          whyThisMatters: '',
          keyDifferences: '',
          volatilityAnalysis: '',
        } : null,
        generatedAt: new Date().toISOString(),
        reportUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://trendarc.net'}/compare/${slug}`,
      };

      // Generate PDF
      const pdfBuffer = await generatePDF(pdfData);

      // Upload to storage
      const filename = `${slug}-${timeframe}-${Date.now()}.pdf`;
      const fileUrl = await uploadPdfToStorage(pdfBuffer, filename);

      // Generate signed URL
      const signedUrl = await generateSignedUrl(fileUrl, 3600);
      const expiresAt = new Date(Date.now() + 3600 * 1000);

      // Update job status to completed
      await prisma.pdfJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          fileUrl,
          signedUrl,
          signedUrlExpiresAt: expiresAt,
          completedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        jobId,
        fileUrl,
        signedUrl,
        expiresAt: expiresAt.toISOString(),
      });
    } catch (error) {
      console.error('[PDF Job] Error generating PDF:', error);
      
      // Update job status to failed
      await prisma.pdfJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        },
      });

      return NextResponse.json(
        { error: 'Failed to generate PDF', jobId },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[PDF Job] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

