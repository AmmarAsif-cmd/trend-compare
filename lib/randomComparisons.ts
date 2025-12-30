// lib/randomComparisons.ts
import { prisma } from "@/lib/db";
import type { ComparisonCategory } from "./category-resolver";

/**
 * Fisher-Yates shuffle algorithm for randomizing arrays
 */
function shuffleArray<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  let currentIndex = shuffled.length;
  let randomIndex: number;

  // Use seed for deterministic randomization
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  while (currentIndex !== 0) {
    randomIndex = Math.floor(random() * currentIndex);
    currentIndex--;
    [shuffled[currentIndex], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[currentIndex],
    ];
  }

  return shuffled;
}

/**
 * Get a time-based seed that changes every few hours
 * This ensures comparisons change over time but stay stable for a period
 */
function getTimeBasedSeed(periodHours: number = 4): number {
  const now = new Date();
  const hoursSinceEpoch = Math.floor(now.getTime() / (1000 * 60 * 60));
  return Math.floor(hoursSinceEpoch / periodHours);
}

/**
 * Get random comparisons for a category with time-based rotation
 * Fetches comparisons from database and randomizes them based on time
 */
export async function getRandomComparisonsForCategory(
  category: ComparisonCategory,
  limit: number = 10
): Promise<Array<{ slug: string; title: string; trending?: boolean }>> {
  try {
    // Get a time-based seed (changes every 4 hours)
    const seed = getTimeBasedSeed(4);
    
    // Fetch all comparisons for this category (prioritize recent ones)
    const comparisons = await prisma.comparison.findMany({
      where: {
        category: category,
      },
      select: {
        slug: true,
        terms: true,
        viewCount: true,
        createdAt: true,
      },
      orderBy: [
        { viewCount: 'desc' }, // Popular ones first
        { createdAt: 'desc' }, // Then recent ones
      ],
      take: 50, // Get more than needed for better randomization
    });

    if (comparisons.length === 0) {
      return [];
    }

    // Convert to format and shuffle with time-based seed
    const formatted = comparisons.map((comp) => {
      if (!Array.isArray(comp.terms) || comp.terms.length < 2) {
        return null;
      }
      return {
        slug: comp.slug,
        title: comp.terms.join(" vs "),
        trending: false,
      };
    }).filter((item): item is { slug: string; title: string; trending: boolean } => item !== null);

    // Shuffle with time-based seed (deterministic based on time period)
    const shuffled = shuffleArray(formatted, seed);
    
    // Return limited amount
    return shuffled.slice(0, limit);
  } catch (error) {
    console.warn(`[RandomComparisons] Failed to get random comparisons for ${category}:`, error);
    return [];
  }
}

/**
 * Get random comparisons across multiple categories
 * Useful for hero section keywords that need to rotate
 */
export async function getRandomComparisonsAcrossCategories(
  limit: number = 8
): Promise<Array<{ slug: string; title: string }>> {
  try {
    const seed = getTimeBasedSeed(6); // Change every 6 hours for hero keywords
    
    // Fetch popular comparisons from all categories
    const comparisons = await prisma.comparison.findMany({
      select: {
        slug: true,
        terms: true,
        viewCount: true,
      },
      orderBy: {
        viewCount: 'desc',
      },
      take: 100, // Get a good pool to randomize from
    });

    const formatted = comparisons
      .map((comp) => {
        if (!Array.isArray(comp.terms) || comp.terms.length < 2) {
          return null;
        }
        return {
          slug: comp.slug,
          title: comp.terms.join(" vs "),
        };
      })
      .filter((item): item is { slug: string; title: string } => item !== null);

    // Shuffle and return
    const shuffled = shuffleArray(formatted, seed);
    return shuffled.slice(0, limit);
  } catch (error) {
    console.warn('[RandomComparisons] Failed to get random comparisons:', error);
    return [];
  }
}


