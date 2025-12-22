/**
 * Seed Comparisons Script
 *
 * Generates comparison pages from predefined keyword pairs to populate the database
 * and increase Google indexing.
 *
 * Usage:
 *   npx tsx scripts/seed-comparisons.ts [options]
 *
 * Options:
 *   --category <name>    Seed only specific category (music, movies, games, etc.)
 *   --limit <number>     Limit number of comparisons to generate (default: 10)
 *   --delay <ms>         Delay between requests in milliseconds (default: 2000)
 *   --timeframe <tf>     Timeframe to use (default: 12m)
 *   --geo <region>       Region code (default: '' for worldwide)
 *   --all                Generate all comparisons (overrides --limit)
 *   --shuffle            Randomize order of keywords
 *   --skip-existing      Skip comparisons that already exist in DB
 *
 * Examples:
 *   # Generate 50 music comparisons
 *   npx tsx scripts/seed-comparisons.ts --category music --limit 50
 *
 *   # Generate all tech comparisons with 3 second delay
 *   npx tsx scripts/seed-comparisons.ts --category tech --all --delay 3000
 *
 *   # Generate 100 random comparisons from all categories
 *   npx tsx scripts/seed-comparisons.ts --limit 100 --shuffle
 *
 *   # Generate everything (be careful with API quotas!)
 *   npx tsx scripts/seed-comparisons.ts --all --delay 5000
 */

import fs from "fs";
import path from "path";
import { prisma } from "../lib/db";
import { getOrBuildComparison } from "../lib/getOrBuild";
import { toCanonicalSlug } from "../lib/slug";

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (flag: string, defaultValue?: string): string | undefined => {
  const index = args.indexOf(flag);
  return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
};
const hasFlag = (flag: string): boolean => args.includes(flag);

const CATEGORY = getArg("--category");
const LIMIT = hasFlag("--all") ? Infinity : parseInt(getArg("--limit", "10") || "10", 10);
const DELAY = parseInt(getArg("--delay", "2000") || "2000", 10);
const TIMEFRAME = getArg("--timeframe", "12m") || "12m";
const GEO = getArg("--geo", "") || "";
const SHUFFLE = hasFlag("--shuffle");
const SKIP_EXISTING = hasFlag("--skip-existing");

// Load keyword database
const keywordsPath = path.join(process.cwd(), "data", "seed-keywords.json");

interface KeywordDatabase {
  [category: string]: string[][];
}

