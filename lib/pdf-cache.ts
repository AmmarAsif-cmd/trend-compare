/**
 * PDF and Chart Image Caching
 * Cache generated chart PNGs and PDFs to avoid expensive regeneration
 */

import { getOrSet } from '@/lib/cache';
import { createCacheKey } from '@/lib/cache/hash';
import type { SeriesPoint } from './trends';
import type { ComparisonCategory } from './category-resolver';

// Cache TTLs
const CHART_IMAGE_TTL = 24 * 60 * 60; // 24 hours (charts don't change often)
const PDF_TTL = 7 * 24 * 60 * 60; // 7 days (PDFs are expensive to generate)

/**
 * Get or generate cached chart image
 */
export async function getOrGenerateChartImage(
  generator: () => Promise<Buffer | null>,
  cacheKey: string
): Promise<Buffer | null> {
  return getOrSet(
    cacheKey,
    CHART_IMAGE_TTL,
    generator,
    {
      staleTtlSeconds: CHART_IMAGE_TTL * 2, // 48 hours stale
      tags: ['chart-image'],
    }
  );
}

/**
 * Create cache key for score chart image
 */
export function createScoreChartCacheKey(
  slug: string,
  timeframe: string,
  geo: string,
  version: string = 'v1'
): string {
  return createCacheKey('chart', 'score', slug, timeframe, geo, version);
}

/**
 * Create cache key for forecast chart image
 */
export function createForecastChartCacheKey(
  slug: string,
  term: string,
  timeframe: string,
  geo: string,
  version: string = 'v1'
): string {
  return createCacheKey('chart', 'forecast', slug, term, timeframe, geo, version);
}

/**
 * Create cache key for PDF
 */
export function createPdfCacheKey(
  slug: string,
  timeframe: string,
  geo: string,
  version: string = 'v2'
): string {
  return createCacheKey('pdf', slug, timeframe, geo, version);
}

/**
 * Check if PDF exists in cache
 */
export async function getCachedPdf(
  cacheKey: string
): Promise<Buffer | null> {
  const { get } = await import('@/lib/cache');
  const cached = await get<Buffer>(cacheKey);
  return cached ? Buffer.from(cached) : null;
}

/**
 * Store PDF in cache
 */
export async function cachePdf(
  cacheKey: string,
  pdfBuffer: Buffer
): Promise<void> {
  const { set } = await import('@/lib/cache');
  await set(cacheKey, pdfBuffer, PDF_TTL, {
    tags: ['pdf'],
  });
}

