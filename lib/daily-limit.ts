/**
 * Comparison Limit System
 * - Anonymous users: 1 comparison, then must sign up
 * - Signed-in users: Unlimited comparisons (everything is free)
 */

import { prisma } from './db';
import { getCurrentUser } from './user-auth-helpers';

const ANONYMOUS_USER_LIMIT = 1; // Anonymous users get 1 free comparison

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
 * Returns { allowed: boolean, remaining: number, limit: number, isAnonymous: boolean }
 */
export async function checkComparisonLimit(): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  count: number;
  isAnonymous: boolean;
  needsSignup: boolean;
}> {
  try {
    const user = await getCurrentUser();
    
    // Signed-in users: unlimited (everything is free)
    if (user && (user as any).id) {
      return {
        allowed: true,
        remaining: Infinity,
        limit: Infinity,
        count: 0,
        isAnonymous: false,
        needsSignup: false,
      };
    }

    // Anonymous users: 1 comparison only
    // Note: We track this client-side using localStorage
    // The actual check happens on the client side
    return {
      allowed: true, // We'll check client-side
      remaining: ANONYMOUS_USER_LIMIT,
      limit: ANONYMOUS_USER_LIMIT,
      count: 0, // Client-side tracking
      isAnonymous: true,
      needsSignup: false, // Client will determine this
    };
  } catch (error) {
    console.error('[DailyLimit] Error checking limit:', error);
    // Fail open - allow comparisons if we can't check
    return {
      allowed: true,
      remaining: ANONYMOUS_USER_LIMIT,
      limit: ANONYMOUS_USER_LIMIT,
      count: 0,
      isAnonymous: true,
      needsSignup: false,
    };
  }
}

/**
 * Get limit status message for UI
 */
export async function getLimitStatusMessage(): Promise<{
  message: string;
  showSignup: boolean;
  remaining: number;
  isAnonymous: boolean;
}> {
  const limitCheck = await checkComparisonLimit();
  
  if (limitCheck.remaining === Infinity) {
    return {
      message: 'Unlimited comparisons',
      showSignup: false,
      remaining: Infinity,
      isAnonymous: false,
    };
  }

  if (limitCheck.isAnonymous) {
    return {
      message: 'Sign up for unlimited comparisons',
      showSignup: true,
      remaining: limitCheck.remaining,
      isAnonymous: true,
    };
  }

  return {
    message: 'Unlimited comparisons',
    showSignup: false,
    remaining: Infinity,
    isAnonymous: false,
  };
}

