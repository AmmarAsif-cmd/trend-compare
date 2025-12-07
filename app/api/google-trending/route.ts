import { NextResponse } from "next/server";
import { getRealTimeTrending } from "@/lib/real-time-trending";
import { isValidKeyword } from "@/lib/keyword-validator";

// Category definitions - Keywords are automatically categorized
const CATEGORIES = {
  tech: ['ai', 'chatgpt', 'gemini', 'claude', 'copilot', 'perplexity', 'openai', 'app', 'software', 'tech', 'code', 'developer'],
  phones: ['iphone', 'samsung', 'galaxy', 'pixel', 'phone', 'android', 'ios', 'oneplus', 'xiaomi'],
  streaming: ['netflix', 'disney', 'hulu', 'hbo', 'prime', 'spotify', 'apple music', 'youtube music', 'music', 'video'],
  gaming: ['ps5', 'xbox', 'playstation', 'nintendo', 'switch', 'steam', 'game', 'gaming', 'fortnite', 'minecraft'],
  social: ['facebook', 'instagram', 'twitter', 'x', 'tiktok', 'snapchat', 'threads', 'social', 'meta'],
  ecommerce: ['amazon', 'ebay', 'shopify', 'etsy', 'walmart', 'target', 'shopping'],
  sports: ['football', 'cricket', 'basketball', 'soccer', 'nba', 'nfl', 'sports', 'player', 'team'],
  cars: ['tesla', 'bmw', 'mercedes', 'toyota', 'honda', 'ford', 'car', 'ev', 'electric'],
};

function categorizeKeyword(keyword: string): string | null {
  const lower = keyword.toLowerCase();

  for (const [category, patterns] of Object.entries(CATEGORIES)) {
    if (patterns.some(pattern => lower.includes(pattern))) {
      return category;
    }
  }

  return null;
}

export async function GET() {
  try {
    // Fetch trending keywords from Google Trends
    const trendingItems = await getRealTimeTrending('US', 50);

    // Group keywords by category (with validation)
    const categorizedKeywords: Record<string, Array<{ keyword: string; traffic: string }>> = {};

    for (const item of trendingItems) {
      // Validate keyword before processing
      if (!isValidKeyword(item.keyword)) {
        console.warn(`[Google Trending API] Rejected invalid keyword: "${item.keyword}"`);
        continue;
      }

      const category = categorizeKeyword(item.keyword);
      if (category) {
        if (!categorizedKeywords[category]) {
          categorizedKeywords[category] = [];
        }
        categorizedKeywords[category].push({
          keyword: item.keyword,
          traffic: item.formattedTraffic || 'Trending'
        });
      }
    }

    console.log('[Google Trending API] Categories found:', Object.keys(categorizedKeywords).map(cat =>
      `${cat}: ${categorizedKeywords[cat].length} keywords`
    ).join(', '));

    // Create comparisons within each category
    const comparisons: Array<{ title: string; termA: string; termB: string; formattedTraffic: string }> = [];
    const seen = new Set<string>();

    // Shuffle categories for variety
    const categories = Object.keys(categorizedKeywords).sort(() => Math.random() - 0.5);

    for (const category of categories) {
      const keywords = categorizedKeywords[category];

      // Shuffle keywords within category
      const shuffled = [...keywords].sort(() => Math.random() - 0.5);

      // Create pairs within the same category
      for (let i = 0; i < shuffled.length - 1; i += 2) {
        if (comparisons.length >= 5) break;

        const term1 = shuffled[i];
        const term2 = shuffled[i + 1];

        // Create deduplication key
        const key = [term1.keyword.toLowerCase(), term2.keyword.toLowerCase()]
          .sort()
          .join('-vs-');

        if (!seen.has(key)) {
          seen.add(key);
          comparisons.push({
            title: `${term1.keyword} vs ${term2.keyword}`,
            termA: term1.keyword,
            termB: term2.keyword,
            formattedTraffic: term1.traffic,
          });
          console.log(`[Google Trending API] ✓ ${category}: ${term1.keyword} vs ${term2.keyword}`);
        }
      }

      if (comparisons.length >= 5) break;
    }

    // Fallback if not enough trending comparisons
    if (comparisons.length < 5) {
      console.log(`[Google Trending API] Only ${comparisons.length} comparisons, adding popular ones...`);

      const fallbackByCategory = [
        { termA: 'ChatGPT', termB: 'Gemini', formattedTraffic: '2.5M+' },
        { termA: 'iPhone', termB: 'Samsung Galaxy', formattedTraffic: '1.8M+' },
        { termA: 'Netflix', termB: 'Disney Plus', formattedTraffic: '890K+' },
        { termA: 'PS5', termB: 'Xbox Series X', formattedTraffic: '720K+' },
        { termA: 'Spotify', termB: 'Apple Music', formattedTraffic: '580K+' },
        { termA: 'Instagram', termB: 'TikTok', formattedTraffic: '1.2M+' },
        { termA: 'Tesla', termB: 'BMW', formattedTraffic: '450K+' },
      ].sort(() => Math.random() - 0.5);

      for (const comp of fallbackByCategory) {
        if (comparisons.length >= 5) break;

        const key = [comp.termA.toLowerCase(), comp.termB.toLowerCase()]
          .sort()
          .join('-vs-');

        if (!seen.has(key)) {
          seen.add(key);
          comparisons.push({
            title: `${comp.termA} vs ${comp.termB}`,
            ...comp
          });
        }
      }
    }

    return NextResponse.json({
      trending: comparisons,
      lastUpdate: new Date().toISOString(),
      source: "Google Trends (Live)"
    });
  } catch (error) {
    console.error("Error fetching Google trends:", error);

    // Fallback comparisons
    const fallbackComparisons = [
      { termA: 'ChatGPT', termB: 'Gemini', formattedTraffic: '2.5M+' },
      { termA: 'iPhone', termB: 'Samsung Galaxy', formattedTraffic: '1.8M+' },
      { termA: 'Netflix', termB: 'Disney Plus', formattedTraffic: '890K+' },
      { termA: 'PS5', termB: 'Xbox Series X', formattedTraffic: '720K+' },
      { termA: 'Instagram', termB: 'TikTok', formattedTraffic: '1.2M+' },
    ].map(comp => ({
      title: `${comp.termA} vs ${comp.termB}`,
      ...comp
    }));

    return NextResponse.json({
      trending: fallbackComparisons,
      lastUpdate: new Date().toISOString(),
      source: "Popular Comparisons"
    });
  }
}
