/**
 * Import Keywords from Existing Comparisons
 *
 * Analyzes existing comparisons in the database and imports high-quality
 * keyword pairs into the KeywordPair table for future seeding.
 *
 * Usage:
 *   npx tsx scripts/import-keywords.ts [options]
 *
 * Options:
 *   --min-quality <score>  Minimum quality score (default: 60)
 *   --limit <number>       Max keywords to import (default: 100)
 *   --category <name>      Import only specific category
 *   --dry-run              Show what would be imported without saving
 *
 * Examples:
 *   # Import 100 high-quality keywords (score >= 60)
 *   npx tsx scripts/import-keywords.ts
 *
 *   # Import only excellent keywords (score >= 80)
 *   npx tsx scripts/import-keywords.ts --min-quality 80
 *
 *   # Preview without saving
 *   npx tsx scripts/import-keywords.ts --dry-run
 *
 *   # Import tech keywords only
 *   npx tsx scripts/import-keywords.ts --category tech --limit 50
 */

import { prisma } from "../lib/db";
import { scoreKeywordPair, getQualityLabel } from "../lib/keyword-quality";

// Parse arguments
const args = process.argv.slice(2);
const getArg = (flag: string, defaultValue?: string): string | undefined => {
  const index = args.indexOf(flag);
  return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
};
const hasFlag = (flag: string): boolean => args.includes(flag);

const MIN_QUALITY = parseInt(getArg("--min-quality", "60") || "60", 10);
const LIMIT = parseInt(getArg("--limit", "100") || "100", 10);
const CATEGORY = getArg("--category");
const DRY_RUN = hasFlag("--dry-run");

interface ImportStats {
  totalComparisons: number;
  analyzed: number;
  passedQuality: number;
  imported: number;
  skipped: number;
  errors: number;
  byCategory: Record<string, number>;
}

/**
 * Extract terms from comparison JSON
 */
function extractTerms(termsJson: any): [string, string] | null {
  if (!Array.isArray(termsJson) || termsJson.length < 2) return null;
  const [a, b] = termsJson;
  if (typeof a !== "string" || typeof b !== "string") return null;
  return [a.trim(), b.trim()];
}

/**
 * Normalize terms for duplicate detection
 */
function normalizeTerms(a: string, b: string): [string, string] {
  const normalized = [a.toLowerCase(), b.toLowerCase()].sort();
  return [normalized[0], normalized[1]];
}

/**
 * Main import function
 */
