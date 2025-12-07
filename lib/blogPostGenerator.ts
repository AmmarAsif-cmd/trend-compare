/**
 * AI-Powered Blog Post Generator
 *
 * Automatically generates SEO-optimized blog posts from:
 * - Trending comparisons
 * - Popular keywords
 * - Seasonal trends
 *
 * Posts are saved as drafts and require manual approval before publishing.
 */

import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "@prisma/client";
import slugify from "slugify";

const prisma = new PrismaClient();

export type BlogPostTopic = {
  type: "comparison" | "trend_analysis" | "category_roundup" | "seasonal";
  title: string;
  keywords: string[];
  comparisonSlug?: string; // If based on a comparison
  category: string;
  angle?: string; // Unique angle for the post
};

export type GeneratedBlogPost = {
  title: string;
  excerpt: string;
  content: string; // Markdown
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  tags: string[];
  readTimeMinutes: number;
  category: string;
};

/**
 * Generate a blog post using Claude AI
 */
export async function generateBlogPost(
  topic: BlogPostTopic
): Promise<GeneratedBlogPost | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[Blog Generator] ❌ ANTHROPIC_API_KEY not found");
    return null;
  }

  try {
    const client = new Anthropic({ apiKey });

    const prompt = buildPromptForTopic(topic);

    console.log(`[Blog Generator] 🚀 Generating post: "${topic.title}"`);

    const message = await client.messages.create({
      model: "claude-3-5-haiku-20241022", // Cost-optimized
      max_tokens: 4000, // Longer content
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type === "text") {
      // Extract JSON from response (try multiple methods)
      let result = null;

      try {
        // Method 1: Try direct JSON parse
        result = JSON.parse(content.text);
      } catch (e1) {
        try {
          // Method 2: Remove markdown code blocks if present
          const cleaned = content.text
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
          result = JSON.parse(cleaned);
        } catch (e2) {
          try {
            // Method 3: Extract JSON between curly braces
            const jsonMatch = content.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              result = JSON.parse(jsonMatch[0]);
            }
          } catch (e3) {
            console.error("[Blog Generator] ❌ All JSON parsing methods failed");
            console.error("[Blog Generator] Response preview:", content.text.slice(0, 500));
            return null;
          }
        }
      }

      if (result) {
        console.log("[Blog Generator] ✅ Post generated successfully");
        return result;
      }
    }

    console.error("[Blog Generator] ❌ Failed to parse response");
    return null;
  } catch (error) {
    console.error("[Blog Generator] ❌ Generation error:", error);
    return null;
  }
}

/**
 * Build AI prompt based on topic type
 */
