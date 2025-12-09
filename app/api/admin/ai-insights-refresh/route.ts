import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { prepareInsightData, getOrGenerateAIInsights, checkInsightsNeedRefresh } from "@/lib/aiInsightsGenerator";

/**
 * GET - List all comparisons that need AI insights refresh
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authCheck = await fetch(
      new URL("/api/admin/check-auth", request.url).toString(),
      {
        headers: request.headers,
      }
    );

    if (!authCheck.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all comparisons
    const comparisons = await prisma.comparison.findMany({
      select: {
        id: true,
        slug: true,
        timeframe: true,
        geo: true,
        terms: true,
        ai: true,
        category: true,
        updatedAt: true,
        createdAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 100, // Limit to most recent 100
    });

    // Check which ones need refresh
    const results = await Promise.all(
      comparisons.map(async (comp: {
        id: string;
        slug: string;
        timeframe: string;
        geo: string;
        terms: any;
        ai: any;
        category: string | null;
        updatedAt: Date;
        createdAt: Date;
      }) => {
        const { needsRefresh, ageInDays, hasInsights } = await checkInsightsNeedRefresh(
          comp.slug,
          comp.timeframe,
          comp.geo
        );

        return {
          id: comp.id,
          slug: comp.slug,
          timeframe: comp.timeframe,
          geo: comp.geo, // Keep actual database value (empty string for worldwide)
          geoDisplay: comp.geo || 'worldwide', // Separate field for display only
          terms: comp.terms,
          category: comp.category,
          hasInsights,
          needsRefresh,
          ageInDays: Math.round(ageInDays * 10) / 10,
          lastUpdated: comp.updatedAt,
          createdAt: comp.createdAt,
        };
      })
    );

    // Separate into categories
    const needsRefresh = results.filter((r) => r.needsRefresh);
    const fresh = results.filter((r) => !r.needsRefresh);

    return NextResponse.json({
      total: results.length,
      needsRefresh: needsRefresh.length,
      fresh: fresh.length,
      comparisons: {
        stale: needsRefresh,
        fresh: fresh.slice(0, 10), // Only show first 10 fresh ones
      },
    });
  } catch (error) {
    console.error("[AI Insights Refresh API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comparisons" },
      { status: 500 }
    );
  }
}

/**
 * POST - Manually refresh AI insights for a specific comparison
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authCheck = await fetch(
      new URL("/api/admin/check-auth", request.url).toString(),
      {
        headers: request.headers,
      }
    );

    if (!authCheck.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { slug, timeframe, geo } = body;

    if (!slug || !timeframe) {
      return NextResponse.json(
        { error: "Missing required fields: slug, timeframe" },
        { status: 400 }
      );
    }

    // Get the comparison data
    const comparison = await prisma.comparison.findUnique({
      where: {
        slug_timeframe_geo: {
          slug,
          timeframe,
          geo: geo || '',
        },
      },
      select: {
        slug: true,
        terms: true,
        series: true,
        timeframe: true,
        geo: true,
      },
    });

    if (!comparison) {
      return NextResponse.json(
        { error: "Comparison not found" },
        { status: 404 }
      );
    }

    // Prepare insight data
    const terms = comparison.terms as string[];
    if (!Array.isArray(terms) || terms.length < 2) {
      return NextResponse.json(
        { error: "Invalid comparison terms" },
        { status: 400 }
      );
    }

    const series = comparison.series as Array<{ date: string; [key: string]: any }>;
    const insightData = prepareInsightData(terms[0], terms[1], series);

    // Force refresh
    console.log(`[AI Refresh] 🔄 Manually refreshing: ${slug}`);
    const insights = await getOrGenerateAIInsights(
      slug,
      timeframe,
      geo || '',
      insightData,
      true // Force refresh
    );

    if (!insights) {
      return NextResponse.json(
        { error: "Failed to generate insights - check budget limits or API key" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "AI insights refreshed successfully",
      slug,
      category: insights.category,
    });
  } catch (error) {
    console.error("[AI Insights Refresh API] Error:", error);
    return NextResponse.json(
      { error: "Failed to refresh insights" },
      { status: 500 }
    );
  }
}
