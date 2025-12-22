/**
 * Bulk Seed Script - Generate Maximum Pages for SEO
 *
 * This script generates comparisons with multiple timeframe and geo combinations
 * to maximize the number of unique pages indexed by Google.
 *
 * For each keyword pair, it can generate:
 * - 5 timeframes (7d, 30d, 12m, 5y, all)
 * - 10+ geo regions (US, GB, CA, AU, etc.)
 * - Total: 50+ pages per keyword pair!
 *
 * Usage:
 *   npx tsx scripts/seed-bulk.ts [options]
 *
 * Options:
 *   --category <name>       Seed specific category
 *   --limit <number>        Limit keyword pairs (default: 10)
 *   --timeframes <list>     Comma-separated timeframes (default: 12m,5y)
 *   --geos <list>           Comma-separated geo codes (default: ,US,GB)
 *   --delay <ms>            Delay between requests (default: 3000ms)
 *   --all-timeframes        Use all 5 timeframes
 *   --all-geos              Use top 15 geo regions
 *   --skip-existing         Skip existing comparisons
 *
 * Examples:
 *   # Generate 10 music comparisons with 2 timeframes and 3 regions = 60 pages
 *   npx tsx scripts/seed-bulk.ts --category music --limit 10 --timeframes 12m,5y --geos ,US,GB
 *
 *   # Generate 50 tech comparisons with all timeframes and regions = 2,500+ pages
 *   npx tsx scripts/seed-bulk.ts --category tech --limit 50 --all-timeframes --all-geos
 *
 *   # Safe mode: 100 keywords, default settings = 600 pages
 *   npx tsx scripts/seed-bulk.ts --limit 100 --skip-existing
 */

import { execSync } from "child_process";

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (flag: string, defaultValue?: string): string | undefined => {
  const index = args.indexOf(flag);
  return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
};
const hasFlag = (flag: string): boolean => args.includes(flag);

const CATEGORY = getArg("--category");
const LIMIT = parseInt(getArg("--limit", "10") || "10", 10);
const DELAY = parseInt(getArg("--delay", "3000") || "3000", 10);
const SKIP_EXISTING = hasFlag("--skip-existing");

// Timeframe options
const ALL_TIMEFRAMES = ["7d", "30d", "12m", "5y", "all"];
const DEFAULT_TIMEFRAMES = ["12m", "5y"]; // Most popular
let timeframes: string[] = DEFAULT_TIMEFRAMES;

if (hasFlag("--all-timeframes")) {
  timeframes = ALL_TIMEFRAMES;
} else if (getArg("--timeframes")) {
  timeframes = (getArg("--timeframes") || "").split(",");
}

// Geo options (top markets for most industries)
const ALL_GEOS = [
  "",    // Worldwide
  "US",  // United States
  "GB",  // United Kingdom
  "CA",  // Canada
  "AU",  // Australia
  "IN",  // India
  "DE",  // Germany
  "FR",  // France
  "JP",  // Japan
  "BR",  // Brazil
  "MX",  // Mexico
  "ES",  // Spain
  "IT",  // Italy
  "NL",  // Netherlands
  "SE",  // Sweden
];
const DEFAULT_GEOS = ["", "US", "GB"]; // Worldwide, US, UK
let geos: string[] = DEFAULT_GEOS;

if (hasFlag("--all-geos")) {
  geos = ALL_GEOS;
} else if (getArg("--geos")) {
  geos = (getArg("--geos") || "").split(",");
}

// Calculate total pages
const totalPages = LIMIT * timeframes.length * geos.length;

console.log("\n🚀 Bulk Seeding Configuration\n");
console.log(`${"=".repeat(60)}`);
console.log(`📊 Configuration:`);
console.log(`   Category: ${CATEGORY || "All"}`);
console.log(`   Keyword pairs: ${LIMIT}`);
console.log(`   Timeframes: ${timeframes.join(", ")} (${timeframes.length})`);
console.log(`   Geo regions: ${geos.map(g => g || "worldwide").join(", ")} (${geos.length})`);
console.log(`   Delay: ${DELAY}ms`);
console.log(`   Skip existing: ${SKIP_EXISTING ? "Yes" : "No"}`);
console.log(`\n📈 Expected Output:`);
console.log(`   Total pages: ${totalPages} (${LIMIT} × ${timeframes.length} × ${geos.length})`);
console.log(`   Estimated time: ${Math.round((totalPages * DELAY) / 1000 / 60)} minutes`);
console.log(`${"=".repeat(60)}\n`);

