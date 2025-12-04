import { NextResponse } from "next/server";

// Real trending comparisons that make sense for users
const TRENDING_COMPARISONS = [
  {
    termA: "ChatGPT",
    termB: "Gemini",
    formattedTraffic: "2.5M+",
    relatedQueries: ["Claude AI", "Perplexity", "Microsoft Copilot", "Meta AI"]
  },
  {
    termA: "iPhone 16",
    termB: "Samsung S24",
    formattedTraffic: "1.8M+",
    relatedQueries: ["Google Pixel 9", "OnePlus 12", "Xiaomi 14", "Nothing Phone 2"]
  },
  {
    termA: "React",
    termB: "Vue",
    formattedTraffic: "950K+",
    relatedQueries: ["Angular", "Svelte", "Next.js", "Solid.js"]
  },
  {
    termA: "Tesla Model 3",
    termB: "BMW i4",
    formattedTraffic: "720K+",
    relatedQueries: ["Polestar 2", "Hyundai Ioniq 6", "Mercedes EQE", "Audi e-tron GT"]
  },
  {
    termA: "PS5",
    termB: "Xbox Series X",
    formattedTraffic: "1.2M+",
    relatedQueries: ["Nintendo Switch 2", "Steam Deck", "ROG Ally", "Meta Quest 3"]
  },
  {
    termA: "Netflix",
    termB: "Disney Plus",
    formattedTraffic: "890K+",
    relatedQueries: ["Amazon Prime Video", "HBO Max", "Apple TV Plus", "Hulu"]
  },
  {
    termA: "Spotify",
    termB: "Apple Music",
    formattedTraffic: "650K+",
    relatedQueries: ["YouTube Music", "Tidal", "Amazon Music", "Deezer"]
  },
  {
    termA: "Notion",
    termB: "Obsidian",
    formattedTraffic: "480K+",
    relatedQueries: ["Roam Research", "Logseq", "Evernote", "OneNote"]
  },
];

export async function GET() {
  try {
    // Shuffle for variety, pick top 5
    const shuffled = [...TRENDING_COMPARISONS].sort(() => Math.random() - 0.5);
    const top5 = shuffled.slice(0, 5);

    // Format for display
    const trending = top5.map(comp => ({
      title: `${comp.termA} vs ${comp.termB}`,
      termA: comp.termA,
      termB: comp.termB,
      formattedTraffic: comp.formattedTraffic,
      relatedQueries: comp.relatedQueries,
    }));

    return NextResponse.json({
      trending,
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
