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

// Quality blacklist - filter out test/demo comparisons
const QUALITY_BLACKLIST = new Set([
  'test', 'sample', 'demo', 'example', 'dummy', 'placeholder',
  'aaa', 'bbb', 'xxx', 'yyy', 'zzz', 'asdf', 'qwerty',
  'test1', 'test2', 'sample1', 'sample2', 'foo', 'bar', 'baz'
]);

// Check if term looks like a real search query
function isQualityTerm(term: string): boolean {
  const lower = term.toLowerCase().trim();

  // Block blacklisted terms
  if (QUALITY_BLACKLIST.has(lower)) return false;

  // Block if term is just numbers
  if (/^\d+$/.test(lower)) return false;

  // Block single letters
  if (lower.length === 1) return false;

  // Block terms with excessive special characters
  const specialCharCount = (lower.match(/[^a-z0-9\s]/g) || []).length;
  if (specialCharCount > lower.length / 2) return false;

  // Block terms that are all consonants or all vowels (likely gibberish)
  const noSpaces = lower.replace(/\s+/g, '');
  if (noSpaces.length > 3) {
    const hasVowels = /[aeiou]/.test(noSpaces);
    const hasConsonants = /[bcdfghjklmnpqrstvwxyz]/.test(noSpaces);
    if (!hasVowels || !hasConsonants) return false;
  }

  return true;
}

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
    { slug: string; title: string; count: number; tf?: string; geo?: string; lastSeen: Date }
  >();

  for (const r of rows) {
    const terms = readTerms(r.terms);
    if (!terms) continue;

    // Quality filter: Skip low-quality comparisons
    const allTermsQuality = terms.every(term => isQualityTerm(term));
    if (!allTermsQuality) continue;

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
      // Track most recent view
      if (r.createdAt && (!prev.lastSeen || r.createdAt > prev.lastSeen)) {
        prev.lastSeen = r.createdAt;
      }
    } else {
      agg.set(key, {
        slug,
        title,
        count: 1,
        tf: r.timeframe || undefined,
        geo: r.geo || undefined,
        lastSeen: r.createdAt,
      });
    }
  }

  // Enhanced ranking algorithm for better quality keywords
  const MIN_VIEWS_FOR_TRENDING = 2;
  
  // Calculate quality score for each comparison
  const scored = Array.from(agg.values())
    .filter(item => item.count >= MIN_VIEWS_FOR_TRENDING)
    .map(item => {
      // Quality factors:
      // 1. View count (primary) - more views = more popular
      // 2. Recency bonus - recent comparisons get slight boost
      // 3. Term quality - longer, more descriptive terms score higher
      // 4. Diversity - prefer comparisons with different categories
      
      const viewScore = item.count * 10; // Base score from views
      
      // Recency bonus (if viewed in last 3 days, add bonus)
      let recencyBonus = 0;
      if (item.lastSeen) {
        const daysSinceLastSeen = (Date.now() - item.lastSeen.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastSeen < 1) recencyBonus = 10; // Viewed today
        else if (daysSinceLastSeen < 3) recencyBonus = 5; // Viewed in last 3 days
        else if (daysSinceLastSeen < 7) recencyBonus = 2; // Viewed this week
      }
      
      // Term quality score (longer, more descriptive terms)
      const termLength = item.title.length;
      const termQuality = Math.min(10, termLength / 5); // Max 10 points for term quality
      
      // Check if terms are meaningful (not too short, not too generic)
      const terms = item.title.toLowerCase().split(' vs ');
      const hasMeaningfulTerms = terms.every(t => t.length >= 3 && !['the', 'a', 'an', 'and', 'or'].includes(t));
      const meaningfulBonus = hasMeaningfulTerms ? 3 : 0;
      
      const totalScore = viewScore + recencyBonus + termQuality + meaningfulBonus;
      
      return {
        ...item,
        score: totalScore,
        viewScore,
        recencyBonus,
        termQuality,
        meaningfulBonus,
      };
    });

  // Sort by quality score (descending), then by view count, then alphabetically
  const sorted = scored.sort((a, b) => {
    // Primary: Quality score
    if (Math.abs(b.score - a.score) > 1) {
      return b.score - a.score;
    }
    // Secondary: View count
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    // Tertiary: Alphabetical for stability
    return a.title.localeCompare(b.title);
  });

  // Return top N, but ensure we have quality comparisons
  const topResults = sorted.slice(0, Math.max(1, limit));
  
  // Log quality metrics for debugging
  if (topResults.length > 0) {
    console.log(`[TopThisWeek] Top comparison: ${topResults[0].title} (score: ${Math.round(topResults[0].score)}, views: ${topResults[0].count})`);
  }

  return topResults.map(({ score, viewScore, recencyBonus, termQuality, meaningfulBonus, ...item }) => item);
}