// app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://trendarc.net";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/*?q="}],
    sitemap: `${base}/sitemap.xml`,
  };
}
