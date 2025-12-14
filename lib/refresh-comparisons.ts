/**
 * Refresh Comparisons System
 * Allows refreshing cached comparisons to get updated data
 */

import { prisma } from "./db";
import { getOrBuildComparison } from "./getOrBuild";
import { toCanonicalSlug } from "./slug";

/**
 * Refresh a specific comparison by slug
 * Handles concurrent refresh attempts gracefully
 */
export async function refreshComparison(
  slug: string,
  timeframe: string = "12m",
  geo: string = ""
): Promise<{ success: boolean; message: string }> {
  try {
    // Find the comparison
    const existing = await prisma.comparison.findUnique({
      where: { slug_timeframe_geo: { slug, timeframe, geo } },
      select: { terms: true },
    });

    if (!existing) {
      return { success: false, message: `Comparison not found: ${slug}` };
    }

    const terms = Array.isArray(existing.terms) ? existing.terms as string[] : null;
    if (!terms || terms.length < 2) {
      return { success: false, message: `Invalid terms for comparison: ${slug}` };
    }

    // Delete the cached comparison to force refresh
    // Use deleteMany to avoid errors if already deleted by concurrent request
    await prisma.comparison.deleteMany({
      where: { 
        slug,
        timeframe,
        geo,
      },
    });

    // Rebuild with fresh data
    await getOrBuildComparison({ slug, terms, timeframe, geo });

    return { success: true, message: `Refreshed comparison: ${slug}` };
  } catch (error) {
    // Handle "record not found" errors gracefully (might be deleted by concurrent request)
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      console.log(`[Refresh] Comparison ${slug} already deleted, rebuilding...`);
      // Try to rebuild anyway
      try {
        const existing = await prisma.comparison.findUnique({
          where: { slug_timeframe_geo: { slug, timeframe, geo } },
          select: { terms: true },
        });
        if (existing) {
          const terms = Array.isArray(existing.terms) ? existing.terms as string[] : null;
          if (terms && terms.length >= 2) {
            await getOrBuildComparison({ slug, terms, timeframe, geo });
            return { success: true, message: `Refreshed comparison: ${slug}` };
          }
        }
      } catch (rebuildError) {
        // Ignore rebuild errors
      }
      return { success: true, message: `Comparison ${slug} was already refreshed` };
    }
    
    console.error(`[Refresh] Error refreshing ${slug}:`, error);
    return {
      success: false,
      message: `Failed to refresh: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Refresh all comparisons older than specified days
 */
export async function refreshOldComparisons(
  olderThanDays: number = 7,
  limit: number = 100
): Promise<{ refreshed: number; failed: number; errors: string[] }> {
  const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  const errors: string[] = [];
  let refreshed = 0;
  let failed = 0;

  try {
    // Find old comparisons
    const oldComparisons = await prisma.comparison.findMany({
      where: {
        updatedAt: { lt: cutoffDate },
      },
      select: {
        slug: true,
        terms: true,
        timeframe: true,
        geo: true,
      },
      take: limit,
      orderBy: { updatedAt: "asc" }, // Oldest first
    });

    console.log(`[Refresh] Found ${oldComparisons.length} comparisons to refresh`);

    // Refresh each one
    for (const comp of oldComparisons) {
      const terms = Array.isArray(comp.terms) ? comp.terms as string[] : null;
      if (!terms || terms.length < 2) {
        failed++;
        errors.push(`Invalid terms for ${comp.slug}`);
        continue;
      }

      try {
        // Delete and rebuild
        await prisma.comparison.delete({
          where: {
            slug_timeframe_geo: {
              slug: comp.slug,
              timeframe: comp.timeframe || "12m",
              geo: comp.geo || "",
            },
          },
        });

        await getOrBuildComparison({
          slug: comp.slug,
          terms,
          timeframe: comp.timeframe || "12m",
          geo: comp.geo || "",
        });

        refreshed++;
        console.log(`[Refresh] ✅ Refreshed: ${comp.slug}`);
      } catch (error) {
        failed++;
        const errorMsg = `Failed to refresh ${comp.slug}: ${error instanceof Error ? error.message : "Unknown"}`;
        errors.push(errorMsg);
        console.error(`[Refresh] ❌ ${errorMsg}`);
      }
    }

    return { refreshed, failed, errors: errors.slice(0, 10) }; // Limit errors to first 10
  } catch (error) {
    console.error("[Refresh] Error in refreshOldComparisons:", error);
    return {
      refreshed: 0,
      failed: 0,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

/**
 * Refresh trending comparisons (top viewed this week)
 */
export async function refreshTrendingComparisons(
  limit: number = 20
): Promise<{ refreshed: number; failed: number }> {
  try {
    // Get trending comparisons from last 7 days
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const trending = await prisma.comparison.findMany({
      where: {
        createdAt: { gte: since },
      },
      select: {
        slug: true,
        terms: true,
        timeframe: true,
        geo: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 1000, // Get more to aggregate
    });

    // Aggregate by slug to find most viewed
    const slugCounts = new Map<string, number>();
    const slugData = new Map<string, { terms: string[]; timeframe: string; geo: string }>();

    for (const comp of trending) {
      const terms = Array.isArray(comp.terms) ? comp.terms as string[] : null;
      if (!terms || terms.length < 2) continue;

      const slug = toCanonicalSlug(terms);
      if (!slug) continue;

      slugCounts.set(slug, (slugCounts.get(slug) || 0) + 1);
      if (!slugData.has(slug)) {
        slugData.set(slug, {
          terms,
          timeframe: comp.timeframe || "12m",
          geo: comp.geo || "",
        });
      }
    }

    // Sort by count and take top N
    const topSlugs = Array.from(slugCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([slug]) => slug);

    let refreshed = 0;
    let failed = 0;

    // Refresh each trending comparison
    for (const slug of topSlugs) {
      const data = slugData.get(slug);
      if (!data) continue;

      try {
        const result = await refreshComparison(slug, data.timeframe, data.geo);
        if (result.success) {
          refreshed++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
        console.error(`[Refresh] Failed to refresh trending ${slug}:`, error);
      }
    }

    return { refreshed, failed };
  } catch (error) {
    console.error("[Refresh] Error refreshing trending:", error);
    return { refreshed: 0, failed: 0 };
  }
}

/**
 * Clear cache for a specific comparison (force fresh fetch on next view)
 */
export async function clearComparisonCache(
  slug: string,
  timeframe: string = "12m",
  geo: string = ""
): Promise<boolean> {
  try {
    await prisma.comparison.delete({
      where: { slug_timeframe_geo: { slug, timeframe, geo } },
    });
    return true;
  } catch (error) {
    console.error(`[Refresh] Error clearing cache for ${slug}:`, error);
    return false;
  }
}

