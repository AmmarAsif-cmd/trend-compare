/**
 * Quick test script to check if blog generation will work
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('🔍 Checking database connection...');
    
    // Check if we can connect
    await prisma.$connect();
    console.log('✅ Database connected');
    
    // Check comparisons count
    const comparisonCount = await prisma.comparison.count();
    console.log(`📊 Comparisons in database: ${comparisonCount}`);
    
    // Check blog posts count
    const blogCount = await prisma.blogPost.count();
    console.log(`📝 Blog posts in database: ${blogCount}`);
    
    // Check if we have recent comparisons
    const recentComparisons = await prisma.comparison.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        slug: true,
        terms: true,
        category: true,
        createdAt: true
      }
    });
    
    console.log('\n📋 Recent comparisons:');
    recentComparisons.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.slug} (${c.category || 'uncategorized'})`);
    });
    
    // Check API key
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
    console.log(`\n🤖 Anthropic API Key: ${hasApiKey ? '✅ Set' : '❌ Missing'}`);
    
    if (comparisonCount === 0) {
      console.log('\n⚠️  No comparisons found. You need to create some comparisons first.');
      console.log('   Visit the site and create a few comparisons, then try again.');
    } else if (!hasApiKey) {
      console.log('\n⚠️  ANTHROPIC_API_KEY not found in environment.');
      console.log('   Add it to .env.local file.');
    } else {
      console.log('\n✅ Ready to generate blog posts!');
      console.log('   Run: npm run blog:generate');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

test();
