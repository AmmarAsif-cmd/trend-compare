import { NextResponse } from "next/server";
import { getRealTimeTrending } from "@/lib/real-time-trending";
import { isValidKeyword } from "@/lib/keyword-validator";

export async function GET() {
  try {
    // Fetch trending keywords from Google Trends
    const trendingItems = await getRealTimeTrending('US', 20);

    // Extract and validate keywords
    const keywords: Array<{ keyword: string; traffic: string }> = [];
    const seen = new Set<string>();

    for (const item of trendingItems) {
      // Validate keyword
      if (!isValidKeyword(item.keyword)) {
        continue;
      }

      const lowerKeyword = item.keyword.toLowerCase();

      // Avoid duplicates
      if (seen.has(lowerKeyword)) {
        continue;
      }

      seen.add(lowerKeyword);
      keywords.push({
        keyword: item.keyword,
        traffic: item.formattedTraffic || 'Trending',
      });

      // Limit to 10 keywords
      if (keywords.length >= 10) {
        break;
      }
    }

    return NextResponse.json({
      keywords,
      lastUpdate: new Date().toISOString(),
      source: "Google Trends (Live)",
    });
  } catch (error) {
    console.error("Error fetching top keywords:", error);

    // Return empty array on error
    return NextResponse.json({
      keywords: [],
      lastUpdate: new Date().toISOString(),
      source: "Error",
    });
  }
}
