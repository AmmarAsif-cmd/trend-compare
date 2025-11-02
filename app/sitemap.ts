import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Seed a few high-value comparisons so crawlers have starting points
  const seeds = [
    "chatgpt-vs-gemini",
    "iphone-16-vs-iphone-17",
    "python-vs-javascript",
    "openai-vs-google",
  ] as const;

  // Try to read some recent slugs from DB (okay if this fails in preview)
  let rows: { slug: string; updatedAt: Date }[] = [];
  try {
    rows = await prisma.comparison.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 1000,
    });
  } catch {
    // ignore
  }

  const home: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly" as const, priority: 0.8 },
  ];

  const seedEntries: MetadataRoute.Sitemap = seeds.map((s) => ({
    url: `${base}/compare/${s}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
    lastModified: new Date(),
  }));

  const dbEntries: MetadataRoute.Sitemap = rows.map((r) => ({
    url: `${base}/compare/${r.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
    lastModified: r.updatedAt,
  }));

  const all = [...home, ...seedEntries, ...dbEntries];

  // Dedupe URLs
  const seen = new Set<string>();
  return all.filter((u) => (seen.has(u.url) ? false : (seen.add(u.url), true)));
}
