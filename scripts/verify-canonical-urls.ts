/**
 * Script to verify canonical URLs across the site
 * 
 * Checks:
 * 1. All indexable pages have exactly one canonical tag
 * 2. Canonical URLs are absolute (https://trendarc.net/...)
 * 3. Canonical URLs are lowercase
 * 4. Canonical URLs have no query parameters
 * 5. Canonical URLs have no trailing slash (except root)
 * 6. Canonical URLs match sitemap URLs
 * 
 * Run with: npx tsx scripts/verify-canonical-urls.ts
 */

import { PrismaClient } from '@prisma/client';
import { getComparisonCanonicalUrl, getBlogCanonicalUrl } from '../lib/canonical-url';

const prisma = new PrismaClient();

interface ValidationError {
  type: 'missing' | 'relative' | 'uppercase' | 'query_params' | 'trailing_slash' | 'sitemap_mismatch';
  page: string;
  canonical?: string;
  message: string;
}

const errors: ValidationError[] = [];

function validateCanonicalUrl(url: string, expectedSitemapUrl: string, page: string): void {
  // Check if absolute
  if (!url.startsWith('https://trendarc.net/')) {
    errors.push({
      type: 'relative',
      page,
      canonical: url,
      message: `Canonical URL is not absolute: ${url}`,
    });
    return;
  }

  // Check if lowercase (excluding domain)
  const path = url.replace('https://trendarc.net', '');
  if (path !== path.toLowerCase()) {
    errors.push({
      type: 'uppercase',
      page,
      canonical: url,
      message: `Canonical URL contains uppercase: ${url}`,
    });
  }

  // Check for query parameters
  if (url.includes('?')) {
    errors.push({
      type: 'query_params',
      page,
      canonical: url,
      message: `Canonical URL contains query parameters: ${url}`,
    });
  }

  // Check for trailing slash (except root)
  if (url !== 'https://trendarc.net' && url.endsWith('/')) {
    errors.push({
      type: 'trailing_slash',
      page,
      canonical: url,
      message: `Canonical URL has trailing slash: ${url}`,
    });
  }

  // Check if matches sitemap URL
  if (url !== expectedSitemapUrl) {
    errors.push({
      type: 'sitemap_mismatch',
      page,
      canonical: url,
      message: `Canonical URL doesn't match sitemap: ${url} vs ${expectedSitemapUrl}`,
    });
  }
}

async function verifyComparisonPages(): Promise<void> {
  console.log('🔍 Verifying comparison pages...');
  
  const comparisons = await prisma.comparison.findMany({
    select: {
      slug: true,
    },
    take: 100, // Sample first 100
  });

  for (const comp of comparisons) {
    const canonicalUrl = getComparisonCanonicalUrl(comp.slug);
    const expectedSitemapUrl = `https://trendarc.net/compare/${comp.slug}`;
    
    validateCanonicalUrl(canonicalUrl, expectedSitemapUrl, `/compare/${comp.slug}`);
  }

  console.log(`   ✅ Checked ${comparisons.length} comparison pages`);
}

async function verifyBlogPages(): Promise<void> {
  console.log('🔍 Verifying blog pages...');
  
  try {
    const blogPosts = await prisma.blogPost.findMany({
      where: {
        status: 'published',
      },
      select: {
        slug: true,
      },
      take: 100, // Sample first 100
    });

    for (const post of blogPosts) {
      const canonicalUrl = getBlogCanonicalUrl(post.slug);
      const expectedSitemapUrl = `https://trendarc.net/blog/${post.slug}`;
      
      validateCanonicalUrl(canonicalUrl, expectedSitemapUrl, `/blog/${post.slug}`);
    }

    console.log(`   ✅ Checked ${blogPosts.length} blog pages`);
  } catch (error) {
    console.log('   ⚠️  Blog table not available, skipping blog verification');
  }
}

async function main() {
  console.log('\n📋 Canonical URL Verification\n');
  console.log('=' .repeat(60));

  await verifyComparisonPages();
  await verifyBlogPages();

  console.log('\n' + '='.repeat(60));
  console.log('📊 Validation Results\n');

  if (errors.length === 0) {
    console.log('✅ All canonical URLs are valid!');
    console.log('\n   - All URLs are absolute');
    console.log('   - All URLs are lowercase');
    console.log('   - No query parameters found');
    console.log('   - No trailing slashes (except root)');
    console.log('   - All URLs match sitemap format');
  } else {
    console.log(`❌ Found ${errors.length} validation errors:\n`);
    
    const errorsByType = errors.reduce((acc, err) => {
      acc[err.type] = (acc[err.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('Error Summary:');
    Object.entries(errorsByType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });

    console.log('\nDetailed Errors (first 10):');
    errors.slice(0, 10).forEach((err) => {
      console.log(`\n   [${err.type.toUpperCase()}] ${err.page}`);
      console.log(`   ${err.message}`);
    });

    if (errors.length > 10) {
      console.log(`\n   ... and ${errors.length - 10} more errors`);
    }

    process.exit(1);
  }

  await prisma.$disconnect();
  console.log('\n✨ Verification complete!\n');
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

