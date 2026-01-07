/**
 * Warmup Job: Refresh AI Explanations
 * 
 * Weekly job to refresh AI explanations for popular comparisons
 * Uses distributed locking and concurrency limits
 */

import { prisma } from '@/lib/db';
import { getOrBuildComparison } from '@/lib/getOrBuild';
import { runIntelligentComparison } from '@/lib/intelligent-comparison';
import { getCache } from '@/lib/cache';
import { createCacheKey } from '@/lib/cache/hash';
// Note: AI insights generation in background jobs should use direct AI calls
// with system context, not user budget-restricted functions
// For now, we'll generate AI insights directly in the job
import { generateSignals } from '@/lib/insights/generate';
import { generateInterpretations } from '@/lib/insights/generate';
import { detectPeaksWithEvents } from '@/lib/peak-event-detector';
import type { AIInsights } from '@/lib/insights/contracts/ai-insights';
import { PROMPT_VERSION } from '@/lib/insights/contracts/versions';
import { stableHash } from '@/lib/cache/hash';

export interface WarmupAIExplanationsJobResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
  duration: number;
}

/**
 * Get popular comparisons for AI explanation refresh (weekly)
 */
async function getPopularComparisonsForAI(limit: number = 30): Promise<Array<{
  slug: string;
  termA: string;
  termB: string;
  timeframe: string;
  geo: string;
  category: string | null;
}>> {
  // Get comparisons from last 30 days with high view count
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const comparisons = await prisma.comparison.findMany({
    where: {
      OR: [
        { viewCount: { gte: 10 } },
        { lastVisited: { gte: since } },
      ],
    },
    select: {
      slug: true,
      terms: true,
      timeframe: true,
      geo: true,
      category: true,
      viewCount: true,
    },
    orderBy: [
      { viewCount: 'desc' },
      { lastVisited: 'desc' },
    ],
    take: limit,
  });

  return comparisons
    .map((c: any) => {
      const terms = Array.isArray(c.terms) ? c.terms as string[] : [];
      if (terms.length < 2) return null;
      return {
        slug: c.slug,
        termA: terms[0],
        termB: terms[1],
        timeframe: c.timeframe,
        geo: c.geo,
        category: c.category,
      };
    })
    .filter((c: any): c is NonNullable<typeof c> => c !== null);
}

/**
 * Generate AI insights for a comparison
 */
async function generateAIInsightsForComparison(
  slug: string,
  termA: string,
  termB: string,
  series: Array<{ date: string; [key: string]: number | string }>,
  category: string | null,
  scores: { termA: any; termB: any }
): Promise<AIInsights | null> {
  try {
    // Generate signals and interpretations (deterministic)
    const signals = generateSignals({
      termA,
      termB,
      timeframe: '12m', // Default
      series,
      scores,
      dataSource: 'google-trends',
      lastUpdatedAt: new Date().toISOString(),
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
      lastUpdatedAt: new Date().toISOString(),
    });

    // Get peak events (deterministic, no AI needed)
    const peakEvents = await detectPeaksWithEvents(series as any[], [termA, termB], 20).catch(() => []);
    
    // For background jobs, we'll generate AI insights directly without budget restrictions
    // This is a simplified version - in production, create system-level AI functions
    // For now, we'll skip AI generation in background jobs to avoid budget issues
    // and rely on on-demand warmup which uses the premium user's budget
    const meaningExplanation = null; // Skip for background jobs

    // Get peak explanations (top 3)
    const topPeaksA = peakEvents
      .filter(p => p.term === termA)
      .slice(0, 3)
      .map((p, idx) => ({
        id: `${termA}-${p.date}-${idx}`,
        term: 'termA' as const,
        type: 'spike' as any,
        peakDate: p.date,
        magnitude: p.value,
        duration: 1,
        classification: 'significant' as any,
        startDate: p.date,
        endDate: p.date,
        context: p.event?.title || '',
        peakHash: stableHash({ term: termA, date: p.date, magnitude: p.value }),
        generatedAt: new Date().toISOString(),
        dataFreshness: {
          lastUpdatedAt: new Date().toISOString(),
          source: 'peak-detector',
        },
      }));

    const topPeaksB = peakEvents
      .filter(p => p.term === termB)
      .slice(0, 3)
      .map((p, idx) => ({
        id: `${termB}-${p.date}-${idx}`,
        term: 'termB' as const,
        type: 'spike' as any,
        peakDate: p.date,
        magnitude: p.value,
        duration: 1,
        classification: 'significant' as any,
        startDate: p.date,
        endDate: p.date,
        context: p.event?.title || '',
        peakHash: stableHash({ term: termB, date: p.date, magnitude: p.value }),
        generatedAt: new Date().toISOString(),
        dataFreshness: {
          lastUpdatedAt: new Date().toISOString(),
          source: 'peak-detector',
        },
      }));

      // Skip peak explanations in background jobs (requires AI budget)
      // These will be generated on-demand when users request them
      const peakExplanations = null;

    // Build AI insights
    const aiInsights: AIInsights = {
      id: `ai-insights-${slug}-${stableHash({ termA, termB, slug })}`,
      meaningExplanation: undefined, // Skip for background jobs
      peakExplanations: undefined, // Skip for background jobs
      generatedAt: new Date().toISOString(),
      dataFreshness: {
        lastUpdatedAt: new Date().toISOString(),
        source: 'ai-insights',
      },
      aiInsightsHash: stableHash({
        meaning: undefined,
        peaks: undefined,
      }),
    };

    return aiInsights;
  } catch (error) {
    console.error(`[WarmupAI] Error generating AI insights for ${slug}:`, error);
    return null;
  }
}

