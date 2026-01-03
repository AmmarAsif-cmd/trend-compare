// lib/dailyComparisonRotator.ts
import { prisma } from "@/lib/db";

/**
 * Get a comparison slug to display based on the current day
 * This ensures the hero chart rotates daily
 */
export async function getDailyComparisonSlug(): Promise<{ slug: string; termA: string; termB: string } | null> {
  try {
    // Get a seed based on the current day (changes daily)
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    
    // Fetch popular comparisons
    const comparisons = await prisma.comparison.findMany({
      select: {
        slug: true,
        terms: true,
        viewCount: true,
      },
      orderBy: {
        viewCount: 'desc',
      },
      take: 20, // Pool of popular comparisons to rotate through
    });

    if (comparisons.length === 0) {
      // Fallback to default
      return {
        slug: 'chatgpt-vs-gemini',
        termA: 'chatgpt',
        termB: 'gemini',
      };
    }

    // Use day of year as index (cycles through comparisons)
    const index = dayOfYear % comparisons.length;
    const selected = comparisons[index];

    if (!Array.isArray(selected.terms) || selected.terms.length < 2) {
      // Fallback
      return {
        slug: 'chatgpt-vs-gemini',
        termA: 'chatgpt',
        termB: 'gemini',
      };
    }

    return {
      slug: selected.slug,
      termA: String(selected.terms[0]),
      termB: String(selected.terms[1]),
    };
  } catch (error) {
    console.warn('[DailyComparisonRotator] Error getting daily comparison:', error);
    // Fallback
    return {
      slug: 'chatgpt-vs-gemini',
      termA: 'chatgpt',
      termB: 'gemini',
    };
  }
}


