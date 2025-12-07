import { NextResponse } from "next/server";
import { generatePostsFromTrendingComparisons, suggestBlogTopics } from "@/lib/blogPostGenerator";

/**
 * POST /api/admin/blog/generate
 * Generate blog posts from trending comparisons
 */
export async function POST(request: Request) {
  try {
    const { limit = 5 } = await request.json();

    console.log(`[API] Generating ${limit} blog posts...`);

    const postIds = await generatePostsFromTrendingComparisons(limit);

    return NextResponse.json({
      success: true,
      generated: postIds.length,
      postIds,
    });
  } catch (error) {
    console.error("[API] Blog generation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate posts" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/blog/generate
 * Get suggested topics for blog posts
 */
export async function GET() {
  try {
    const topics = await suggestBlogTopics(10);

    return NextResponse.json({
      success: true,
      topics,
    });
  } catch (error) {
    console.error("[API] Topic suggestion error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get suggestions" },
      { status: 500 }
    );
  }
}
