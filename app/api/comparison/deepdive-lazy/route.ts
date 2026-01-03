/**
 * Lazy-loading Deep Dive API
 * Loads expensive sections (forecast, geographic, AI insights) on demand
 */

import { NextRequest, NextResponse } from 'next/server';
import { fromSlug, toCanonicalSlug } from '@/lib/slug';
import { validateTopic } from '@/lib/validateTermsServer';
import { getOrBuildComparison } from '@/lib/getOrBuild';
import { getGeographicBreakdown } from '@/lib/getGeographicData';
import { getOrComputeForecastPack } from '@/lib/forecasting/forecast-pack';
import { prepareInsightData, getOrGenerateAIInsights } from '@/lib/aiInsightsGenerator';
import { runIntelligentComparison } from '@/lib/intelligent-comparison';
import { smoothSeries } from '@/lib/series';
import { shouldShowForecast } from '@/lib/forecast-guardrails';
import { computeComparisonMetrics } from '@/lib/comparison-metrics';
import { metricsCollector, generateRequestId } from '@/lib/performance/metrics';
import { logger } from '@/lib/performance/logger';
import { checkETag, createCacheHeaders } from '@/lib/utils/etag';
import { createCompressedResponse } from '@/lib/utils/compress';

export const dynamic = 'force-dynamic';

function isValidTopic(
  r: ReturnType<typeof validateTopic>,
): r is { ok: true; term: string } {
  return r.ok;
}

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  metricsCollector.startRequest(requestId, '/api/comparison/deepdive-lazy', 'GET');
  const startTime = Date.now();
  logger.info('Deep dive lazy load request received', { requestId, url: request.url });

  try {
      const { searchParams } = new URL(request.url);
      const slug = searchParams.get('slug');
      const timeframe = searchParams.get('tf') || '12m';
      const geo = searchParams.get('geo') || '';
      const sections = searchParams.get('sections')?.split(',') || ['forecast', 'geographic', 'ai'];

      if (!slug) {
        return NextResponse.json(
          { error: 'Slug parameter required' },
          { status: 400 }
        );
      }

      // Validate and normalize slug
      const raw = fromSlug(slug);
      const checked = raw.map(validateTopic);
      const valid = checked.filter(isValidTopic);
      
      if (valid.length !== checked.length) {
        return NextResponse.json(
          { error: 'Invalid terms in slug' },
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

      // Get comparison data
      const row = await getOrBuildComparison({
        slug: canonical,
        terms,
        timeframe,
        geo,
      });

      if (!row) {
        return NextResponse.json(
          { error: 'Comparison not found' },
          { status: 404 }
        );
      }

      const actualTerms = row.terms as string[];
      const rawSeries = row.series as any[];
      
      if (!Array.isArray(rawSeries) || rawSeries.length === 0) {
        return NextResponse.json(
          { error: 'No data available' },
          { status: 404 }
        );
      }

      const series = smoothSeries(rawSeries, 4);

      // Run intelligent comparison (cached)
      let intelligentComparison: any = null;
      try {
        intelligentComparison = await runIntelligentComparison(
          actualTerms,
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
        logger.warn('Intelligent comparison failed', { requestId, error });
      }

      // Load requested sections in parallel
      const results: any = {};

      if (sections.includes('forecast')) {
        // Only compute forecast if guardrails pass
        const metrics = computeComparisonMetrics(
          series,
          actualTerms[0],
          actualTerms[1],
          {
            winner: intelligentComparison?.verdict?.winner || actualTerms[0],
            loser: intelligentComparison?.verdict?.loser || actualTerms[1],
            winnerScore: intelligentComparison?.scores?.termA?.overall || 50,
            loserScore: intelligentComparison?.scores?.termB?.overall || 50,
            margin: Math.abs((intelligentComparison?.scores?.termA?.overall || 50) - (intelligentComparison?.scores?.termB?.overall || 50)),
            confidence: intelligentComparison?.verdict?.confidence || 50,
          },
          intelligentComparison?.scores?.termA?.breakdown || {},
          intelligentComparison?.scores?.termB?.breakdown || {},
          null
        );

        const shouldCompute = shouldShowForecast({
          seriesLength: series.length,
          volatility: metrics.volatility,
          disagreementFlag: metrics.disagreementFlag,
          agreementIndex: metrics.agreementIndex,
          qualityFlags: undefined,
        });

        if (shouldCompute) {
          try {
            results.forecast = await getOrComputeForecastPack(
              row.id,
              actualTerms[0],
              actualTerms[1],
              series,
              timeframe,
              28,
              intelligentComparison?.category?.category || row.category || 'general'
            );
          } catch (error) {
            logger.warn('Forecast computation failed', { requestId, error });
            results.forecast = null;
          }
        } else {
          results.forecast = null;
        }
      }

      if (sections.includes('geographic')) {
        try {
          const geoData = await getGeographicBreakdown(
            actualTerms[0],
            actualTerms[1],
            series,
            { timeframe, geo }
          );
          logger.info('Geographic breakdown loaded', { 
            requestId, 
            hasData: !!geoData,
            termA_dominance: geoData?.termA_dominance?.length || 0,
            termB_dominance: geoData?.termB_dominance?.length || 0,
            competitive: geoData?.competitive_regions?.length || 0,
          });
          results.geographic = geoData;
        } catch (error: any) {
          logger.warn('Geographic breakdown failed', { requestId, error: error?.message || error });
          results.geographic = null;
        }
      }

      if (sections.includes('ai')) {
        try {
          const insightData = prepareInsightData(
            actualTerms[0],
            actualTerms[1],
            series,
            intelligentComparison
          );
          const aiInsights = await getOrGenerateAIInsights(
            canonical,
            timeframe,
            geo,
            insightData,
            false,
            intelligentComparison?.category?.category
          );
          // Return AI insights in the format expected by the component
          results.ai = aiInsights || null;
        } catch (error) {
          logger.warn('AI insights failed', { requestId, error });
          results.ai = null;
        }
      }

      const duration = Date.now() - startTime;
      logger.info('Deep dive sections loaded', { requestId, sections, duration });

      // Generate ETag and check for 304 Not Modified
      const cacheHeaders = createCacheHeaders(results, 300, 600); // 5 min cache, 10 min stale
      const etag = (cacheHeaders as Record<string, string>)['ETag'];
      
      if (etag && checkETag(request, etag)) {
        return new NextResponse(null, { status: 304, headers: cacheHeaders });
      }

      // Compress response if client supports it
      const { body, headers: compressHeaders } = await createCompressedResponse(results, request);
      
      return new NextResponse(body, {
        headers: {
          ...cacheHeaders,
          ...compressHeaders,
        },
      });
    } catch (error: any) {
      logger.error('Deep dive API error', { requestId, error: error.message });
      return NextResponse.json(
        { error: error.message || 'Failed to load deep dive sections' },
        { status: 500 }
      );
    } finally {
      metricsCollector.finishRequest(requestId);
    }
}

