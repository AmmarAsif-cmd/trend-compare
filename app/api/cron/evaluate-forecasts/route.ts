/**
 * Forecast Evaluation Cron Job
 * 
 * Evaluates past forecasts by comparing them to actual observed data.
 * Updates ForecastEvaluation records and trust statistics.
 * 
 * Runs daily via Vercel Cron or similar scheduler.
 * 
 * Vercel Cron Configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/evaluate-forecasts",
 *     "schedule": "0 2 * * *" // Daily at 2 AM
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getOrBuildComparison } from '@/lib/getOrBuild';
import type { SeriesPoint } from '@/lib/trends';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Verify cron secret for security
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Fetch actual observed values for a forecast period
 */
async function fetchActualValues(
  slug: string,
  term: string,
  timeframe: string,
  geo: string,
  startDate: Date,
  endDate: Date
): Promise<Array<{ date: string; value: number }>> {
  try {
    // Get comparison data
    const comparison = await getOrBuildComparison({
      slug,
      terms: [], // Will be extracted from slug
      timeframe,
      geo,
    });

    if (!comparison) {
      return [];
    }

    const series = comparison.series as SeriesPoint[];
    const actuals: Array<{ date: string; value: number }> = [];

    for (const point of series) {
      const pointDate = new Date(point.date);
      if (pointDate >= startDate && pointDate <= endDate) {
        const value = Number(point[term] || 0);
        if (isFinite(value) && value >= 0) {
          actuals.push({
            date: point.date,
            value,
          });
        }
      }
    }

    return actuals.sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error(`[EvaluateForecasts] Error fetching actuals for ${slug}/${term}:`, error);
    return [];
  }
}

/**
 * Evaluate a single forecast run
 */