function buildPromptForTopic(topic: BlogPostTopic): string {
  const baseInstructions = `You are an expert content writer creating SEO-optimized blog posts for TrendArc, a trend analysis platform.

CRITICAL SEO REQUIREMENTS:
1. Write for humans first, search engines second
2. Use natural language (no keyword stuffing)
3. Include data, statistics, and specific examples
4. Write engaging, informative content
5. Use proper heading hierarchy (H2, H3)
6. Include actionable takeaways

CONTENT STRUCTURE:
- Introduction: Hook the reader, explain why this matters
- Main sections: 3-5 H2 sections with detailed insights
- Data-driven: Include specific numbers, dates, percentages
- Conclusion: Summarize key points, call-to-action

TARGET AUDIENCE: Marketers, content creators, business owners, data enthusiasts who want to understand trends.`;

  let specificPrompt = "";

  switch (topic.type) {
    case "comparison":
      specificPrompt = `
TOPIC TYPE: Comparison Analysis
TITLE: ${topic.title}
KEYWORDS: ${topic.keywords.join(", ")}
CATEGORY: ${topic.category}

Create a comprehensive blog post comparing these trends. Include:
- Why people are interested in this comparison
- Historical context and background
- Data-driven insights (use hypothetical but realistic trend data)
- Key differences and similarities
- Real-world implications
- Expert predictions for the future
- Who should care about these trends and why

Make it engaging, informative, and SEO-friendly. Use specific examples and case studies where relevant.`;
      break;

    case "trend_analysis":
      specificPrompt = `
TOPIC TYPE: Trend Analysis
TITLE: ${topic.title}
KEYWORDS: ${topic.keywords.join(", ")}
CATEGORY: ${topic.category}
ANGLE: ${topic.angle || "General analysis"}

Create an in-depth analysis of this trend. Include:
- What is this trend and why is it emerging?
- Historical data and growth patterns
- Key drivers and influencers
- Industry impact and implications
- Expert opinions and predictions
- Actionable insights for businesses/individuals
- Future outlook

Use data points, statistics, and real-world examples to support your analysis.`;
      break;

    case "category_roundup":
      specificPrompt = `
TOPIC TYPE: Category Roundup
TITLE: ${topic.title}
KEYWORDS: ${topic.keywords.join(", ")}
CATEGORY: ${topic.category}

Create a comprehensive roundup post featuring multiple trending topics in this category. Include:
- Introduction to the category and why it's important
- Top 5-10 trending items with brief analysis of each
- Comparative insights (what's rising vs declining)
- Common patterns and themes
- Predictions for upcoming trends
- Practical recommendations

Make it scannable with clear sections and bullet points where appropriate.`;
      break;

    case "seasonal":
      specificPrompt = `
TOPIC TYPE: Seasonal Trend Analysis
TITLE: ${topic.title}
KEYWORDS: ${topic.keywords.join(", ")}
CATEGORY: ${topic.category}

Create a seasonal trend analysis post. Include:
- Overview of seasonal patterns in this category
- Historical data showing year-over-year trends
- Why these patterns occur
- Business implications (when to invest, market, etc.)
- Predictions for this season vs previous years
- Actionable tips for leveraging seasonal trends

Use specific dates, percentages, and comparative data.`;
      break;
  }

  return `${baseInstructions}

${specificPrompt}

OUTPUT FORMAT (JSON):
**CRITICAL: You must return VALID JSON. Newlines in the content field must be escaped as \\n**

Return your response as a valid JSON object (not wrapped in markdown code blocks).

Structure:
{
  "title": "Compelling, SEO-friendly title (60-70 characters)",
  "excerpt": "Engaging 2-3 sentence summary (150-160 characters) that makes people want to read more",
  "content": "Full blog post in MARKDOWN format. Use \\n\\n for paragraph breaks, ## for H2, ### for H3. Include:\\n\\n- Introduction paragraph\\n- 3-5 main sections with ## headings\\n- Bullet points and numbered lists\\n- Data and statistics in **bold**\\n- Key takeaways\\n\\nMinimum 800 words, maximum 1500 words",
  "metaTitle": "SEO-optimized title for search engines (50-60 characters)",
  "metaDescription": "SEO meta description that includes main keyword and call-to-action (150-160 characters)",
  "keywords": ["primary keyword", "secondary keyword", "long-tail keyword", "related term"],
  "tags": ["tag1", "tag2", "tag3"],
  "readTimeMinutes": 7,
  "category": "${topic.category}"
}

IMPORTANT JSON FORMATTING RULES:
1. All newlines in the "content" field MUST be escaped as \\n
2. Use \\n\\n for paragraph breaks
3. No literal line breaks inside string values
4. Return raw JSON only - NO markdown code blocks (no \`\`\`json)
5. Ensure all quotes inside strings are escaped with backslash

CONTENT QUALITY CHECKLIST:
✅ Engaging introduction that hooks the reader
✅ Data-driven insights with specific numbers
✅ Clear heading hierarchy (H2, H3)
✅ Actionable takeaways
✅ Natural keyword usage (NO stuffing)
✅ Conclusion with call-to-action
✅ 800-1500 words
✅ Scannable formatting (bullets, bold, lists)

Write like a human expert, not like AI. Be conversational but authoritative. Include personality and insights.`;
}

