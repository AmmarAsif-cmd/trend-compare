/**
 * AI Guard - Ensures AI is never called if cached or for free users
 * 
 * This module provides wrapper functions that:
 * 1. Check cache first
 * 2. Check premium access
 * 3. Check budget limits
 * 4. Only call AI if all checks pass
 */

import { getCache } from '@/lib/cache';
import { allowOrThrow, type AIActionType } from './budget';
import { getAICacheTTL, getAICacheStaleTTL } from './cacheKeys';
import { canAccessPremium } from '@/lib/user-auth-helpers';
import { getCurrentUser } from '@/lib/user-auth-helpers';

export class AIGuardError extends Error {
  constructor(message: string, public readonly code: 'NO_PREMIUM' | 'BUDGET_EXCEEDED' | 'CACHE_ERROR') {
    super(message);
    this.name = 'AIGuardError';
  }
}

/**
 * Guard wrapper for AI operations
 * 
 * Ensures:
 * 1. User has premium access
 * 2. Budget limits are not exceeded
 * 3. Cache is checked first
 * 4. AI is only called if cache miss
 */
export async function guardAICall<T>(
  cacheKey: string,
  actionType: AIActionType,
  aiCall: () => Promise<T>
): Promise<{ result: T; cached: boolean }> {
  // Check premium access
  const hasPremium = await canAccessPremium();
  if (!hasPremium) {
    throw new AIGuardError(
      'AI features are only available for premium users',
      'NO_PREMIUM'
    );
  }

  // Get user ID for budget check
  const user = await getCurrentUser();
  if (!user || !(user as any).id) {
    throw new AIGuardError(
      'User authentication required for AI features',
      'NO_PREMIUM'
    );
  }

  const userId = (user as any).id;

  // Check cache first
  const cache = getCache();
  const cached = await cache.get<T>(cacheKey);
  if (cached !== null) {
    console.log(`[AIGuard] 💨 Cache HIT for ${actionType}: ${cacheKey}`);
    return { result: cached, cached: true };
  }

  console.log(`[AIGuard] ❌ Cache MISS for ${actionType}: ${cacheKey}`);

  // Check budget limits
  try {
    await allowOrThrow(userId, actionType);
  } catch (error) {
    if (error instanceof Error && error.name === 'AIBudgetError') {
      throw new AIGuardError(error.message, 'BUDGET_EXCEEDED');
    }
    throw error;
  }

  // Call AI
  try {
    const result = await aiCall();

    // Cache the result
    const ttl = getAICacheTTL();
    const staleTtl = getAICacheStaleTTL();
    await cache.set(cacheKey, result, ttl, staleTtl, [`ai:${actionType}`]);

    console.log(`[AIGuard] ✅ AI call successful for ${actionType}, cached: ${cacheKey}`);
    return { result, cached: false };
  } catch (error) {
    console.error(`[AIGuard] ❌ AI call failed for ${actionType}:`, error);
    throw new AIGuardError(
      `AI call failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'CACHE_ERROR'
    );
  }
}

/**
 * Check if AI call would be allowed (non-throwing)
 */
export async function canMakeAICall(actionType: AIActionType): Promise<{
  allowed: boolean;
  reason?: string;
  cached?: boolean;
  cacheKey?: string;
}> {
  // Check premium access
  const hasPremium = await canAccessPremium();
  if (!hasPremium) {
    return {
      allowed: false,
      reason: 'AI features are only available for premium users',
    };
  }

  // Get user ID
  const user = await getCurrentUser();
  if (!user || !(user as any).id) {
    return {
      allowed: false,
      reason: 'User authentication required',
    };
  }

  const userId = (user as any).id;

  // Check budget (non-throwing)
  const { isAllowed } = await import('./budget');
  const budgetCheck = await isAllowed(userId, actionType);
  if (!budgetCheck.allowed) {
    return {
      allowed: false,
      reason: budgetCheck.reason,
    };
  }

  return {
    allowed: true,
  };
}

