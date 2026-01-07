/**
 * Related Blogs Utility
 * 
 * Finds relevant blog posts for comparison pages based on:
 * - Shared category
 * - Shared keywords
 * - Explicit mapping (linkedComparisonSlugs)
 */

import { PrismaClient } from '@prisma/client';
import { fromSlug } from '@/lib/slug';

const prisma = new PrismaClient();

export interface RelatedBlog {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: Date;
  readTimeMinutes: number;
}

/**
 * Find related blog posts for a comparison page
 * 
 * Priority:
 * 1. Blogs explicitly linked to this comparison (linkedComparisonSlugs)
 * 2. Blogs with same category as comparison
 * 3. Blogs with keyword overlap (tags/keywords match comparison terms)
 */
export async function getRelatedBlogsForComparison(opts: {
  comparisonSlug: string;
  comparisonTerms: string[];
  comparisonCategory: string | null;
  limit?: number;
}): Promise<RelatedBlog[]> {
  const { comparisonSlug, comparisonTerms, comparisonCategory, limit = 3 } = opts;

  // Normalize terms for matching
  const normalizedTerms = comparisonTerms.map(t => t.toLowerCase().trim());
  const termPatterns = normalizedTerms.map(t => t.replace(/[^a-z0-9]/g, '-'));

  try {
    // Strategy 1: Blogs explicitly linked to this comparison
    // Note: linkedComparisonSlugs field may not exist in Prisma client until regenerated
    let explicitlyLinked: any[] = [];
    try {
      explicitlyLinked = await prisma.blogPost.findMany({
        where: {
          status: 'published',
          OR: [
            { comparisonSlug: comparisonSlug },
            // Check if linkedComparisonSlugs array contains this slug
            { linkedComparisonSlugs: { has: comparisonSlug } },
          ],
        } as any, // Type assertion to handle missing field in client
        select: {
          slug: true,
          title: true,
          excerpt: true,
          category: true,
          publishedAt: true,
          readTimeMinutes: true,
        },
        orderBy: { publishedAt: 'desc' },
        take: limit,
      });
    } catch (error: any) {
      // If linkedComparisonSlugs field doesn't exist in Prisma client yet, try without it
      if (error.message?.includes('Unknown argument') || error.message?.includes('linkedComparisonSlugs')) {
        console.warn('[getRelatedBlogsForComparison] linkedComparisonSlugs field not available yet, using comparisonSlug only');
        try {
          explicitlyLinked = await prisma.blogPost.findMany({
            where: {
              status: 'published',
              comparisonSlug: comparisonSlug,
            },
            select: {
              slug: true,
              title: true,
              excerpt: true,
              category: true,
              publishedAt: true,
              readTimeMinutes: true,
            },
            orderBy: { publishedAt: 'desc' },
            take: limit,
          });
        } catch (fallbackError) {
          console.error('[getRelatedBlogsForComparison] Fallback query failed:', fallbackError);
          explicitlyLinked = [];
        }
      } else {
        throw error; // Re-throw if it's a different error
      }
    }

    if (explicitlyLinked.length >= limit) {
      return explicitlyLinked.map(post => ({
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        category: post.category,
        publishedAt: post.publishedAt!,
        readTimeMinutes: post.readTimeMinutes,
      }));
    }

    // Strategy 2: Blogs with same category
    const categoryMatches: RelatedBlog[] = [];
    if (comparisonCategory) {
      const categoryBlogs = await prisma.blogPost.findMany({
        where: {
          status: 'published',
          category: comparisonCategory,
          slug: { notIn: explicitlyLinked.map(b => b.slug) },
        },
        select: {
          slug: true,
          title: true,
          excerpt: true,
          category: true,
          publishedAt: true,
          readTimeMinutes: true,
          tags: true,
          keywords: true,
        },
        orderBy: { publishedAt: 'desc' },
        take: limit * 2, // Get more for keyword scoring
      });

      // Score by keyword overlap
      const scored = categoryBlogs.map((blog: any) => {
        const blogText = `${blog.title} ${blog.excerpt} ${blog.tags.join(' ')} ${blog.keywords.join(' ')}`.toLowerCase();
        let score = 0;
        
        for (const term of normalizedTerms) {
          if (blogText.includes(term)) score += 10;
          // Also check for slugified versions
          for (const pattern of termPatterns) {
            if (blogText.includes(pattern)) score += 5;
          }
        }

        return { ...blog, score };
      });

      categoryMatches.push(...scored
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, limit - explicitlyLinked.length)
        .map((post: any) => ({
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          category: post.category,
          publishedAt: post.publishedAt!,
          readTimeMinutes: post.readTimeMinutes,
        })));
    }

    // Strategy 3: Keyword overlap (if we still need more)
    const remaining = limit - explicitlyLinked.length - categoryMatches.length;
    if (remaining > 0) {
      const keywordMatches = await prisma.blogPost.findMany({
        where: {
          status: 'published',
          slug: { notIn: [...explicitlyLinked, ...categoryMatches].map(b => b.slug) },
          OR: [
            // Match in tags
            { tags: { hasSome: normalizedTerms } },
            // Match in keywords
            { keywords: { hasSome: normalizedTerms } },
            // Match in title/excerpt (using contains - PostgreSQL)
            ...normalizedTerms.flatMap(term => [
              { title: { contains: term, mode: 'insensitive' as const } },
              { excerpt: { contains: term, mode: 'insensitive' as const } },
            ]),
          ],
        },
        select: {
          slug: true,
          title: true,
          excerpt: true,
          category: true,
          publishedAt: true,
          readTimeMinutes: true,
        },
        orderBy: { publishedAt: 'desc' },
        take: remaining,
      });

      categoryMatches.push(...keywordMatches.map((post: any) => ({
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        category: post.category,
        publishedAt: post.publishedAt!,
        readTimeMinutes: post.readTimeMinutes,
      })));
    }

    // Combine and return
    return [
      ...explicitlyLinked.map(post => ({
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        category: post.category,
        publishedAt: post.publishedAt!,
        readTimeMinutes: post.readTimeMinutes,
      })),
      ...categoryMatches,
    ].slice(0, limit);
  } catch (error) {
    console.error('[getRelatedBlogsForComparison] Error:', error);
    return [];
  }
}

