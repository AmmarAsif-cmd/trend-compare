// app/sitemap.ts
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";       // Prisma needs node runtime
export const revalidate = 60 * 60;     // Regenerate sitemap hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://trendarc.net";

  // 1️⃣ Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1, lastModified: new Date() },
    { url: `${base}/about`, changeFrequency: "weekly", priority: 0.8, lastModified: new Date() },
  ];

  // 2️⃣ SEO seed comparisons – grouped by category
  const seeds = [
    // 🔹 AI & Tech
    "chatgpt-vs-gemini",
    "chatgpt-vs-copilot",
    "chatgpt-vs-claude",
    "openai-vs-anthropic",
    "gpt-4-vs-gpt-3-5",
    "midjourney-vs-dalle",
    "google-bard-vs-gemini",
    "perplexity-vs-chatgpt",
    "notion-ai-vs-chatgpt",
    "sora-vs-runway",
    "github-copilot-vs-tabnine",
    "microsoft-edge-vs-google-chrome",
    "windows-11-vs-macos",
    "android-vs-ios",

    // 🔹 Smartphones & Gadgets
    "iphone-16-vs-iphone-17",
    "iphone-vs-samsung",
    "samsung-s24-vs-iphone-15",
    "macbook-air-vs-macbook-pro",
    "ipad-vs-surface-pro",
    "apple-watch-vs-fitbit",
    "ps5-vs-xbox-series-x",
    "nintendo-switch-vs-ps5",
    "airpods-pro-vs-bose-qc",
    "google-pixel-8-vs-iphone-15",

    // 🔹 Business & Software
    "microsoft-teams-vs-slack",
    "zoom-vs-google-meet",
    "notion-vs-evernote",
    "asana-vs-clickup",
    "dropbox-vs-google-drive",
    "figma-vs-adobe-xd",
    "spotify-vs-apple-music",
    "chatgpt-plus-vs-free-plan",
    "google-one-vs-icloud",
    "obsidian-vs-notion",

    // 🔹 Crypto & Finance
    "bitcoin-vs-ethereum",
    "solana-vs-cardano",
    "dogecoin-vs-shiba-inu",
    "paypal-vs-wise",
    "revolut-vs-monzo",
    "visa-vs-mastercard",
    "stock-market-vs-crypto",
    "gold-vs-bitcoin",
    "coinbase-vs-binance",

    // 🔹 Entertainment
    "netflix-vs-disney-plus",
    "netflix-vs-amazon-prime",
    "spotify-vs-youtube-music",
    "taylor-swift-vs-beyonce",
    "kanye-west-vs-drake",
    "barbie-vs-oppenheimer",
    "marvel-vs-dc",
    "ronaldo-vs-messi",
    "elon-musk-vs-mark-zuckerberg",

    // 🔹 Sports
    "premier-league-vs-la-liga",
    "cristiano-ronaldo-vs-lionel-messi",
    "england-vs-india-cricket",
    "nba-vs-nfl",
    "f1-vs-nascar",
    "lebron-james-vs-stephen-curry",
    "serena-williams-vs-venus-williams",
    "cricket-vs-football",
    "uefa-champions-league-vs-world-cup",

    // 🔹 Lifestyle & General
    "coffee-vs-tea",
    "vegan-vs-keto",
    "gym-vs-yoga",
    "airbnb-vs-booking-com",
    "tesla-vs-toyota",
    "electric-vs-hybrid",
    "uber-vs-lyft",
    "apple-vs-samsung",
    "ai-vs-human-creativity",
  ];

  const seedPages: MetadataRoute.Sitemap = seeds.map((slug) => ({
    url: `${base}/compare/${slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
    lastModified: new Date(),
  }));

  // 3️⃣ Dynamic pages from your DB (latest 5k)
  let dynamicPages: MetadataRoute.Sitemap = [];
  try {
    const rows = await prisma.comparison.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    });

    const seen = new Set<string>(seeds);
    dynamicPages = rows
      .filter((r) => r.slug && !seen.has(r.slug))
      .map((r) => ({
        url: `${base}/compare/${r.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.6,
        lastModified: r.updatedAt ?? new Date(),
      }));
  } catch (err) {
    console.warn("[sitemap] Skipping DB entries:", err);
  }

  return [...staticPages, ...seedPages, ...dynamicPages];
}
