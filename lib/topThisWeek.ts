// lib/topThisWeek.ts
import { prisma } from "@/lib/db";
import { toCanonicalSlug } from "@/lib/slug";

export type TopItem = {
  slug: string;          // canonical compare slug (a-vs-b)
  title: string;         // "a vs b" human title
  count: number;         // how many times we built it this week
  tf?: string;           // last seen timeframe (optional)
  geo?: string;          // last seen region (optional)
};

// Strict type guard for a term string
const okTerm = (x: unknown): x is string => {
  if (typeof x !== "string") return false;
  const s = x.trim();
  return s.length >= 2 && s.length <= 60;
};

// Safe read of terms JSON
function readTerms(val: unknown): string[] | null {
  if (!val) return null;
  if (Array.isArray(val)) {
    const cleaned = val.filter(okTerm).map((t) => t.trim());
    return cleaned.length >= 2 ? cleaned.slice(0, 2) : null;
  }
  return null;
}

// Build a human title like "a vs b" from terms
function titleFromTerms(terms: string[]): string {
  return terms.map((t) => t.replace(/-/g, " ")).join(" vs ");
}

export async function getTopThisWeek(limit = 8): Promise<TopItem[]> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Pull recent comparisons from DB
  const rows = await prisma.comparison.findMany({
    where: { createdAt: { gte: since } },
    select: {
      slug: true,
      terms: true,        // JSON
      timeframe: true,
      geo: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 2000, // cap to keep it light even on busy weeks
  });

  // Aggregate by canonical slug to avoid duplicates
  const agg = new Map<
    string,
    { slug: string; title: string; count: number; tf?: string; geo?: string }
  >();

  for (const r of rows) {
    const terms = readTerms(r.terms);
    if (!terms) continue;

    // Canonicalise to "a-vs-b"
    const slug = toCanonicalSlug(terms);
    if (!slug) continue;

    const title = titleFromTerms(terms);
    const key = slug; // aggregate by slug only; tf/geo can vary

    const prev = agg.get(key);
    if (prev) {
      prev.count += 1;
      // keep the latest seen tf/geo (rows are sorted desc by createdAt)
      prev.tf ||= r.timeframe || undefined;
      prev.geo ||= r.geo || undefined;
    } else {
      agg.set(key, {
        slug,
        title,
        count: 1,
        tf: r.timeframe || undefined,
        geo: r.geo || undefined,
      });
    }
  }

  // Rank by count, then alphabetically for stability
  const sorted = Array.from(agg.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.title.localeCompare(b.title);
  });

  return sorted.slice(0, Math.max(1, limit));
}