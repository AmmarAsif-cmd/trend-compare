/**
 * Automated Seeding Scheduler
 *
 * Runs seeding operations on a schedule to gradually populate the database
 * without overwhelming the API quotas.
 *
 * This script is designed to run continuously (e.g., via PM2, systemd, or Docker)
 * and will automatically seed comparisons at regular intervals.
 *
 * Usage:
 *   npx tsx scripts/seed-scheduler.ts [options]
 *
 * Options:
 *   --interval <minutes>    Run every N minutes (default: 60)
 *   --batch-size <number>   Comparisons per batch (default: 20)
 *   --mode <mode>           Seeding mode: sequential, random, category (default: random)
 *   --category <name>       Focus on specific category (only with mode=category)
 *
 * Examples:
 *   # Run every 30 minutes, seed 20 random comparisons
 *   npx tsx scripts/seed-scheduler.ts --interval 30 --batch-size 20
 *
 *   # Focus on tech category, run every hour
 *   npx tsx scripts/seed-scheduler.ts --mode category --category tech --interval 60
 *
 *   # Production deployment with PM2:
 *   pm2 start "npx tsx scripts/seed-scheduler.ts --interval 60" --name trendarc-seeder
 *
 * Environment Variables:
 *   SEEDER_ENABLED=true       Enable/disable scheduler (default: true)
 *   SEEDER_INTERVAL=60        Override interval in minutes
 *   SEEDER_BATCH_SIZE=20      Override batch size
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// Parse arguments
const args = process.argv.slice(2);
const getArg = (flag: string, defaultValue?: string): string | undefined => {
  const index = args.indexOf(flag);
  return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
};

// Configuration
const INTERVAL = parseInt(
  process.env.SEEDER_INTERVAL || getArg("--interval", "60") || "60",
  10
);
const BATCH_SIZE = parseInt(
  process.env.SEEDER_BATCH_SIZE || getArg("--batch-size", "20") || "20",
  10
);
const MODE = getArg("--mode", "random") || "random";
const CATEGORY = getArg("--category");
const ENABLED = process.env.SEEDER_ENABLED !== "false";

// State file to track progress
const stateFile = path.join(process.cwd(), "data", "seeder-state.json");

interface SeedState {
  lastRun: string;
  totalSeeded: number;
  currentCategory: string;
  categoryProgress: Record<string, number>;
  errors: number;
}

// Load or initialize state
function loadState(): SeedState {
  if (fs.existsSync(stateFile)) {
    return JSON.parse(fs.readFileSync(stateFile, "utf-8"));
  }
  return {
    lastRun: new Date().toISOString(),
    totalSeeded: 0,
    currentCategory: "music",
    categoryProgress: {},
    errors: 0,
  };
}

// Save state
function saveState(state: SeedState) {
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

// Get next category (for sequential mode)
function getNextCategory(current: string): string {
  const categories = [
    "music",
    "movies",
    "games",
    "tech",
    "products",
    "people",
    "brands",
    "places",
    "general",
  ];
  const index = categories.indexOf(current);
  return categories[(index + 1) % categories.length];
}

// Run a seeding batch
async function runBatch(state: SeedState): Promise<boolean> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🌱 Seeding Batch at ${new Date().toLocaleString()}`);
  console.log(`${"=".repeat(60)}`);
  console.log(`⚙️  Configuration:`);
  console.log(`   Mode: ${MODE}`);
  console.log(`   Batch size: ${BATCH_SIZE}`);
  console.log(`   Category: ${CATEGORY || state.currentCategory}`);
  console.log(`   Total seeded so far: ${state.totalSeeded}`);
  console.log(`${"─".repeat(60)}\n`);

  try {
    let cmd = "";

    switch (MODE) {
      case "sequential":
        // Seed categories one by one
        cmd = `npx tsx scripts/seed-comparisons.ts --category ${state.currentCategory} --limit ${BATCH_SIZE} --skip-existing --shuffle`;
        state.currentCategory = getNextCategory(state.currentCategory);
        break;

      case "category":
        // Focus on specific category
        if (!CATEGORY) {
          console.error("❌ --category required for category mode");
          return false;
        }
        cmd = `npx tsx scripts/seed-comparisons.ts --category ${CATEGORY} --limit ${BATCH_SIZE} --skip-existing --shuffle`;
        break;

      case "random":
      default:
        // Random from all categories
        cmd = `npx tsx scripts/seed-comparisons.ts --limit ${BATCH_SIZE} --skip-existing --shuffle`;
        break;
    }

    console.log(`💻 Running: ${cmd}\n`);
    execSync(cmd, { encoding: "utf-8", stdio: "inherit" });

    // Update state
    state.totalSeeded += BATCH_SIZE;
    state.lastRun = new Date().toISOString();
    saveState(state);

    console.log(`\n✅ Batch completed successfully`);
    console.log(`📊 Total pages seeded: ${state.totalSeeded}`);
    return true;
  } catch (error) {
    console.error(`\n❌ Batch failed:`, error);
    state.errors++;
    saveState(state);
    return false;
  }
}

// Main scheduler loop
async function scheduler() {
  if (!ENABLED) {
    console.log("⏸️  Scheduler is disabled (SEEDER_ENABLED=false)");
    process.exit(0);
  }

  console.log(`\n🤖 TrendArc Automated Seeding Scheduler`);
  console.log(`${"=".repeat(60)}`);
  console.log(`⚙️  Configuration:`);
  console.log(`   Interval: ${INTERVAL} minutes`);
  console.log(`   Batch size: ${BATCH_SIZE} comparisons`);
  console.log(`   Mode: ${MODE}`);
  console.log(`   Category: ${CATEGORY || "Auto-rotating"}`);
  console.log(`${"=".repeat(60)}\n`);

  const state = loadState();

  console.log(`📊 Current State:`);
  console.log(`   Last run: ${state.lastRun}`);
  console.log(`   Total seeded: ${state.totalSeeded}`);
  console.log(`   Current category: ${state.currentCategory}`);
  console.log(`   Errors: ${state.errors}\n`);

  // Run immediately on start
  console.log(`🚀 Running initial batch...\n`);
  await runBatch(state);

  // Schedule subsequent runs
  const intervalMs = INTERVAL * 60 * 1000;
  console.log(`\n⏰ Next run scheduled in ${INTERVAL} minutes`);

  setInterval(async () => {
    await runBatch(state);
    console.log(`\n⏰ Next run scheduled in ${INTERVAL} minutes`);
  }, intervalMs);

  // Keep process alive
  process.on("SIGINT", () => {
    console.log(`\n\n👋 Scheduler stopped gracefully`);
    console.log(`📊 Final statistics:`);
    console.log(`   Total seeded: ${state.totalSeeded}`);
    console.log(`   Errors: ${state.errors}`);
    process.exit(0);
  });
}

// Start scheduler
scheduler().catch((error) => {
  console.error("\n❌ Scheduler failed:", error);
  process.exit(1);
});
