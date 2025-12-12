/**
 * View Category Cache Statistics
 *
 * This script displays statistics about the keyword category cache
 * to help monitor the effectiveness of the caching system.
 *
 * Usage:
 *   npx tsx scripts/view-cache-stats.ts
 */

import { PrismaClient } from '@prisma/client';
import { getCacheStats } from '../lib/category-cache';

const prisma = new PrismaClient();

async function main() {
  console.log('📊 Category Cache Statistics');
  console.log('='.repeat(60));
  console.log('');

  // Get keyword-level cache stats
  const cacheStats = await getCacheStats();

  console.log('🗂️  Keyword-Level Cache (KeywordCategory table):');
  console.log(`   Total keywords cached: ${cacheStats.totalCached}`);
  console.log(`   Average confidence: ${cacheStats.avgConfidence}%`);
  console.log('');

  console.log('   By Category:');
  const sortedCategories = Object.entries(cacheStats.byCategory).sort((a, b) => b[1] - a[1]);
  for (const [category, count] of sortedCategories) {
    const bar = '█'.repeat(Math.ceil(count / 5));
    console.log(`     ${category.padEnd(15)} ${bar} ${count}`);
  }
  console.log('');

  console.log('   By Source:');
  for (const [source, count] of Object.entries(cacheStats.bySource)) {
    const percentage = cacheStats.totalCached > 0
      ? ((count / cacheStats.totalCached) * 100).toFixed(1)
      : '0.0';
    console.log(`     ${source.padEnd(15)} ${count} (${percentage}%)`);
  }
  console.log('');

  // Get comparison-level cache stats
  const comparisonsWithCategory = await prisma.comparison.count({
    where: {
      category: { not: null },
    },
  });

  const totalComparisons = await prisma.comparison.count();

  console.log('📁 Comparison-Level Cache (Comparison table):');
  console.log(`   Total comparisons: ${totalComparisons}`);
  console.log(`   With cached category: ${comparisonsWithCategory}`);
  console.log(`   Coverage: ${totalComparisons > 0 ? ((comparisonsWithCategory / totalComparisons) * 100).toFixed(1) : '0'}%`);
  console.log('');

  // Get category distribution in comparisons
  const categoryDistribution = await prisma.comparison.groupBy({
    by: ['category'],
    _count: true,
    orderBy: {
      _count: {
        category: 'desc',
      },
    },
  });

  console.log('   Distribution by Category:');
  for (const item of categoryDistribution) {
    const category = item.category || 'null';
    const count = item._count;
    const percentage = totalComparisons > 0
      ? ((count / totalComparisons) * 100).toFixed(1)
      : '0.0';
    const bar = '█'.repeat(Math.ceil(count / 10));
    console.log(`     ${category.padEnd(15)} ${bar} ${count} (${percentage}%)`);
  }
  console.log('');

  // Estimate cost savings
  const estimatedAPICallsSaved = cacheStats.totalCached;
  const costPerCall = 0.0001; // Approximate cost for category detection with Claude Haiku
  const estimatedSavings = estimatedAPICallsSaved * costPerCall;

  console.log('💰 Estimated Cost Savings:');
  console.log(`   Cached keywords: ${cacheStats.totalCached}`);
  console.log(`   Potential AI calls saved: ${estimatedAPICallsSaved}`);
  console.log(`   Estimated savings: $${estimatedSavings.toFixed(4)}`);
  console.log('');

  // Cache freshness analysis
  const staleThreshold = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago

  const freshKeywords = await prisma.keywordCategory.count({
    where: {
      updatedAt: { gte: staleThreshold },
    },
  });

  const staleKeywords = cacheStats.totalCached - freshKeywords;

  console.log('🕒 Cache Freshness:');
  console.log(`   Fresh (<90 days): ${freshKeywords} (${cacheStats.totalCached > 0 ? ((freshKeywords / cacheStats.totalCached) * 100).toFixed(1) : '0'}%)`);
  console.log(`   Stale (>90 days): ${staleKeywords} (${cacheStats.totalCached > 0 ? ((staleKeywords / cacheStats.totalCached) * 100).toFixed(1) : '0'}%)`);
  console.log('');

  console.log('='.repeat(60));

  await prisma.$disconnect();
}

main()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    prisma.$disconnect();
    process.exit(1);
  });