// Statistics tracking
const stats = {
  total: 0,
  successful: 0,
  failed: 0,
  skipped: 0,
  errors: [] as string[],
  startTime: Date.now(),
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Shuffle array in place (Fisher-Yates algorithm)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Format elapsed time
 */
function formatElapsedTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Print progress statistics
 */
function printProgress(current: number, total: number) {
  const elapsed = Date.now() - stats.startTime;
  const rate = stats.successful / (elapsed / 1000); // per second
  const remaining = total - current;
  const eta = remaining / Math.max(rate, 0.01); // Avoid division by zero

  console.log(`\n${"=".repeat(60)}`);
  console.log(`📊 Progress: ${current}/${total} (${Math.round((current / total) * 100)}%)`);
  console.log(`✅ Successful: ${stats.successful}`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log(`⏭️  Skipped: ${stats.skipped}`);
  console.log(`⏱️  Elapsed: ${formatElapsedTime(elapsed)}`);
  console.log(`⏳ ETA: ${formatElapsedTime(eta * 1000)}`);
  console.log(`⚡ Rate: ${rate.toFixed(2)} comparisons/sec`);
  console.log(`${"=".repeat(60)}\n`);
}

/**
 * Check if comparison already exists
 */
async function comparisonExists(slug: string, timeframe: string, geo: string): Promise<boolean> {
  const existing = await prisma.comparison.findUnique({
    where: {
      slug_timeframe_geo: { slug, timeframe, geo },
    },
    select: { id: true },
  });
  return !!existing;
}

/**
 * Generate a single comparison
 */
async function generateComparison(
  terms: string[],
  timeframe: string,
  geo: string,
  index: number,
  total: number
): Promise<{ success: boolean; slug: string; skipped: boolean }> {
  const slug = toCanonicalSlug(terms);
  if (!slug) {
    console.log(`⚠️  [${index}/${total}] Invalid slug for terms: ${terms.join(" vs ")}`);
    return { success: false, slug: "", skipped: false };
  }

  // Check if already exists
  if (SKIP_EXISTING) {
    const exists = await comparisonExists(slug, timeframe, geo);
    if (exists) {
      console.log(`⏭️  [${index}/${total}] Skipped (exists): ${terms.join(" vs ")}`);
      stats.skipped++;
      return { success: true, slug, skipped: true };
    }
  }

  try {
    console.log(`🔄 [${index}/${total}] Generating: ${terms.join(" vs ")} (${timeframe}, ${geo || "worldwide"})`);

    await getOrBuildComparison({
      slug,
      terms,
      timeframe,
      geo,
    });

    console.log(`✅ [${index}/${total}] Success: ${slug}`);
    stats.successful++;
    return { success: true, slug, skipped: false };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ [${index}/${total}] Failed: ${terms.join(" vs ")} - ${errorMsg}`);
    stats.failed++;
    stats.errors.push(`${slug}: ${errorMsg}`);
    return { success: false, slug, skipped: false };
  }
}

/**
 * Main seeding function
 */
async function main() {
  console.log("\n🌱 TrendArc Comparison Seeding System\n");
  console.log(`📁 Loading keywords from: ${keywordsPath}`);

  // Load keywords
  if (!fs.existsSync(keywordsPath)) {
    console.error(`❌ Keywords file not found: ${keywordsPath}`);
    console.log("\n💡 Create the file with:");
    console.log(`   mkdir -p data`);
    console.log(`   # Then add your keyword pairs in JSON format`);
    process.exit(1);
  }

  const keywords: KeywordDatabase = JSON.parse(
    fs.readFileSync(keywordsPath, "utf-8")
  );

  // Filter by category if specified
  let allPairs: Array<{ category: string; terms: string[] }> = [];

  if (CATEGORY) {
    if (!keywords[CATEGORY]) {
      console.error(`❌ Category not found: ${CATEGORY}`);
      console.log(`\n📂 Available categories: ${Object.keys(keywords).join(", ")}`);
      process.exit(1);
    }
    allPairs = keywords[CATEGORY].map((terms) => ({ category: CATEGORY, terms }));
    console.log(`✅ Loaded ${allPairs.length} keyword pairs from category: ${CATEGORY}`);
  } else {
    // Load all categories
    for (const [category, pairs] of Object.entries(keywords)) {
      allPairs.push(...pairs.map((terms) => ({ category, terms })));
    }
    console.log(`✅ Loaded ${allPairs.length} keyword pairs from ${Object.keys(keywords).length} categories`);
  }

  // Shuffle if requested
  if (SHUFFLE) {
    allPairs = shuffleArray(allPairs);
    console.log(`🔀 Shuffled keyword pairs`);
  }

  // Limit if specified
  const total = Math.min(allPairs.length, LIMIT);
  const pairsToGenerate = allPairs.slice(0, total);

  console.log(`\n⚙️  Configuration:`);
  console.log(`   Category: ${CATEGORY || "All"}`);
  console.log(`   Total pairs: ${total}`);
  console.log(`   Timeframe: ${TIMEFRAME}`);
  console.log(`   Geo: ${GEO || "worldwide"}`);
  console.log(`   Delay: ${DELAY}ms between requests`);
  console.log(`   Skip existing: ${SKIP_EXISTING ? "Yes" : "No"}`);
  console.log(`   Shuffle: ${SHUFFLE ? "Yes" : "No"}`);

  console.log(`\n🚀 Starting generation of ${total} comparisons...\n`);

  // Generate comparisons
  for (let i = 0; i < pairsToGenerate.length; i++) {
    const { category, terms } = pairsToGenerate[i];
    stats.total++;

    await generateComparison(terms, TIMEFRAME, GEO, i + 1, total);

    // Print progress every 10 comparisons
    if ((i + 1) % 10 === 0 || i === pairsToGenerate.length - 1) {
      printProgress(i + 1, total);
    }

    // Delay between requests to avoid rate limits
    if (i < pairsToGenerate.length - 1) {
      await sleep(DELAY);
    }
  }

  // Final statistics
  const elapsed = Date.now() - stats.startTime;
  console.log(`\n${"=".repeat(60)}`);
  console.log(`✅ SEEDING COMPLETE`);
  console.log(`${"=".repeat(60)}`);
  console.log(`📊 Final Statistics:`);
  console.log(`   Total attempted: ${stats.total}`);
  console.log(`   ✅ Successful: ${stats.successful}`);
  console.log(`   ❌ Failed: ${stats.failed}`);
  console.log(`   ⏭️  Skipped: ${stats.skipped}`);
  console.log(`   ⏱️  Total time: ${formatElapsedTime(elapsed)}`);
  console.log(`   ⚡ Average rate: ${(stats.successful / (elapsed / 1000)).toFixed(2)} comparisons/sec`);

  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors (showing first 10):`);
    stats.errors.slice(0, 10).forEach((error) => {
      console.log(`   - ${error}`);
    });
  }

  console.log(`\n💡 Next steps:`);
  console.log(`   1. Check generated comparisons: npx prisma studio`);
  console.log(`   2. Verify pages are accessible: https://your-domain.com/compare/[slug]`);
  console.log(`   3. Submit sitemap to Google: https://search.google.com/search-console`);
  console.log(`   4. Monitor indexing progress in Google Search Console`);
  console.log(`\n✨ Happy seeding!\n`);

  await prisma.$disconnect();
}

// Run the script
main().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
