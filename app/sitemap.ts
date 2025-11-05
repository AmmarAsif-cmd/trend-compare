// app/sitemap.ts
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://trendarc.net";

  const staticPages = [
    "",
    "about",
  ].map((path) => ({
    url: `${base}/${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
    lastModified: new Date(),
  }));

  let comparisons: { slug: string; updatedAt: Date }[] = [];
  try {
    comparisons = await prisma.comparison.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 1000,
    });
  } catch {
    console.warn("Skipping DB sitemap entries (DB offline)");
  }

  const dynamicPages = comparisons.map((r) => ({
    url: `${base}/compare/${r.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
    lastModified: r.updatedAt,
  }));

  return [...staticPages, ...dynamicPages];
}