// Confirmation prompt
if (totalPages > 1000 && !hasFlag("--yes")) {
  console.log(`⚠️  WARNING: You're about to generate ${totalPages} pages!`);
  console.log(`   This will take approximately ${Math.round((totalPages * DELAY) / 1000 / 60)} minutes.`);
  console.log(`   Add --yes flag to skip this confirmation.\n`);
  process.exit(0);
}

// Statistics
const stats = {
  startTime: Date.now(),
  totalAttempted: 0,
  totalSuccessful: 0,
  totalFailed: 0,
  totalSkipped: 0,
};

// Run seeding for each combination
let currentPage = 0;
for (const timeframe of timeframes) {
  for (const geo of geos) {
    currentPage++;
    const geoLabel = geo || "worldwide";
    console.log(`\n${"─".repeat(60)}`);
    console.log(`📍 Batch ${currentPage}/${timeframes.length * geos.length}: ${timeframe} × ${geoLabel}`);
    console.log(`${"─".repeat(60)}\n`);

    try {
      // Build command
      const cmd = [
        "npx tsx scripts/seed-comparisons.ts",
        `--limit ${LIMIT}`,
        `--timeframe ${timeframe}`,
        `--geo ${geo}`,
        `--delay ${DELAY}`,
        CATEGORY ? `--category ${CATEGORY}` : "",
        SKIP_EXISTING ? "--skip-existing" : "",
      ]
        .filter(Boolean)
        .join(" ");

      console.log(`💻 Command: ${cmd}\n`);

      // Execute and capture output
      const output = execSync(cmd, { encoding: "utf-8", stdio: "inherit" });

      stats.totalAttempted += LIMIT;
      stats.totalSuccessful += LIMIT; // Simplified - could parse actual output

      console.log(`\n✅ Batch ${currentPage} completed\n`);
    } catch (error) {
      console.error(`\n❌ Batch ${currentPage} failed:`, error);
      stats.totalFailed += LIMIT;
    }

    // Progress update
    const elapsed = Date.now() - stats.startTime;
    const remaining = (timeframes.length * geos.length) - currentPage;
    const avgTimePerBatch = elapsed / currentPage;
    const eta = remaining * avgTimePerBatch;

    console.log(`\n📊 Overall Progress:`);
    console.log(`   Batches: ${currentPage}/${timeframes.length * geos.length}`);
    console.log(`   Elapsed: ${Math.round(elapsed / 1000 / 60)}m`);
    console.log(`   ETA: ${Math.round(eta / 1000 / 60)}m`);
  }
}

// Final summary
const elapsed = Date.now() - stats.startTime;
console.log(`\n${"=".repeat(60)}`);
console.log(`✅ BULK SEEDING COMPLETE`);
console.log(`${"=".repeat(60)}`);
console.log(`📊 Final Statistics:`);
console.log(`   Total batches: ${timeframes.length * geos.length}`);
console.log(`   Total pages generated: ~${stats.totalSuccessful}`);
console.log(`   Total time: ${Math.round(elapsed / 1000 / 60)} minutes`);
console.log(`   Average rate: ${(stats.totalSuccessful / (elapsed / 1000 / 60)).toFixed(1)} pages/min`);

console.log(`\n💡 Next Steps:`);
console.log(`   1. Verify pages in database: npx prisma studio`);
console.log(`   2. Check sitemap: https://your-domain.com/sitemap.xml`);
console.log(`   3. Submit to Google Search Console`);
console.log(`   4. Monitor indexing progress (typically 1-7 days)`);
console.log(`\n✨ Your SEO game is about to explode! 🚀\n`);