async function main() {
  console.log("\n📥 Keyword Import Tool\n");
  console.log(`${"=".repeat(60)}`);
  console.log(`⚙️  Configuration:`);
  console.log(`   Minimum quality: ${MIN_QUALITY}/100`);
  console.log(`   Limit: ${LIMIT} keywords`);
  console.log(`   Category: ${CATEGORY || "All"}`);
  console.log(`   Dry run: ${DRY_RUN ? "Yes (no changes will be saved)" : "No"}`);
  console.log(`${"=".repeat(60)}\n`);

  const stats: ImportStats = {
    totalComparisons: 0,
    analyzed: 0,
    passedQuality: 0,
    imported: 0,
    skipped: 0,
    errors: 0,
    byCategory: {},
  };

  try {
    // Fetch existing comparisons
    const whereClause: any = {};
    if (CATEGORY) whereClause.category = CATEGORY;

    const comparisons = await prisma.comparison.findMany({
      where: whereClause,
      select: {
        terms: true,
        category: true,
      },
      take: LIMIT * 3, // Fetch more than needed to account for duplicates
      orderBy: { createdAt: "desc" },
    });

    stats.totalComparisons = comparisons.length;
    console.log(`📊 Found ${stats.totalComparisons} comparisons to analyze\n`);

    // Track unique pairs to avoid duplicates
    const seenPairs = new Set<string>();
    const candidatesForImport: Array<{
      termA: string;
      termB: string;
      category: string;
      qualityScore: number;
      qualityResult: any;
    }> = [];

    // Analyze each comparison
    for (const comp of comparisons) {
      stats.analyzed++;

      // Extract terms
      const terms = extractTerms(comp.terms);
      if (!terms) {
        stats.errors++;
        continue;
      }

      const [termA, termB] = terms;

      // Check for duplicates (case-insensitive, order-independent)
      const [normA, normB] = normalizeTerms(termA, termB);
      const pairKey = `${normA}|||${normB}`;
      if (seenPairs.has(pairKey)) {
        stats.skipped++;
        continue;
      }
      seenPairs.add(pairKey);

      // Calculate quality
      const qualityResult = scoreKeywordPair(termA, termB);

      // Check if meets minimum quality
      if (qualityResult.overall < MIN_QUALITY) {
        stats.skipped++;
        continue;
      }

      stats.passedQuality++;

      // Add to candidates
      candidatesForImport.push({
        termA,
        termB,
        category: comp.category || "general",
        qualityScore: qualityResult.overall,
        qualityResult,
      });

      // Track by category
      const cat = comp.category || "general";
      stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;

      // Stop if we have enough candidates
      if (candidatesForImport.length >= LIMIT) {
        break;
      }
    }

    // Sort by quality (best first)
    candidatesForImport.sort((a, b) => b.qualityScore - a.qualityScore);

    // Limit to requested amount
    const toImport = candidatesForImport.slice(0, LIMIT);

    console.log(`✅ Found ${toImport.length} high-quality keyword pairs to import\n`);

    // Preview top 10
    console.log(`📋 Top 10 Keywords (by quality):`);
    console.log(`${"─".repeat(60)}`);
    toImport.slice(0, 10).forEach((kw, i) => {
      console.log(
        `${i + 1}. ${kw.termA} vs ${kw.termB} (${kw.category}) - ${kw.qualityScore}/100 (${getQualityLabel(kw.qualityScore)})`
      );
    });
    console.log(`${"─".repeat(60)}\n`);

    if (DRY_RUN) {
      console.log(`🔍 DRY RUN - No changes were made to the database\n`);
      console.log(`💡 Remove --dry-run flag to actually import these keywords\n`);
    } else {
      // Import to database
      console.log(`💾 Importing to database...\n`);

      for (const kw of toImport) {
        try {
          // Check if already exists
          const existing = await prisma.keywordPair.findUnique({
            where: {
              unique_pair: {
                termA: kw.termA,
                termB: kw.termB,
              },
            },
          });

          if (existing) {
            stats.skipped++;
            console.log(`   ⏭️  Skipped (exists): ${kw.termA} vs ${kw.termB}`);
            continue;
          }

          // Create keyword pair
          await prisma.keywordPair.create({
            data: {
              termA: kw.termA,
              termB: kw.termB,
              category: kw.category,
              qualityScore: kw.qualityScore,
              status: kw.qualityScore >= 70 ? "approved" : "pending",
              approvedBy: kw.qualityScore >= 70 ? "auto" : null,
              approvedAt: kw.qualityScore >= 70 ? new Date() : null,
              source: "imported",
              importedFrom: "existing_comparisons",
            },
          });

          stats.imported++;
          console.log(`   ✅ Imported: ${kw.termA} vs ${kw.termB} (${kw.qualityScore}/100)`);
        } catch (error) {
          stats.errors++;
          console.error(`   ❌ Error importing ${kw.termA} vs ${kw.termB}:`, error);
        }
      }
    }

    // Final statistics
    console.log(`\n${"=".repeat(60)}`);
    console.log(`✅ IMPORT COMPLETE`);
    console.log(`${"=".repeat(60)}`);
    console.log(`📊 Statistics:`);
    console.log(`   Total comparisons: ${stats.totalComparisons}`);
    console.log(`   Analyzed: ${stats.analyzed}`);
    console.log(`   Passed quality (>=${MIN_QUALITY}): ${stats.passedQuality}`);
    console.log(`   ✅ Imported: ${stats.imported}`);
    console.log(`   ⏭️  Skipped (duplicates/existing): ${stats.skipped}`);
    console.log(`   ❌ Errors: ${stats.errors}`);

    if (Object.keys(stats.byCategory).length > 0) {
      console.log(`\n📁 By Category:`);
      Object.entries(stats.byCategory)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, count]) => {
          console.log(`   ${cat}: ${count}`);
        });
    }

    console.log(`\n💡 Next Steps:`);
    console.log(`   1. View imported keywords: https://your-domain.com/admin/keywords`);
    console.log(`   2. Review and approve pending keywords`);
    console.log(`   3. Use approved keywords for seeding: npm run seed`);
    console.log(`\n✨ Done!\n`);
  } catch (error) {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
