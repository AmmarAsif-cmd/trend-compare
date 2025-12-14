import { MetadataRoute } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://trendarc.net';

  // Get all published comparisons (limit to recent ones for performance)
  // Note: terms is a JSON field, so we can't filter it directly in Prisma
  // We'll fetch all and filter in memory (or just get recent ones)
  const comparisons = await prisma.comparison.findMany({
    select: {
      slug: true,
      updatedAt: true,
      terms: true, // Include terms to filter
    },
    take: 1000, // Limit to most recent 1000
    orderBy: {
      updatedAt: 'desc',
    },
  });

  // Filter out comparisons with empty or invalid terms
  const validComparisons = comparisons.filter((comp) => {
    if (!comp.terms || typeof comp.terms !== 'object') return false;
    const terms = comp.terms as any;
    return Array.isArray(terms) && terms.length >= 2 && terms.every((t: any) => typeof t === 'string' && t.trim() !== '');
  });

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/trending`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Dynamic comparison pages
  const comparisonPages: MetadataRoute.Sitemap = validComparisons.map((comparison) => ({
    url: `${baseUrl}/compare/${comparison.slug}`,
    lastModified: comparison.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Get blog posts if they exist
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const blogPosts = await prisma.blogPost.findMany({
      where: {
        status: 'published',
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      take: 500,
    });

    blogPages = blogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  } catch (error) {
    // Blog table might not exist, ignore
    console.warn('Blog posts not available for sitemap');
  }

  await prisma.$disconnect();

  return [...staticPages, ...comparisonPages, ...blogPages];
}