async function evaluateForecastRun(forecastRun: any): Promise<void> {
  try {
    // Check if already evaluated
    const existing = await prisma.forecastEvaluation.findUnique({
      where: { forecastRunId: forecastRun.id },
    });

    if (existing) {
      return; // Already evaluated
    }

    // Get forecast points
    const [pointsA, pointsB] = await Promise.all([
      prisma.forecastPoint.findMany({
        where: {
          forecastRunId: forecastRun.id,
          term: 'termA',
        },
        orderBy: { date: 'asc' },
      }),
      prisma.forecastPoint.findMany({
        where: {
          forecastRunId: forecastRun.id,
          term: 'termB',
        },
        orderBy: { date: 'asc' },
      }),
    ]);

    if (pointsA.length === 0 || pointsB.length === 0) {
      return; // No points to evaluate
    }

    // Get comparison to extract terms
    const comparison = await prisma.comparison.findUnique({
      where: { id: forecastRun.comparisonId },
    });

    if (!comparison) {
      return;
    }

    const terms = comparison.terms as string[];
    if (terms.length < 2) {
      return;
    }

    const termA = terms[0];
    const termB = terms[1];

    // Determine forecast period
    const firstDate = pointsA[0].date;
    const lastDate = pointsA[pointsA.length - 1].date;
    const endDate = new Date(lastDate);
    endDate.setDate(endDate.getDate() + 1); // Add 1 day buffer

    // Fetch actual values for both terms
    const [actualsA, actualsB] = await Promise.all([
      fetchActualValues(comparison.slug, termA, forecastRun.timeframe, comparison.geo, firstDate, endDate),
      fetchActualValues(comparison.slug, termB, forecastRun.timeframe, comparison.geo, firstDate, endDate),
    ]);

    if (actualsA.length === 0 || actualsB.length === 0) {
      console.log(`[EvaluateForecasts] No actuals found for ${comparison.slug}, skipping`);
      return;
    }

    // Match forecasts to actuals and calculate metrics
    const errorsA: number[] = [];
    const errorsB: number[] = [];
    const percentageErrorsA: number[] = [];
    const percentageErrorsB: number[] = [];
    const intervalHits80A: boolean[] = [];
    const intervalHits80B: boolean[] = [];
    const intervalHits95A: boolean[] = [];
    const intervalHits95B: boolean[] = [];
    let directionCorrectA = 0;
    let directionCorrectB = 0;
    let directionTotalA = 0;
    let directionTotalB = 0;

    // Create lookup map for actuals
    const actualsMapA = new Map(actualsA.map(a => [a.date, a.value]));
    const actualsMapB = new Map(actualsB.map(a => [a.date, a.value]));

    for (let i = 0; i < pointsA.length; i++) {
      const pointA = pointsA[i];
      const pointB = pointsB[i];
      const dateStr = pointA.date.toISOString().split('T')[0];

      const actualA = actualsMapA.get(dateStr);
      const actualB = actualsMapB.get(dateStr);

      if (actualA !== undefined) {
        const error = Math.abs(actualA - pointA.value);
        const pctError = actualA > 0 ? (error / actualA) * 100 : 0;
        errorsA.push(error);
        percentageErrorsA.push(pctError);
        intervalHits80A.push(actualA >= pointA.lower80 && actualA <= pointA.upper80);
        intervalHits95A.push(actualA >= pointA.lower95 && actualA <= pointA.upper95);

        // Check direction (if we have previous point)
        if (i > 0) {
          const prevActual = actualsMapA.get(pointsA[i - 1].date.toISOString().split('T')[0]);
          if (prevActual !== undefined) {
            directionTotalA++;
            const forecastDirection = pointA.value > pointsA[i - 1].value;
            const actualDirection = actualA > prevActual;
            if (forecastDirection === actualDirection) {
              directionCorrectA++;
            }
          }
        }
      }

      if (actualB !== undefined) {
        const error = Math.abs(actualB - pointB.value);
        const pctError = actualB > 0 ? (error / actualB) * 100 : 0;
        errorsB.push(error);
        percentageErrorsB.push(pctError);
        intervalHits80B.push(actualB >= pointB.lower80 && actualB <= pointB.upper80);
        intervalHits95B.push(actualB >= pointB.lower95 && actualB <= pointB.upper95);

        // Check direction
        if (i > 0) {
          const prevActual = actualsMapB.get(pointsB[i - 1].date.toISOString().split('T')[0]);
          if (prevActual !== undefined) {
            directionTotalB++;
            const forecastDirection = pointB.value > pointsB[i - 1].value;
            const actualDirection = actualB > prevActual;
            if (forecastDirection === actualDirection) {
              directionCorrectB++;
            }
          }
        }
      }
    }

    // Calculate aggregate metrics
    const maeA = errorsA.length > 0 ? errorsA.reduce((a, b) => a + b, 0) / errorsA.length : null;
    const maeB = errorsB.length > 0 ? errorsB.reduce((a, b) => a + b, 0) / errorsB.length : null;
    const mapeA = percentageErrorsA.length > 0 
      ? percentageErrorsA.reduce((a, b) => a + b, 0) / percentageErrorsA.length 
      : null;
    const mapeB = percentageErrorsB.length > 0 
      ? percentageErrorsB.reduce((a, b) => a + b, 0) / percentageErrorsB.length 
      : null;

    const intervalHitRate80A = intervalHits80A.length > 0
      ? (intervalHits80A.filter(h => h).length / intervalHits80A.length) * 100
      : null;
    const intervalHitRate80B = intervalHits80B.length > 0
      ? (intervalHits80B.filter(h => h).length / intervalHits80B.length) * 100
      : null;
    const intervalHitRate95A = intervalHits95A.length > 0
      ? (intervalHits95A.filter(h => h).length / intervalHits95A.length) * 100
      : null;
    const intervalHitRate95B = intervalHits95B.length > 0
      ? (intervalHits95B.filter(h => h).length / intervalHits95B.length) * 100
      : null;

    // Average metrics across both terms
    const mae = maeA !== null && maeB !== null ? (maeA + maeB) / 2 : (maeA || maeB);
    const mape = mapeA !== null && mapeB !== null ? (mapeA + mapeB) / 2 : (mapeA || mapeB);
    const intervalHitRate80 = intervalHitRate80A !== null && intervalHitRate80B !== null
      ? (intervalHitRate80A + intervalHitRate80B) / 2
      : (intervalHitRate80A || intervalHitRate80B);
    const intervalHitRate95 = intervalHitRate95A !== null && intervalHitRate95B !== null
      ? (intervalHitRate95A + intervalHitRate95B) / 2
      : (intervalHitRate95A || intervalHitRate95B);

    // Determine winner correctness
    // Get actual final values
    const finalActualA = actualsA[actualsA.length - 1]?.value || 0;
    const finalActualB = actualsB[actualsB.length - 1]?.value || 0;
    const predictedWinner = forecastRun.winnerProbability > 50 ? 'termB' : 'termA';
    const actualWinner = finalActualB > finalActualA ? 'termB' : 'termA';
    const winnerCorrect = predictedWinner === actualWinner;

    // Create evaluation record
    await prisma.forecastEvaluation.create({
      data: {
        forecastRunId: forecastRun.id,
        winnerCorrect,
        directionCorrectA: directionTotalA > 0 ? directionCorrectA / directionTotalA > 0.5 : null,
        directionCorrectB: directionTotalB > 0 ? directionCorrectB / directionTotalB > 0.5 : null,
        intervalHitRate80: intervalHitRate80 !== null ? intervalHitRate80 : undefined,
        intervalHitRate95: intervalHitRate95 !== null ? intervalHitRate95 : undefined,
        mae: mae !== null ? mae : undefined,
        mape: mape !== null ? mape : undefined,
        evaluatedPoints: errorsA.length + errorsB.length,
      },
    });

    // Update forecast run with evaluation timestamp
    await prisma.forecastRun.update({
      where: { id: forecastRun.id },
      data: { evaluatedAt: new Date() },
    });

    console.log(`[EvaluateForecasts] ✅ Evaluated forecast ${forecastRun.id}: winnerCorrect=${winnerCorrect}, mae=${mae?.toFixed(2)}, intervalHitRate80=${intervalHitRate80?.toFixed(1)}%`);
  } catch (error) {
    console.error(`[EvaluateForecasts] Error evaluating forecast run ${forecastRun.id}:`, error);
  }
}

