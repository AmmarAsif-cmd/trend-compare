/**
 * Script to generate blog posts from trending comparisons
 *
 * Usage:
 *   npx tsx scripts/generate-blog-posts.ts
 *   npx tsx scripts/generate-blog-posts.ts --limit 10
 */

// Load environment variables from .env.local
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { generatePostsFromTrendingComparisons } from "../lib/blogPostGenerator";

async function main() {
  const args = process.argv.slice(2);
  const limitIndex = args.indexOf("--limit");
  const limit = limitIndex >= 0 ? parseInt(args[limitIndex + 1]) : 5;

  console.log(`\n🤖 Starting blog post generation (limit: ${limit})...\n`);

  try {
    const postIds = await generatePostsFromTrendingComparisons(limit);

    console.log(`\n✅ Generation complete!`);
    console.log(`📝 Generated ${postIds.length} new blog posts`);
    console.log(`\nPost IDs:`);
    postIds.forEach((id) => console.log(`  - ${id}`));
    console.log(`\n📋 Review them at: http://localhost:3000/admin/blog\n`);

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error generating posts:", error);
    process.exit(1);
  }
}

main();
