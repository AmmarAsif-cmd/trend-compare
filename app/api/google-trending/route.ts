import { NextResponse } from "next/server";

// Mock Google Trending data - In production, use Google Trends API or scraper
const MOCK_TRENDING = [
  { title: "AI advancements 2025", formattedTraffic: "2M+" },
  { title: "Climate summit results", formattedTraffic: "1.5M+" },
  { title: "Tech innovations", formattedTraffic: "1.2M+" },
  { title: "Global economy trends", formattedTraffic: "900K+" },
  { title: "Space exploration news", formattedTraffic: "750K+" },
  { title: "Health breakthroughs", formattedTraffic: "650K+" },
  { title: "Entertainment awards", formattedTraffic: "550K+" },
  { title: "Sports championships", formattedTraffic: "500K+" },
];

export async function GET() {
  try {
    // TODO: In production, fetch from Google Trends API or use pytrends
    // For now, return mock data with some randomization
    const shuffled = [...MOCK_TRENDING].sort(() => Math.random() - 0.5);

    return NextResponse.json({
      trending: shuffled,
      lastUpdate: new Date().toISOString(),
      source: "Google Trends"
    });
  } catch (error) {
    console.error("Error fetching Google trends:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending data" },
      { status: 500 }
    );
  }
}
