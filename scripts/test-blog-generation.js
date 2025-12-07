/**
 * Test Script: Generate a sample blog post with references
 *
 * This script tests the enhanced blog generation with citations and references.
 */

const { generateBlogPost, saveBlogPostDraft } = require('../lib/blogPostGenerator');

async function testBlogGeneration() {
  console.log('🧪 Testing Blog Generation with References...\n');

  const testTopic = {
    type: 'trend_analysis',
    title: 'The Rise of AI in Content Creation: 2024 Analysis',
    keywords: ['AI content creation', 'artificial intelligence', 'content marketing', 'automation'],
    category: 'Technology',
    angle: 'How AI is transforming content marketing strategies'
  };

  console.log('📝 Generating blog post for topic:', testTopic.title);
  console.log('⏳ This may take 10-20 seconds...\n');

  try {
    const post = await generateBlogPost(testTopic);

    if (!post) {
      console.error('❌ Failed to generate blog post');
      return;
    }

    console.log('✅ Blog post generated successfully!\n');
    console.log('📊 Post Details:');
    console.log('━'.repeat(80));
    console.log(`Title: ${post.title}`);
    console.log(`Excerpt: ${post.excerpt}`);
    console.log(`Meta Title: ${post.metaTitle}`);
    console.log(`Meta Description: ${post.metaDescription}`);
    console.log(`Keywords: ${post.keywords.join(', ')}`);
    console.log(`Tags: ${post.tags.join(', ')}`);
    console.log(`Read Time: ${post.readTimeMinutes} minutes`);
    console.log(`Content Length: ${post.content.length} characters`);
    console.log(`Word Count: ~${Math.round(post.content.split(' ').length)} words`);
    console.log('\n📚 References:');
    console.log('━'.repeat(80));

    if (post.references && post.references.length > 0) {
      post.references.forEach((ref, index) => {
        console.log(`\n[${index + 1}] ${ref.title}`);
        console.log(`    Source: ${ref.source}`);
        console.log(`    Type: ${ref.type}`);
        console.log(`    URL: ${ref.url}`);
        console.log(`    Accessed: ${ref.accessDate}`);
      });
      console.log('\n✅ References validation:');
      console.log(`   • Total references: ${post.references.length}`);
      console.log(`   • Minimum required: 4`);
      console.log(`   • Status: ${post.references.length >= 4 ? '✓ PASS' : '✗ FAIL'}`);
    } else {
      console.log('❌ No references found in generated post!');
    }

    console.log('\n📄 Content Preview (first 500 chars):');
    console.log('━'.repeat(80));
    console.log(post.content.substring(0, 500) + '...');

    console.log('\n🔍 Checking for inline citations:');
    const citationPattern = /\[\d+\]/g;
    const citations = post.content.match(citationPattern);
    if (citations) {
      console.log(`   • Found ${citations.length} inline citations`);
      console.log(`   • Citations: ${citations.slice(0, 10).join(', ')}${citations.length > 10 ? '...' : ''}`);
      console.log(`   • Status: ✓ PASS`);
    } else {
      console.log(`   • Status: ✗ FAIL - No inline citations found!`);
    }

    console.log('\n━'.repeat(80));
    console.log('🎉 Test completed successfully!');

  } catch (error) {
    console.error('❌ Error during blog generation:', error);
  }
}

testBlogGeneration();