/**
 * Get featured blog posts for homepage
 * 
 * Selection logic:
 * 1. featured = true (manual curation)
 * 2. highest viewCount (engagement-based)
 * 3. most recent published posts (fallback)
 */
export async function getFeaturedBlogs(limit: number = 5): Promise<RelatedBlog[]> {
  try {
    // Strategy 1: Featured posts (manual curation)
    // Note: featured field may not exist in Prisma client until regenerated
    // If it fails, we'll fall back to engagement-based selection
    let featured: any[] = [];
    try {
      featured = await prisma.blogPost.findMany({
        where: {
          status: 'published',
          featured: true,
        } as any, // Type assertion to handle missing field in client
        select: {
          slug: true,
          title: true,
          excerpt: true,
          category: true,
          publishedAt: true,
          readTimeMinutes: true,
          viewCount: true,
        },
        orderBy: [
          { publishedAt: 'desc' }, // Most recent first
        ],
        take: limit,
      });
    } catch (error: any) {
      // If featured field doesn't exist in Prisma client yet, skip this strategy
      if (error.message?.includes('Unknown argument') || error.message?.includes('featured')) {
        console.warn('[getFeaturedBlogs] featured field not available yet, using fallback');
        featured = [];
      } else {
        throw error; // Re-throw if it's a different error
      }
    }

    if (featured.length >= limit) {
      return featured.map(post => ({
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        category: post.category,
        publishedAt: post.publishedAt!,
        readTimeMinutes: post.readTimeMinutes,
      }));
    }

    // Strategy 2: Highest engagement (viewCount)
    const byEngagement = await prisma.blogPost.findMany({
      where: {
        status: 'published',
        slug: { notIn: featured.map(b => b.slug) },
      },
      select: {
        slug: true,
        title: true,
        excerpt: true,
        category: true,
        publishedAt: true,
        readTimeMinutes: true,
        viewCount: true,
      },
      orderBy: [
        { viewCount: 'desc' },
        { publishedAt: 'desc' },
      ],
      take: limit - featured.length,
    });

    const combined = [...featured, ...byEngagement];

    // Strategy 3: If still not enough, add most recent posts
    if (combined.length < limit) {
      const recent = await prisma.blogPost.findMany({
        where: {
          status: 'published',
          slug: { notIn: combined.map(b => b.slug) },
        },
        select: {
          slug: true,
          title: true,
          excerpt: true,
          category: true,
          publishedAt: true,
          readTimeMinutes: true,
          viewCount: true,
        },
        orderBy: { publishedAt: 'desc' },
        take: limit - combined.length,
      });

      combined.push(...recent);
    }

    return combined.slice(0, limit).map(post => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      category: post.category,
      publishedAt: post.publishedAt!,
      readTimeMinutes: post.readTimeMinutes,
    }));
  } catch (error) {
    console.error('[getFeaturedBlogs] Error:', error);
    return [];
  }
}

