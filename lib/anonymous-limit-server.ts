/**
 * Server-side anonymous comparison limit enforcement
 * Prevents bypassing the limit by accessing URLs directly
 */

import { cookies } from 'next/headers';
import { getCurrentUser } from './user-auth-helpers';

const ANONYMOUS_COMPARISON_COOKIE = 'trendarc_anonymous_comparisons';
const ANONYMOUS_LIMIT = 1; // Allow 1 comparison, block on 2nd

/**
 * Check if anonymous user has exceeded comparison limit
 * Returns { allowed: boolean, count: number, needsSignup: boolean }
 */
export async function checkAnonymousLimit(): Promise<{
  allowed: boolean;
  count: number;
  needsSignup: boolean;
}> {
  try {
    // Check if user is authenticated
    const user = await getCurrentUser();
    if (user && (user as any).id) {
      // Authenticated users have unlimited access
      return {
        allowed: true,
        count: 0,
        needsSignup: false,
      };
    }

    // Anonymous user - check cookie
    const cookieStore = await cookies();
    const comparisonCookie = cookieStore.get(ANONYMOUS_COMPARISON_COOKIE);
    const count = comparisonCookie ? parseInt(comparisonCookie.value, 10) : 0;

    // Allow if count < 2 (they can view 1 comparison)
    // Block if count >= 2 (they've viewed 2, need to sign up for 3rd)
    const allowed = count < 2;
    const needsSignup = count >= 2;

    return {
      allowed,
      count,
      needsSignup,
    };
  } catch (error) {
    console.error('[AnonymousLimit] Error checking limit:', error);
    // Fail open - allow access if we can't check
    return {
      allowed: true,
      count: 0,
      needsSignup: false,
    };
  }
}

/**
 * Increment anonymous comparison count
 * Call this when an anonymous user views a comparison
 */
export async function incrementAnonymousCount(): Promise<number> {
  try {
    const user = await getCurrentUser();
    if (user && (user as any).id) {
      // Authenticated users don't need tracking
      return 0;
    }

    const cookieStore = await cookies();
    const comparisonCookie = cookieStore.get(ANONYMOUS_COMPARISON_COOKIE);
    const currentCount = comparisonCookie ? parseInt(comparisonCookie.value, 10) : 0;
    const newCount = currentCount + 1;

    // Set cookie with 30 day expiry
    // Set both httpOnly (server-side) and non-httpOnly (client-readable) versions
    cookieStore.set(ANONYMOUS_COMPARISON_COOKIE, newCount.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });
    
    // Also set a client-readable cookie for client-side sync
    cookieStore.set(`${ANONYMOUS_COMPARISON_COOKIE}_client`, newCount.toString(), {
      httpOnly: false, // Client can read this
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return newCount;
  } catch (error) {
    console.error('[AnonymousLimit] Error incrementing count:', error);
    return 0;
  }
}

