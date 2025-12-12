/**
 * Fix Existing Categories Script
 *
 * This script re-detects categories for all existing comparisons in the database.
 * Use this to:
 * 1. Fix categories that were set before AI category detection was implemented
 * 2. Re-detect categories with improved AI prompts
 * 3. Populate the KeywordCategory cache table
 *
 * Usage:
 *   npx tsx scripts/fix-categories.ts [options]
 *
 * Options:
 *   --dry-run          Show what would be changed without making changes
 *   --limit N          Process only N comparisons (default: all)
 *   --force            Re-detect even for comparisons with recent categories
 *   --category NAME    Only process comparisons in a specific category
 */

import { PrismaClient } from '@prisma/client';
import { detectCategoryWithAI } from '../lib/ai-category-detector';
import { cacheComparisonKeywords } from '../lib/category-cache';
import type { ComparisonCategory } from '../lib/category-resolver';

const prisma = new PrismaClient();

interface ScriptOptions {
  dryRun: boolean;
  limit: number | null;
  force: boolean;
  category: string | null;
}

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  const options: ScriptOptions = {
    dryRun: args.includes('--dry-run'),
    limit: null,
    force: args.includes('--force'),
    category: null,
  };

  const limitIndex = args.indexOf('--limit');
  if (limitIndex !== -1 && args[limitIndex + 1]) {
    options.limit = parseInt(args[limitIndex + 1], 10);
  }

  const categoryIndex = args.indexOf('--category');
  if (categoryIndex !== -1 && args[categoryIndex + 1]) {
    options.category = args[categoryIndex + 1];
  }

  return options;
}

// Category mapping from old categories to new ComparisonCategory format
const CATEGORY_MAPPING: Record<string, ComparisonCategory> = {
  'Technology': 'tech',
  'Movies': 'movies',
  'Music': 'music',
  'Gaming': 'games',
  'Products': 'products',
  'People': 'people',
  'Brands': 'brands',
  'Places': 'places',
  'Entertainment': 'movies',
  'Business': 'brands',
  'General': 'general',
};

function parseTerms(terms: any): string[] | null {
  if (!Array.isArray(terms)) return null;
  const filtered = terms.filter((t): t is string => typeof t === 'string');
  return filtered.length >= 2 ? filtered : null;
}

async function main() {
  const options = parseArgs();

  console.log('🔧 Category Fix Script');
  console.log('='.repeat(60));
  console.log(`Mode: ${options.dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (will update database)'}`);
  console.log(`Limit: ${options.limit || 'all comparisons'}`);
  console.log(`Force: ${options.force ? 'yes' : 'no'}`);
  console.log(`Filter: ${options.category || 'all categories'}`);
  console.log('='.repeat(60));
  console.log('');

  // Fetch comparisons
  const where: any = {};
  if (options.category) {
    where.category = options.category;
  }

  const comparisons = await prisma.comparison.findMany({
    where,
    select: {
      id: true,
      slug: true,
      terms: true,
      category: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: options.limit || undefined,
  });

  console.log(`📊 Found ${comparisons.length} comparisons to process\n`);

  if (comparisons.length === 0) {
    console.log('✅ No comparisons to process. Exiting.');
    await prisma.$disconnect();
    return;
  }

  let processed = 0;
  let updated = 0;
  let errors = 0;
  let skipped = 0;
  let categoriesChanged = 0;

  for (const comparison of comparisons) {
    processed++;
    const terms = parseTerms(comparison.terms);

    if (!terms || terms.length < 2) {
      console.log(`⏭️  [${processed}/${comparisons.length}] Skipped ${comparison.slug}: Invalid terms`);
      skipped++;
      continue;
    }

    const [termA, termB] = terms;

    try {
      // Check if we should skip (only if not forced)
      if (!options.force && comparison.category) {
        const ageInDays = (Date.now() - comparison.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (ageInDays < 30) {
          console.log(`⏭️  [${processed}/${comparisons.length}] Skipped ${comparison.slug}: Category recently updated (${ageInDays.toFixed(0)} days ago)`);
          skipped++;
          continue;
        }
      }

      // Detect category using AI
      console.log(`🔍 [${processed}/${comparisons.length}] Processing: ${comparison.slug} (${termA} vs ${termB})`);

      const aiResult = await detectCategoryWithAI(termA, termB);

      if (!aiResult.success || aiResult.confidence < 70) {
        console.log(`   ⚠️  Low confidence (${aiResult.confidence}%) - keeping existing category: ${comparison.category || 'null'}`);
        skipped++;
        continue;
      }

      const oldCategory = comparison.category;
      const newCategory = aiResult.category;

      console.log(`   ✅ Detected: ${newCategory} (${aiResult.confidence}% confidence)`);
      console.log(`   📝 Reasoning: ${aiResult.reasoning}`);

      if (oldCategory !== newCategory) {
        console.log(`   🔄 Changed: ${oldCategory || 'null'} → ${newCategory}`);
        categoriesChanged++;
      }

      if (!options.dryRun) {
        // Update comparison in database
        await prisma.comparison.update({
          where: { id: comparison.id },
          data: {
            category: newCategory,
            updatedAt: new Date(),
          },
        });

        // Cache keywords for future use
        await cacheComparisonKeywords(
          termA,
          termB,
          newCategory,
          aiResult.confidence,
          'ai',
          aiResult.reasoning
        );

        console.log(`   💾 Updated database and cached keywords`);
      } else {
        console.log(`   [DRY RUN] Would update: ${oldCategory || 'null'} → ${newCategory}`);
      }

      updated++;

      // Rate limiting: wait 1 second between AI calls to avoid overwhelming the API
      if (processed < comparisons.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error(`   ❌ Error processing ${comparison.slug}:`, error);
      errors++;
    }

    console.log('');
  }

  console.log('='.repeat(60));
  console.log('📊 Summary:');
  console.log(`   Total processed: ${processed}`);
  console.log(`   Successfully updated: ${updated}`);
  console.log(`   Categories changed: ${categoriesChanged}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors: ${errors}`);
  console.log('='.repeat(60));

  if (options.dryRun) {
    console.log('\n⚠️  This was a DRY RUN. No changes were made to the database.');
    console.log('   Run without --dry-run to apply changes.');
  } else {
    console.log('\n✅ Categories have been updated successfully!');
  }

  await prisma.$disconnect();
}

main()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    prisma.$disconnect();
    process.exit(1);
  });
