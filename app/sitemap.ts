import { MetadataRoute } from 'next';
import { PrismaClient } from '@prisma/client';
import { isCanonicalSlug } from '@/lib/slug-verification';
import { nonZeroRatio } from '@/lib/series';
import { calculateComparisonConfidence } from '@/lib/confidence-calculator';
import { calculateVolatility, calculateAgreementIndex } from '@/lib/comparison-metrics';
import type { SeriesPoint } from '@/lib/trends';

const prisma = new PrismaClient();

/**
 * Quality gate: Check if comparison meets minimum quality thresholds
 * Returns true if comparison should be included in sitemap
 */
function meetsQualityGate(
  series: SeriesPoint[],
  terms: string[],
  breakdownA: { [key: string]: number },
  breakdownB: { [key: string]: number }
): boolean {
  if (!series || series.length < 8) return false;
  if (terms.length < 2) return false;

  // Calculate nonZeroRatio for both terms
  const termA = terms[0];
  const termB = terms[1];
  
  const valuesA = series.map(p => Number(p[termA] ?? 0));
  const valuesB = series.map(p => Number(p[termB] ?? 0));
  
  const totalA = valuesA.reduce((sum, v) => sum + v, 0);
  const totalB = valuesB.reduce((sum, v) => sum + v, 0);
  const totalSearches = totalA + totalB;
  
  if (totalSearches === 0) return false;
  
  const aShare = totalA / totalSearches;
  const bShare = totalB / totalSearches;
  const margin = Math.abs(aShare - bShare) * 100;
  
  // Calculate nonZeroRatio (fraction of rows with at least one non-zero value)
  const nonZeroRatioValue = nonZeroRatio(series);
  const nonZeroThreshold = 0.1; // At least 10% of data points have non-zero values
  
  if (nonZeroRatioValue < nonZeroThreshold) return false;
  
  // Calculate simplified metrics for confidence estimation
  const volatilityA = calculateVolatility(series, termA);
  const volatilityB = calculateVolatility(series, termB);
  const volatility = (volatilityA + volatilityB) / 2;
  
  const agreementIndex = calculateAgreementIndex(breakdownA || {}, breakdownB || {});
  const sourceCount = Math.max(1, Object.keys(breakdownA || {}).filter(k => k !== 'overall').length);
  const leaderChangeRisk = Math.min(100, volatility * 0.7 + (margin < 5 ? 50 : margin < 15 ? 30 : 0));
  
  // Calculate confidence
  const confidenceResult = calculateComparisonConfidence(
    agreementIndex,
    volatility,
    series.length,
    sourceCount,
    margin,
    leaderChangeRisk
  );
  
  // Quality gate: confidence >= 60
  return confidenceResult.score >= 60;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://trendarc.net';

  // Get all published comparisons (limit to recent ones for performance)
  // Include series and stats for quality gate checks
  const comparisons = await prisma.comparison.findMany({
    select: {
      slug: true,
      updatedAt: true,
      terms: true, // Include terms to filter
      series: true, // For quality gate (nonZeroRatio, confidence)
      stats: true, // For breakdowns (agreementIndex calculation)
    },
    take: 1000, // Limit to most recent 1000
    orderBy: {
      updatedAt: 'desc',
    },
  });

  // Filter out comparisons with empty or invalid terms
  const validComparisons = comparisons.filter((comp: { slug: string; updatedAt: Date; terms: unknown }) => {
    if (!comp.terms || typeof comp.terms !== 'object') return false;
    const terms = comp.terms as any;
    return Array.isArray(terms) && terms.length >= 2 && terms.every((t: any) => typeof t === 'string' && t.trim() !== '');
  });

  // CRITICAL: Only include canonical slugs that return 200 (no redirects)
  // This ensures sitemap only contains URLs that are final destinations
  const canonicalComparisons = validComparisons.filter((comp: { slug: string; updatedAt: Date; terms: unknown }) => {
    return isCanonicalSlug(comp.slug);
  });

  // QUALITY GATE: Filter by confidence >= 60 and nonZeroRatio >= threshold
  // This prevents Google from repeatedly crawling weak pages
  const highQualityComparisons = canonicalComparisons.filter((comp: any) => {
    try {
      const terms = comp.terms as string[];
      if (!terms || terms.length < 2) return false;
      
      const series = comp.series as SeriesPoint[] | null;
      if (!series || !Array.isArray(series)) return false;
      
      // Parse stats for breakdowns (if available)
      let breakdownA: { [key: string]: number } = {};
      let breakdownB: { [key: string]: number } = {};
      
      try {
        const stats = comp.stats as any;
        if (stats && typeof stats === 'object') {
          // Try to extract breakdowns from stats if available
          // This is a simplified check - full breakdowns may not be in stats
          breakdownA = stats.termA?.breakdown || {};
          breakdownB = stats.termB?.breakdown || {};
        }
      } catch {
        // If stats parsing fails, use empty breakdowns (will default to 50 agreementIndex)
      }
      
      return meetsQualityGate(series, terms, breakdownA, breakdownB);
    } catch (error) {
      console.warn(`[Sitemap] Quality gate check failed for ${comp.slug}:`, error);
      return false; // Exclude on error
    }
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

  // Dynamic comparison pages - ONLY high-quality canonical slugs that return 200
  // Excluded: reversed slugs, wrong casing, duplicate separators, trailing slashes, query params
  // Excluded: low confidence (< 60), low nonZeroRatio (< 10%), weak signal comparisons
  const comparisonPages: MetadataRoute.Sitemap = highQualityComparisons.map((comparison: { slug: string; updatedAt: Date; terms: unknown }) => ({
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

    blogPages = blogPosts.map((post: { slug: string; updatedAt: Date }) => ({
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
