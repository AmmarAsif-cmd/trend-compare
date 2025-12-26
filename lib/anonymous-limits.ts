/**
 * Anonymous User Rate Limiting
 * Tracks comparison usage for non-authenticated users by IP address
 */

import { prisma } from './db';
import { NextRequest } from 'next/server';

const ANONYMOUS_DAILY_LIMIT = 1; // Anonymous users get 1 comparison before signup required

/**
 * Get client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  // Try various headers that might contain the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (cfConnectingIP) return cfConnectingIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIP) return realIP;

  // Fallback to a placeholder
  return 'unknown';
}

/**
 * Check if anonymous user has reached their daily limit
 */
export async function checkAnonymousLimit(ipAddress: string): Promise<{
  allowed: boolean;
  remaining: number;
  total: number;
  limit: number;
  resetTime: Date;
}> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  try {
    // Get today's count
    const dailyCount = await prisma.comparisonHistory.count({
      where: {
        userId: null, // Anonymous users
        ipAddress,
        viewedAt: {
          gte: todayStart,
        },
      },
    });

    const allowed = dailyCount < ANONYMOUS_DAILY_LIMIT;

    const tomorrow = new Date(todayStart);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
      allowed,
      remaining: Math.max(0, ANONYMOUS_DAILY_LIMIT - dailyCount),
      total: dailyCount,
      limit: ANONYMOUS_DAILY_LIMIT,
      resetTime: tomorrow,
    };
  } catch (error) {
    console.error('[AnonymousLimit] Error checking limit:', error);
    // On error, allow access (fail open)
    return {
      allowed: true,
      remaining: ANONYMOUS_DAILY_LIMIT,
      total: 0,
      limit: ANONYMOUS_DAILY_LIMIT,
      resetTime: new Date(),
    };
  }
}

/**
 * Track anonymous comparison view
 */
export async function trackAnonymousView(
  ipAddress: string,
  slug: string,
  termA: string,
  termB: string,
  timeframe: string = '12m',
  geo: string = ''
): Promise<void> {
  try {
    await prisma.comparisonHistory.create({
      data: {
        userId: null, // Anonymous
        ipAddress,
        slug,
        termA,
        termB,
        timeframe,
        geo,
        viewedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('[AnonymousLimit] Error tracking view:', error);
    // Don't throw, just log
  }
}

/**
 * Get anonymous usage stats for an IP
 */
export async function getAnonymousStats(ipAddress: string): Promise<{
  todayCount: number;
  totalCount: number;
  firstSeen: Date | null;
  lastSeen: Date | null;
}> {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayCount, totalCount, firstView, lastView] = await Promise.all([
      prisma.comparisonHistory.count({
        where: {
          userId: null,
          ipAddress,
          viewedAt: { gte: todayStart },
        },
      }),
      prisma.comparisonHistory.count({
        where: {
          userId: null,
          ipAddress,
        },
      }),
      prisma.comparisonHistory.findFirst({
        where: {
          userId: null,
          ipAddress,
        },
        orderBy: { viewedAt: 'asc' },
        select: { viewedAt: true },
      }),
      prisma.comparisonHistory.findFirst({
        where: {
          userId: null,
          ipAddress,
        },
        orderBy: { viewedAt: 'desc' },
        select: { viewedAt: true },
      }),
    ]);

    return {
      todayCount,
      totalCount,
      firstSeen: firstView?.viewedAt || null,
      lastSeen: lastView?.viewedAt || null,
    };
  } catch (error) {
    console.error('[AnonymousLimit] Error getting stats:', error);
    return {
      todayCount: 0,
      totalCount: 0,
      firstSeen: null,
      lastSeen: null,
    };
  }
}