/**
 * Save generated post to database as draft
 */
export async function saveBlogPostDraft(
  post: GeneratedBlogPost,
  topic: BlogPostTopic,
  generatedPrompt: string
): Promise<string | null> {
  try {
    const slug = slugify(post.title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });

    const blogPost = await prisma.blogPost.create({
      data: {
        slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category,
        tags: post.tags,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        keywords: post.keywords,
        comparisonSlug: topic.comparisonSlug,
        status: "pending_review", // Requires your approval
        autoGenerated: true,
        generatedPrompt,
        readTimeMinutes: post.readTimeMinutes,
      },
    });

    console.log(`[Blog Generator] ✅ Draft saved: ${blogPost.id} (${slug})`);
    return blogPost.id;
  } catch (error) {
    console.error("[Blog Generator] ❌ Failed to save draft:", error);
    return null;
  }
}

/**
 * Generate blog posts from trending comparisons
 */
export async function generatePostsFromTrendingComparisons(
  limit: number = 5
): Promise<string[]> {
  console.log("[Blog Generator] 📊 Finding trending comparisons...");

  // Get popular comparisons (by views, recency, etc.)
  const comparisons = await prisma.comparison.findMany({
    where: {
      category: { not: null },
      updatedAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  console.log(`[Blog Generator] Found ${comparisons.length} recent comparisons`);

  const generatedIds: string[] = [];

  for (const comparison of comparisons) {
    const terms = comparison.terms as string[];
    if (!terms || terms.length < 2) continue;

    // Check if we already have a blog post for this comparison
    const existingPost = await prisma.blogPost.findFirst({
      where: { comparisonSlug: comparison.slug },
    });

    if (existingPost) {
      console.log(`[Blog Generator] ⏭️  Skipping ${comparison.slug} - post already exists`);
      continue;
    }

    const topic: BlogPostTopic = {
      type: "comparison",
      title: `${terms[0]} vs ${terms[1]}: Trend Analysis and Insights`,
      keywords: [
        terms[0],
        terms[1],
        `${terms[0]} vs ${terms[1]}`,
        "trend analysis",
        "comparison",
      ],
      comparisonSlug: comparison.slug,
      category: comparison.category || "General",
    };

    console.log(`[Blog Generator] 🤖 Generating post for: ${comparison.slug}`);

    const post = await generateBlogPost(topic);
    if (post) {
      const prompt = buildPromptForTopic(topic);
      const postId = await saveBlogPostDraft(post, topic, prompt);
      if (postId) {
        generatedIds.push(postId);
        console.log(`[Blog Generator] ✅ Generated: ${postId}`);
      }
    }

    // Rate limiting - wait 2 seconds between generations
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log(`[Blog Generator] 🎉 Generated ${generatedIds.length} new draft posts`);
  return generatedIds;
}

/**
 * Suggest blog post topics based on trending data
 */
export async function suggestBlogTopics(limit: number = 10): Promise<BlogPostTopic[]> {
  const topics: BlogPostTopic[] = [];

  // Get trending categories
  const comparisons = await prisma.comparison.findMany({
    where: { category: { not: null } },
    select: { category: true },
    distinct: ["category"],
  });

  const categories = comparisons
    .map((c: any) => c.category)
    .filter((cat: any): cat is string => cat !== null);

  // Generate topic suggestions
  for (const category of categories.slice(0, limit)) {
    // Category roundup
    topics.push({
      type: "category_roundup",
      title: `Top ${category} Trends of ${new Date().getFullYear()}`,
      keywords: [category, "trends", "analysis", "comparison"],
      category,
    });

    // Seasonal analysis
    const month = new Date().toLocaleString("default", { month: "long" });
    topics.push({
      type: "seasonal",
      title: `${category} Trends for ${month} ${new Date().getFullYear()}`,
      keywords: [category, "seasonal trends", month, "analysis"],
      category,
    });
  }

  return topics.slice(0, limit);
}
