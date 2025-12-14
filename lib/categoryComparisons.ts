// lib/categoryComparisons.ts
import { prisma } from "@/lib/db";
import type { ComparisonCategory } from "./category-resolver";

export type CategoryInfo = {
  id: ComparisonCategory;
  name: string;
  emoji: string;
  description: string;
  curated: Array<{
    slug: string;
    title: string;
  }>;
};

/**
 * Curated comparisons for each category
 * These are hand-picked, high-quality comparisons that showcase each category
 */
export const CATEGORY_DATA: CategoryInfo[] = [
  {
    id: "movies",
    name: "Movies & TV",
    emoji: "🎬",
    description: "Compare films, shows, and streaming platforms",
    curated: [
      { slug: "netflix-vs-disney-plus", title: "Netflix vs Disney+" },
      { slug: "avatar-vs-inception", title: "Avatar vs Inception" },
      { slug: "marvel-vs-dc", title: "Marvel vs DC" },
      { slug: "netflix-vs-hbo-max", title: "Netflix vs HBO Max" },
    ],
  },
  {
    id: "music",
    name: "Music",
    emoji: "🎵",
    description: "Compare artists, albums, and streaming services",
    curated: [
      { slug: "spotify-vs-apple-music", title: "Spotify vs Apple Music" },
      { slug: "taylor-swift-vs-beyonce", title: "Taylor Swift vs Beyoncé" },
      { slug: "drake-vs-kendrick-lamar", title: "Drake vs Kendrick Lamar" },
      { slug: "youtube-music-vs-spotify", title: "YouTube Music vs Spotify" },
    ],
  },
  {
    id: "games",
    name: "Gaming",
    emoji: "🎮",
    description: "Compare video games and gaming platforms",
    curated: [
      { slug: "fortnite-vs-minecraft", title: "Fortnite vs Minecraft" },
      { slug: "playstation-5-vs-xbox-series-x", title: "PS5 vs Xbox Series X" },
      { slug: "cod-vs-battlefield", title: "Call of Duty vs Battlefield" },
      { slug: "steam-vs-epic-games", title: "Steam vs Epic Games" },
    ],
  },
  {
    id: "tech",
    name: "Technology",
    emoji: "💻",
    description: "Compare programming languages, frameworks, and dev tools",
    curated: [
      { slug: "chatgpt-vs-gemini", title: "ChatGPT vs Gemini" },
      { slug: "react-vs-vue", title: "React vs Vue" },
      { slug: "python-vs-javascript", title: "Python vs JavaScript" },
      { slug: "aws-vs-azure", title: "AWS vs Azure" },
    ],
  },
  {
    id: "products",
    name: "Products",
    emoji: "📱",
    description: "Compare consumer products and electronics",
    curated: [
      { slug: "iphone-vs-samsung", title: "iPhone vs Samsung" },
      { slug: "tesla-vs-bmw", title: "Tesla vs BMW" },
      { slug: "nike-vs-adidas", title: "Nike vs Adidas" },
      { slug: "airpods-vs-galaxy-buds", title: "AirPods vs Galaxy Buds" },
    ],
  },
  {
    id: "brands",
    name: "Brands",
    emoji: "🏢",
    description: "Compare companies and business services",
    curated: [
      { slug: "apple-vs-microsoft", title: "Apple vs Microsoft" },
      { slug: "google-vs-facebook", title: "Google vs Facebook" },
      { slug: "uber-vs-lyft", title: "Uber vs Lyft" },
      { slug: "amazon-vs-walmart", title: "Amazon vs Walmart" },
    ],
  },
];

/**
 * Get trending comparisons for a specific category from the database
 * Returns comparisons from the last 7 days that match the category
 */
export async function getTrendingByCategory(
  category: ComparisonCategory,
  limit: number = 3
): Promise<Array<{ slug: string; title: string; count: number }>> {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Fetch comparisons with this category
    const rows = await prisma.comparison.findMany({
      where: {
        category: category,
        createdAt: { gte: since },
      },
      select: {
        slug: true,
        terms: true,
      },
      take: 100, // Get enough to aggregate
    });

    // Aggregate by slug and count
    const counts = new Map<string, { slug: string; title: string; count: number }>();

    for (const row of rows) {
      if (!Array.isArray(row.terms) || row.terms.length < 2) continue;

      const slug = row.slug;
      const title = row.terms.join(" vs ");

      if (counts.has(slug)) {
        counts.get(slug)!.count += 1;
      } else {
        counts.set(slug, { slug, title, count: 1 });
      }
    }

    // Sort by count and return top N
    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch (error) {
    console.warn(`[CategoryComparisons] Failed to get trending for ${category}:`, error);
    return [];
  }
}

/**
 * Get hybrid comparisons for a category (curated + trending)
 * Returns up to 4 comparisons: curated first, then trending if available
 */
export async function getHybridComparisons(
  category: ComparisonCategory,
  limit: number = 4
): Promise<Array<{ slug: string; title: string; trending?: boolean }>> {
  const categoryData = CATEGORY_DATA.find((c) => c.id === category);
  if (!categoryData) return [];

  // Get curated comparisons (first 2)
  const curated = categoryData.curated.slice(0, 2).map((c) => ({
    slug: c.slug,
    title: c.title,
    trending: false,
  }));

  // Get trending comparisons (up to 2)
  const trending = await getTrendingByCategory(category, 2);
  const trendingMapped = trending.map((t) => ({
    slug: t.slug,
    title: t.title,
    trending: true,
  }));

  // Combine: curated + trending, remove duplicates, limit to requested amount
  const combined = [...curated, ...trendingMapped];
  const uniqueSlugs = new Set<string>();
  const unique = combined.filter((item) => {
    if (uniqueSlugs.has(item.slug)) return false;
    uniqueSlugs.add(item.slug);
    return true;
  });

  return unique.slice(0, limit);
}