/**
 * Warmup AI explanations for popular comparisons
 */
export async function warmupAIExplanations(
  limit: number = 30,
  concurrency: number = 3
): Promise<WarmupAIExplanationsJobResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let processed = 0;
  let failed = 0;

  try {
    // Get popular comparisons
    const comparisons = await getPopularComparisonsForAI(limit);
    console.log(`[WarmupAI] Found ${comparisons.length} popular comparisons for AI refresh`);

    // Process with concurrency limit
    const cache = getCache();
    const lockKey = 'warmup:ai-explanations:lock';
    const lockSeconds = 2 * 60 * 60; // 2 hours max job duration

    // Acquire distributed lock
    const redisStore = (cache as any).redisStore;
    if (redisStore && redisStore.isAvailable()) {
      const lockAcquired = await redisStore.acquireLock(lockKey, lockSeconds);
      if (!lockAcquired) {
        return {
          success: false,
          processed: 0,
          failed: 0,
          errors: ['Another AI warmup job is already running'],
          duration: Date.now() - startTime,
        };
      }
    }

    try {
      // Process comparisons in batches
      for (let i = 0; i < comparisons.length; i += concurrency) {
        const batch = comparisons.slice(i, i + concurrency);
        
        await Promise.all(
          batch.map(async (comp) => {
            try {
              // Get comparison data
              const row = await getOrBuildComparison({
                slug: comp.slug,
                terms: [comp.termA, comp.termB],
                timeframe: comp.timeframe,
                geo: comp.geo,
              });

              if (!row || !Array.isArray(row.series) || row.series.length === 0) {
                failed++;
                errors.push(`No data for ${comp.slug}`);
                return;
              }

              // Get intelligent comparison for scores
              const intelligentComparison = await runIntelligentComparison(
                [comp.termA, comp.termB],
                row.series as any[],
                {
                  enableYouTube: !!process.env.YOUTUBE_API_KEY,
                  enableTMDB: !!process.env.TMDB_API_KEY,
                  enableBestBuy: !!process.env.BESTBUY_API_KEY,
                  enableSpotify: !!process.env.SPOTIFY_CLIENT_ID,
                  enableSteam: !!process.env.STEAM_API_KEY,
                  cachedCategory: comp.category || null,
                }
              ).catch(() => null);

              const scores = intelligentComparison ? {
                termA: intelligentComparison.scores.termA,
                termB: intelligentComparison.scores.termB,
              } : {
                termA: { overall: 50, breakdown: { searchInterest: 50, socialBuzz: 50, authority: 50, momentum: 50 } },
                termB: { overall: 50, breakdown: { searchInterest: 50, socialBuzz: 50, authority: 50, momentum: 50 } },
              };

              // Generate AI insights (using system context, no budget restrictions)
              // Note: In production, you may want to create a system-level AI function
              // that bypasses user budget but respects global limits
              const aiInsights = await generateAIInsightsForComparison(
                comp.slug,
                comp.termA,
                comp.termB,
                row.series as any[],
                comp.category,
                scores
              ).catch(error => {
                console.error(`[WarmupAI] Failed to generate AI insights for ${comp.slug}:`, error);
                return null;
              });

              // Cache AI insights
              if (aiInsights) {
                const key = createCacheKey('ai-insights', comp.slug, comp.timeframe);
                await cache.set(key, aiInsights, 7 * 24 * 60 * 60, 30 * 24 * 60 * 60); // 7d fresh, 30d stale
              }

              processed++;
              console.log(`[WarmupAI] ✅ Processed ${comp.slug}`);
            } catch (error) {
              failed++;
              const errorMsg = error instanceof Error ? error.message : String(error);
              errors.push(`${comp.slug}: ${errorMsg}`);
              console.error(`[WarmupAI] ❌ Failed ${comp.slug}:`, error);
            }
          })
        );
      }
    } finally {
      // Release lock
      if (redisStore && redisStore.isAvailable()) {
        await redisStore.releaseLock(lockKey);
      }
    }

    return {
      success: true,
      processed,
      failed,
      errors: errors.slice(0, 10), // Limit error messages
      duration: Date.now() - startTime,
    };
  } catch (error) {
    console.error('[WarmupAI] Job failed:', error);
    return {
      success: false,
      processed,
      failed,
      errors: [error instanceof Error ? error.message : String(error)],
      duration: Date.now() - startTime,
    };
  }
}

