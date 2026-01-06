/**
 * GET /api/forecasts/verified
 * 
 * Returns verified forecasts (evaluated ForecastRuns) for a comparison
 * Uses the new forecasting system (ForecastEvaluation model)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const term = searchParams.get('term'); // Optional filter

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter required' },
        { status: 400 }
      );
    }

    // Find comparison
    const comparison = await prisma.comparison.findFirst({
      where: { slug },
    });

    if (!comparison) {
      return NextResponse.json(
        { error: 'Comparison not found' },
        { status: 404 }
      );
    }

    // Get evaluated forecast runs for this comparison
    const terms = Array.isArray(comparison.terms) ? (comparison.terms as string[]) : [];
    const forecastRuns = await prisma.forecastRun.findMany({
      where: {
        comparisonId: comparison.id,
        evaluatedAt: { not: null }, // Only evaluated forecasts
      },
      include: {
        evaluations: true,
        forecastPoints: {
          where: term && terms.length > 0 ? { term: term === terms[0] ? 'termA' : 'termB' } : undefined,
          orderBy: { date: 'asc' },
        },
      },
      orderBy: { computedAt: 'desc' },
      take: 10, // Get last 10 evaluated forecasts
    });

    // Format response
    const verifiedForecasts = forecastRuns
      .filter((run: any) => run.evaluations.length > 0)
      .map((run: any) => {
        const evaluation = run.evaluations[0];
        // Get points for both terms (or filter by term if specified)
        const points = run.forecastPoints.filter((p: any) => {
          if (!term) return true;
          const termIndex = terms.findIndex((t: any) => t.toLowerCase() === term.toLowerCase());
          if (termIndex === 0) return p.term === 'termA';
          if (termIndex === 1) return p.term === 'termB';
          return true;
        });

        return {
          id: run.id,
          computedAt: run.computedAt.toISOString(),
          evaluatedAt: evaluation.evaluatedAt.toISOString(),
          horizon: run.horizon,
          winnerCorrect: evaluation.winnerCorrect,
          intervalHitRate80: evaluation.intervalHitRate80,
          intervalHitRate95: evaluation.intervalHitRate95,
          mae: evaluation.mae,
          mape: evaluation.mape,
          points: points.map((p: any) => ({
            date: p.date.toISOString().split('T')[0],
            predictedValue: p.value,
            actualValue: p.actualValue,
            lower80: p.lower80,
            upper80: p.upper80,
            lower95: p.lower95,
            upper95: p.upper95,
          })),
        };
      });

    return NextResponse.json({
      forecasts: verifiedForecasts,
      total: verifiedForecasts.length,
    });
  } catch (error) {
    console.error('[VerifiedForecasts] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load verified forecasts' },
      { status: 500 }
    );
  }
}

