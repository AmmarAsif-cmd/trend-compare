/**
 * Script to refresh all comparisons
 * Run: npx tsx scripts/refresh-all-comparisons.ts
 */

import { refreshOldComparisons, refreshTrendingComparisons } from "../lib/refresh-comparisons";

async function main() {
  console.log("🔄 Starting comparison refresh...\n");

  // Refresh trending comparisons first (most important)
  console.log("1️⃣ Refreshing trending comparisons...");
  const trendingResult = await refreshTrendingComparisons(20);
  console.log(`   ✅ Refreshed: ${trendingResult.refreshed}`);
  console.log(`   ❌ Failed: ${trendingResult.failed}\n`);

  // Refresh old comparisons (older than 7 days)
  console.log("2️⃣ Refreshing old comparisons (older than 7 days)...");
  const oldResult = await refreshOldComparisons(7, 100);
  console.log(`   ✅ Refreshed: ${oldResult.refreshed}`);
  console.log(`   ❌ Failed: ${oldResult.failed}`);
  if (oldResult.errors.length > 0) {
    console.log(`   ⚠️ Errors: ${oldResult.errors.slice(0, 5).join(", ")}`);
  }

  console.log("\n✅ Refresh complete!");
  console.log(`   Total refreshed: ${trendingResult.refreshed + oldResult.refreshed}`);
  console.log(`   Total failed: ${trendingResult.failed + oldResult.failed}`);
}

main().catch(console.error);

