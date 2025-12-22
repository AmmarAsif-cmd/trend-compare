/**
 * Import Keywords from seed-keywords.json
 *
 * Imports the curated keyword pairs from data/seed-keywords.json into the database
 * with quality checking.
 *
 * Usage:
 *   npx tsx scripts/import-seed-keywords.ts [options]
 *
 * Options:
 *   --category <name>     Import only specific category
 *   --min-quality <score> Minimum quality score (default: 50)
 *   --dry-run             Preview without importing
 *
 * Examples:
 *   # Import all keywords from seed file
 *   npx tsx scripts/import-seed-keywords.ts
 *
 *   # Import only tech keywords
 *   npx tsx scripts/import-seed-keywords.ts --category tech
 *
 *   # Preview what would be imported
 *   npx tsx scripts/import-seed-keywords.ts --dry-run
 */

import fs from "fs";
import path from "path";
import { prisma } from "../lib/db";
import { scoreKeywordPair, getQualityLabel, analyzeKeywordDatabase } from "../lib/keyword-quality";

// Parse arguments
const args = process.argv.slice(2);
const getArg = (flag: string, defaultValue?: string): string | undefined => {
  const index = args.indexOf(flag);
  return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
};
const hasFlag = (flag: string): boolean => args.includes(flag);

const CATEGORY = getArg("--category");
const MIN_QUALITY = parseInt(getArg("--min-quality", "50") || "50", 10);
const DRY_RUN = hasFlag("--dry-run");

interface ImportStats {
  total: number;
  imported: number;
  skipped: number;
  lowQuality: number;
  errors: number;
  byCategory: Record<string, number>;
}

async function main() {
  console.log("\n📥 Seed Keywords Import Tool\n");
  console.log(`${"=".repeat(60)}`);
  console.log(`⚙️  Configuration:`);
  console.log(`   Category: ${CATEGORY || "All"}`);
  console.log(`   Min quality: ${MIN_QUALITY}/100`);
  console.log(`   Dry run: ${DRY_RUN ? "Yes" : "No"}`);
  console.log(`${"=".repeat(60)}\n`);

  const stats: ImportStats = {
    total: 0,
    imported: 0,
    skipped: 0,
    lowQuality: 0,
    errors: 0,
    byCategory: {},
  };

  try {
    // Load seed keywords
    const seedPath = path.join(process.cwd(), "data", "seed-keywords.json");

    if (!fs.existsSync(seedPath)) {
      console.error(`❌ Seed file not found: ${seedPath}`);
      process.exit(1);
    }

    const keywords: Record<string, Array<[string, string]>> = JSON.parse(
      fs.readFileSync(seedPath, "utf-8")
    );

    // Analyze quality of entire database first
    console.log(`📊 Analyzing seed keyword quality...\n`);
    const analysis = analyzeKeywordDatabase(keywords);

    console.log(`Quality Report by Category:`);
    console.log(`${"─".repeat(60)}`);
    for (const [category, info] of Object.entries(analysis)) {
      console.log(
        `   ${category.padEnd(12)} | ${info.count.toString().padStart(3)} pairs | Avg: ${info.averageScore}/100 (${info.quality})`
      );
    }
    console.log(`${"─".repeat(60)}\n`);

    // Filter by category if specified
    let categoriesToImport = CATEGORY ? [CATEGORY] : Object.keys(keywords);

    if (CATEGORY && !keywords[CATEGORY]) {
      console.error(`❌ Category not found: ${CATEGORY}`);
      console.log(`\n📂 Available categories: ${Object.keys(keywords).join(", ")}`);
      process.exit(1);
    }

    // Import keywords
    for (const category of categoriesToImport) {
      const pairs = keywords[category];

      console.log(`\n📁 Processing category: ${category} (${pairs.length} pairs)`);

      for (const [termA, termB] of pairs) {
        stats.total++;

        // Calculate quality
        const qualityResult = scoreKeywordPair(termA, termB);

        // Check minimum quality
        if (qualityResult.overall < MIN_QUALITY) {
          stats.lowQuality++;
          console.log(
            `   ⏭️  Skipped (low quality): ${termA} vs ${termB} (${qualityResult.overall}/100)`
          );
          continue;
        }

        if (DRY_RUN) {
          console.log(
            `   [DRY] Would import: ${termA} vs ${termB} (${qualityResult.overall}/100)`
          );
          stats.imported++;
          stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
          continue;
        }

        try {
          // Check if already exists
          const existing = await prisma.keywordPair.findUnique({
            where: {
              unique_pair: { termA, termB },
            },
          });

          if (existing) {
            stats.skipped++;
            console.log(`   ⏭️  Skipped (exists): ${termA} vs ${termB}`);
            continue;
          }

          // Import
          await prisma.keywordPair.create({
            data: {
              termA,
              termB,
              category,
              qualityScore: qualityResult.overall,
              status: qualityResult.overall >= 70 ? "approved" : "pending",
              approvedBy: qualityResult.overall >= 70 ? "auto" : null,
              approvedAt: qualityResult.overall >= 70 ? new Date() : null,
              source: "manual",
              importedFrom: "seed-keywords.json",
            },
          });

          stats.imported++;
          stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

          console.log(
            `   ✅ Imported: ${termA} vs ${termB} (${qualityResult.overall}/100 - ${getQualityLabel(qualityResult.overall)})`
          );
        } catch (error) {
          stats.errors++;
          console.error(`   ❌ Error: ${termA} vs ${termB} -`, error);
        }
      }
    }

    // Final statistics
    console.log(`\n${"=".repeat(60)}`);
    console.log(`✅ IMPORT COMPLETE`);
    console.log(`${"=".repeat(60)}`);
    console.log(`📊 Statistics:`);
    console.log(`   Total processed: ${stats.total}`);
    console.log(`   ✅ Imported: ${stats.imported}`);
    console.log(`   ⏭️  Skipped (duplicates): ${stats.skipped}`);
    console.log(`   ⚠️  Skipped (low quality): ${stats.lowQuality}`);
    console.log(`   ❌ Errors: ${stats.errors}`);

    if (Object.keys(stats.byCategory).length > 0) {
      console.log(`\n📁 Imported by Category:`);
      Object.entries(stats.byCategory)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, count]) => {
          console.log(`   ${cat}: ${count}`);
        });
    }

    if (DRY_RUN) {
      console.log(`\n🔍 DRY RUN - No changes were made`);
      console.log(`💡 Remove --dry-run to actually import\n`);
    } else {
      console.log(`\n💡 Next Steps:`);
      console.log(`   1. View keywords: https://your-domain.com/admin/keywords`);
      console.log(`   2. Review pending keywords and approve`);
      console.log(`   3. Start seeding: npm run seed\n`);
    }
  } catch (error) {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
