/**
 * Daily Comparison Limit for Free Users
 * Implements soft limit of 20 comparisons per day for free users
 */

import { prisma } from './db';
import { getCurrentUser, canAccessPremium } from './user-auth-helpers';

const FREE_USER_DAILY_LIMIT = 20;

/**
 * Get today's date at midnight (UTC)
 */
function getTodayStart(): Date {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

/**
 * Get today's comparison count for a user
 */
export async function getTodayComparisonCount(userId: string): Promise<number> {
  try {
    const todayStart = getTodayStart();
    
    const count = await prisma.comparisonHistory.count({
      where: {
        userId,
        viewedAt: {
          gte: todayStart,
        },
      },
    });

    return count;
  } catch (error) {
    console.error('[DailyLimit] Error getting today count:', error);
    return 0; // Fail open - allow comparisons if we can't check
  }
}

/**
 * Check if user can create/view a new comparison
 * Returns { allowed: boolean, remaining: number, limit: number }
 */
export async function checkComparisonLimit(): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  count: number;
}> {
  try {
    // Premium users have unlimited access
    const isPremium = await canAccessPremium();
    if (isPremium) {
      return {
        allowed: true,
        remaining: Infinity,
        limit: Infinity,
        count: 0,
      };
    }

    // Free users: check daily limit
    const user = await getCurrentUser();
    if (!user) {
      // Anonymous users: allow but track (we'll implement IP-based tracking later if needed)
      return {
        allowed: true,
        remaining: FREE_USER_DAILY_LIMIT,
        limit: FREE_USER_DAILY_LIMIT,
        count: 0,
      };
    }

    const userId = (user as any).id;
    if (!userId) {
      return {
        allowed: true,
        remaining: FREE_USER_DAILY_LIMIT,
        limit: FREE_USER_DAILY_LIMIT,
        count: 0,
      };
    }

    const count = await getTodayComparisonCount(userId);
    const remaining = Math.max(0, FREE_USER_DAILY_LIMIT - count);
    const allowed = count < FREE_USER_DAILY_LIMIT;

    return {
      allowed,
      remaining,
      limit: FREE_USER_DAILY_LIMIT,
      count,
    };
  } catch (error) {
    console.error('[DailyLimit] Error checking limit:', error);
    // Fail open - allow comparisons if we can't check
    return {
      allowed: true,
      remaining: FREE_USER_DAILY_LIMIT,
      limit: FREE_USER_DAILY_LIMIT,
      count: 0,
    };
  }
}

/**
 * Get limit status message for UI
 */
export async function getLimitStatusMessage(): Promise<{
  message: string;
  showUpgrade: boolean;
  remaining: number;
}> {
  const limitCheck = await checkComparisonLimit();
  
  if (limitCheck.remaining === Infinity) {
    return {
      message: 'Unlimited comparisons',
      showUpgrade: false,
      remaining: Infinity,
    };
  }

  if (limitCheck.remaining === 0) {
    return {
      message: `Daily limit reached (${limitCheck.limit} comparisons/day)`,
      showUpgrade: true,
      remaining: 0,
    };
  }

  if (limitCheck.remaining <= 10) {
    return {
      message: `${limitCheck.remaining} comparisons remaining today`,
      showUpgrade: true,
      remaining: limitCheck.remaining,
    };
  }

  return {
    message: `${limitCheck.remaining} comparisons remaining today`,
    showUpgrade: false,
    remaining: limitCheck.remaining,
  };
}

