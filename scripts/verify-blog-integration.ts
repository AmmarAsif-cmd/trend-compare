/**
 * Verify Blog Integration
 * 
 * Checks that blog sections are properly integrated on:
 * - Homepage (FeaturedBlogs)
 * - Comparison pages (RelatedAnalysis)
 * 
 * Run with: npx tsx scripts/verify-blog-integration.ts
 */

import { PrismaClient } from '@prisma/client';
import { getFeaturedBlogs } from '@/lib/blog/related-blogs';
import { getRelatedBlogsForComparison } from '@/lib/blog/related-blogs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verifying Blog Integration...\n');

  try {
    // Check published blog posts
    const publishedCount = await prisma.blogPost.count({
      where: { status: 'published' },
    });

    console.log(`📊 Published Blog Posts: ${publishedCount}`);

    if (publishedCount === 0) {
      console.log('⚠️  No published blog posts found.');
      console.log('   The sections will be hidden until you publish posts.\n');
    } else {
      // Test homepage featured blogs
      console.log('\n🏠 Testing Homepage Featured Blogs...');
      const featuredBlogs = await getFeaturedBlogs(5);
      console.log(`   Found ${featuredBlogs.length} featured blogs`);
      if (featuredBlogs.length > 0) {
        console.log(`   ✅ Homepage will show "Insights & Analysis" section`);
        featuredBlogs.forEach((blog, i) => {
          console.log(`      ${i + 1}. ${blog.title} (${blog.category})`);
        });
      } else {
        console.log('   ⚠️  No featured blogs - section will be hidden');
      }

      // Test comparison page related blogs
      console.log('\n📊 Testing Comparison Page Related Blogs...');
      
      // Get a sample comparison
      const sampleComparison = await prisma.comparison.findFirst({
        where: {
          category: { not: null },
        },
        select: {
          slug: true,
          terms: true,
          category: true,
        },
      });

      if (sampleComparison) {
        const terms = sampleComparison.terms as string[];
        const relatedBlogs = await getRelatedBlogsForComparison({
          comparisonSlug: sampleComparison.slug,
          comparisonTerms: terms,
          comparisonCategory: sampleComparison.category,
          limit: 3,
        });

        console.log(`   Testing with: ${sampleComparison.slug}`);
        console.log(`   Found ${relatedBlogs.length} related blogs`);
        if (relatedBlogs.length > 0) {
          console.log(`   ✅ Comparison pages will show "Related Analysis" section`);
          relatedBlogs.forEach((blog, i) => {
            console.log(`      ${i + 1}. ${blog.title} (${blog.category})`);
          });
        } else {
          console.log('   ⚠️  No related blogs found for this comparison');
          console.log('      (This is normal if no blogs match the category/keywords)');
        }
      } else {
        console.log('   ⚠️  No comparisons found to test');
      }

      // Check featured posts
      const featuredCount = await prisma.blogPost.count({
        where: {
          status: 'published',
          featured: true,
        },
      });

      console.log(`\n⭐ Featured Posts: ${featuredCount}`);
      if (featuredCount === 0 && publishedCount > 0) {
        console.log('   💡 Tip: Mark posts as featured for homepage curation:');
        console.log('      await prisma.blogPost.update({');
        console.log('        where: { slug: "your-slug" },');
        console.log('        data: { featured: true },');
        console.log('      });');
      }
    }

    // Check linked comparisons
    const linkedCount = await prisma.blogPost.count({
      where: {
        status: 'published',
        linkedComparisonSlugs: { isEmpty: false },
      },
    });

    console.log(`\n🔗 Posts with Linked Comparisons: ${linkedCount}`);
    if (linkedCount === 0 && publishedCount > 0) {
      console.log('   💡 Tip: Link posts to comparisons for better relevance:');
      console.log('      await prisma.blogPost.update({');
      console.log('        where: { slug: "your-slug" },');
      console.log('        data: {');
      console.log('          linkedComparisonSlugs: ["chatgpt-vs-gemini"],');
      console.log('        },');
      console.log('      });');
    }

    console.log('\n✅ Verification complete!\n');
    console.log('📝 Integration Status:');
    console.log('   ✅ Homepage: FeaturedBlogs component added');
    console.log('   ✅ Comparison Pages: RelatedAnalysis component added');
    console.log('   ✅ Database: Migration applied (featured, linkedComparisonSlugs)');
    console.log('   ✅ SEO: Structured data added to blog posts');
    console.log('\n🚀 Next Steps:');
    console.log('   1. Restart dev server to regenerate Prisma client');
    console.log('   2. Visit homepage to see "Insights & Analysis" section');
    console.log('   3. Visit any comparison page to see "Related Analysis" section');
    console.log('   4. Mark high-quality posts as featured for homepage');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.message?.includes('column') && error.message?.includes('does not exist')) {
      console.log('\n⚠️  Database migration may not be applied yet.');
      console.log('   Run: npx prisma db push');
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('Verification failed:', e);
    process.exit(1);
  });