/**
 * Update trust statistics
 */
async function updateTrustStats(): Promise<void> {
  try {
    // Calculate stats for last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const recentEvaluations = await prisma.forecastEvaluation.findMany({
      where: {
        evaluatedAt: {
          gte: ninetyDaysAgo,
        },
      },
    });

    const allEvaluations = await prisma.forecastEvaluation.findMany({});

    // Calculate metrics
    const totalEvaluated = allEvaluations.length;
    const winnerCorrect = allEvaluations.filter(e => e.winnerCorrect === true).length;
    const winnerAccuracy = totalEvaluated > 0 ? (winnerCorrect / totalEvaluated) * 100 : null;

    const intervalCoverages = allEvaluations
      .map(e => e.intervalHitRate80)
      .filter((v): v is number => v !== null && v !== undefined);
    const avgIntervalCoverage = intervalCoverages.length > 0
      ? intervalCoverages.reduce((a, b) => a + b, 0) / intervalCoverages.length
      : null;

    const recentWinnerCorrect = recentEvaluations.filter(e => e.winnerCorrect === true).length;
    const last90DaysAccuracy = recentEvaluations.length > 0
      ? (recentWinnerCorrect / recentEvaluations.length) * 100
      : null;

    // Upsert trust stats
    await prisma.forecastTrustStats.upsert({
      where: { period: 'alltime' },
      create: {
        period: 'alltime',
        totalEvaluated,
        winnerAccuracyPercent: winnerAccuracy !== null ? winnerAccuracy : undefined,
        intervalCoveragePercent: avgIntervalCoverage !== null ? avgIntervalCoverage : undefined,
        last90DaysAccuracy: last90DaysAccuracy !== null ? last90DaysAccuracy : undefined,
        sampleSize: totalEvaluated,
      },
      update: {
        totalEvaluated,
        winnerAccuracyPercent: winnerAccuracy !== null ? winnerAccuracy : undefined,
        intervalCoveragePercent: avgIntervalCoverage !== null ? avgIntervalCoverage : undefined,
        last90DaysAccuracy: last90DaysAccuracy !== null ? last90DaysAccuracy : undefined,
        sampleSize: totalEvaluated,
        lastCalculated: new Date(),
      },
    });

    console.log(`[EvaluateForecasts] ✅ Updated trust stats: totalEvaluated=${totalEvaluated}, winnerAccuracy=${winnerAccuracy?.toFixed(1)}%`);
  } catch (error) {
    console.error('[EvaluateForecasts] Error updating trust stats:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[EvaluateForecasts] Starting forecast evaluation job...');

    // Find forecast runs that are ready for evaluation
    // (forecast end date has passed and not yet evaluated)
    const now = new Date();
    const forecastRuns = await prisma.forecastRun.findMany({
      where: {
        evaluatedAt: null, // Not yet evaluated
        computedAt: {
          // Forecast should be at least horizon days old
          lte: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000), // 28 days ago
        },
      },
      take: 100, // Process in batches
    });

    console.log(`[EvaluateForecasts] Found ${forecastRuns.length} forecast runs to evaluate`);

    // Evaluate each forecast run
    let evaluated = 0;
    for (const forecastRun of forecastRuns) {
      await evaluateForecastRun(forecastRun);
      evaluated++;
    }

    // Update trust statistics
    await updateTrustStats();

    return NextResponse.json({
      success: true,
      evaluated,
      totalFound: forecastRuns.length,
      message: `Evaluated ${evaluated} forecast runs`,
    });
  } catch (error) {
    console.error('[EvaluateForecasts] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


