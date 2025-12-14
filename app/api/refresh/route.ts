import { NextRequest, NextResponse } from "next/server";
import { refreshComparison, refreshOldComparisons, refreshTrendingComparisons, clearComparisonCache } from "@/lib/refresh-comparisons";
import { revalidateTag } from "next/cache";
import { canStartRefresh, registerRefresh, isRefreshInProgress, waitForRefresh, getRefreshStatus } from "@/lib/refresh-manager";

/**
 * API Route for refreshing comparisons
 * 
 * GET /api/refresh?slug=iphone-vs-samsung - Refresh specific comparison
 * GET /api/refresh?all=true&days=7 - Refresh all comparisons older than 7 days
 * GET /api/refresh?trending=true - Refresh top trending comparisons
 * GET /api/refresh?clear=iphone-vs-samsung - Clear cache for specific comparison
 * GET /api/refresh?status=true - Get current refresh status
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get("slug");
    const all = searchParams.get("all") === "true";
    const trending = searchParams.get("trending") === "true";
    const clear = searchParams.get("clear");
    const status = searchParams.get("status") === "true";
    const days = parseInt(searchParams.get("days") || "7", 10);
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    // Return refresh status
    if (status) {
      return NextResponse.json(getRefreshStatus());
    }

    // Clear cache for specific comparison (no concurrency protection needed)
    if (clear) {
      const timeframe = searchParams.get("timeframe") || "12m";
      const geo = searchParams.get("geo") || "";
      const success = await clearComparisonCache(clear, timeframe, geo);
      revalidateTag("trending");
      return NextResponse.json({
        success,
        message: success ? `Cache cleared for ${clear}` : `Failed to clear cache for ${clear}`,
      });
    }

    // Refresh specific comparison
    if (slug) {
      const timeframe = searchParams.get("timeframe") || "12m";
      const geo = searchParams.get("geo") || "";
      const key = `single:${slug}:${timeframe}:${geo}`;
      
      // Check if already in progress
      if (isRefreshInProgress(key, 'single')) {
        // Wait for existing refresh to complete
        await waitForRefresh(key, 30000);
        return NextResponse.json({
          success: true,
          message: `Comparison ${slug} was already being refreshed. Please check again in a moment.`,
          cached: true,
        });
      }
      
      // Check if we can start a new refresh
      const canStart = canStartRefresh('single');
      if (!canStart.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: canStart.reason,
            status: getRefreshStatus(),
          },
          { status: 429 } // Too Many Requests
        );
      }
      
      // Start refresh operation
      const refreshPromise = (async () => {
        try {
          const result = await refreshComparison(slug, timeframe, geo);
          revalidateTag("trending");
          return result;
        } catch (error) {
          throw error;
        }
      })();
      
      registerRefresh(key, 'single', refreshPromise);
      
      const result = await refreshPromise;
      return NextResponse.json(result);
    }

    // Refresh all old comparisons
    if (all) {
      const key = `all:${days}:${limit}`;
      
      // Check if already in progress
      if (isRefreshInProgress(`type:all`, 'all')) {
        return NextResponse.json(
          {
            success: false,
            error: "A bulk refresh is already in progress. Please wait for it to complete.",
            status: getRefreshStatus(),
          },
          { status: 429 }
        );
      }
      
      // Check if we can start a new refresh
      const canStart = canStartRefresh('all');
      if (!canStart.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: canStart.reason,
            status: getRefreshStatus(),
          },
          { status: 429 }
        );
      }
      
      // Start refresh operation
      const refreshPromise = (async () => {
        try {
          const result = await refreshOldComparisons(days, limit);
          revalidateTag("trending");
          return {
            success: true,
            ...result,
            message: `Refreshed ${result.refreshed} comparisons, ${result.failed} failed`,
          };
        } catch (error) {
          throw error;
        }
      })();
      
      registerRefresh(`type:all`, 'all', refreshPromise);
      
      const result = await refreshPromise;
      return NextResponse.json(result);
    }

    // Refresh trending comparisons
    if (trending) {
      const key = `trending:${limit}`;
      
      // Check if already in progress
      if (isRefreshInProgress(`type:trending`, 'trending')) {
        return NextResponse.json(
          {
            success: false,
            error: "A trending refresh is already in progress. Please wait for it to complete.",
            status: getRefreshStatus(),
          },
          { status: 429 }
        );
      }
      
      // Check if we can start a new refresh
      const canStart = canStartRefresh('trending');
      if (!canStart.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: canStart.reason,
            status: getRefreshStatus(),
          },
          { status: 429 }
        );
      }
      
      // Start refresh operation
      const refreshPromise = (async () => {
        try {
          const result = await refreshTrendingComparisons(limit);
          revalidateTag("trending");
          return {
            success: true,
            ...result,
            message: `Refreshed ${result.refreshed} trending comparisons, ${result.failed} failed`,
          };
        } catch (error) {
          throw error;
        }
      })();
      
      registerRefresh(`type:trending`, 'trending', refreshPromise);
      
      const result = await refreshPromise;
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "Invalid request. Use ?slug=, ?all=true, ?trending=true, or ?clear=" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[Refresh API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

