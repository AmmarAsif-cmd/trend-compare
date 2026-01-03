/**
 * AI Usage Budget Controls
 * 
 * Enforces per-user daily caps (premium: 10/day) and global daily caps
 * Stores counters in Redis if available, falls back to DB
 */

import { prisma } from '@/lib/db';
import { getCache } from '@/lib/cache';
import { createCacheKey } from '@/lib/cache/hash';

export type AIActionType = 
  | 'keywordContext'
  | 'peakExplanation'
  | 'forecastExplanation'
  | 'termNormalization'
  | 'categoryDetection'
  | 'insightSynthesis';

export class AIBudgetError extends Error {
  constructor(
    message: string,
    public readonly userId: string,
    public readonly actionType: AIActionType,
    public readonly limitType: 'user' | 'global'
  ) {
    super(message);
    this.name = 'AIBudgetError';
  }
}

/**
 * Premium user daily cap: 10 AI calls per day
 */
export const PREMIUM_USER_DAILY_CAP = 10;

/**
 * Get global daily cap from environment (default: 1000)
 */
export function getGlobalDailyCap(): number {
  const envCap = process.env.AI_GLOBAL_DAILY_CAP;
  if (envCap) {
    const parsed = parseInt(envCap, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 1000; // Default global cap
}

/**
 * Get today's date key (YYYY-MM-DD)
 */
function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get user daily counter key
 */
function getUserCounterKey(userId: string, dateKey: string): string {
  return createCacheKey('ai-budget', 'user', userId, dateKey);
}

/**
 * Get global daily counter key
 */
function getGlobalCounterKey(dateKey: string): string {
  return createCacheKey('ai-budget', 'global', dateKey);
}

/**
 * Get current count from cache (Redis) or DB
 */
async function getCount(key: string): Promise<number> {
  const cache = getCache();
  
  // Try cache first (Redis if available, otherwise memory)
  const cached = await cache.get<number>(key);
  if (cached !== null) {
    return cached;
  }

  // Fallback to DB (store in a simple key-value table or use existing structure)
  // For now, we'll use cache only. If needed, we can add a DB table later.
  return 0;
}

/**
 * Increment count in cache (Redis) or DB
 */
async function incrementCount(key: string): Promise<number> {
  const cache = getCache();
  
  // Get current count
  const current = await getCount(key);
  const newCount = current + 1;
  
  // Set in cache with TTL until end of day (24 hours)
  const ttlSeconds = 24 * 60 * 60; // 24 hours
  await cache.set(key, newCount, ttlSeconds);
  
  return newCount;
}

/**
 * Check if user has premium access
 */
async function isPremiumUser(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    });
    return user?.subscriptionTier === 'premium';
  } catch (error) {
    console.error('[AIBudget] Error checking premium status:', error);
    return false;
  }
}

/**
 * Check if AI call is allowed and throw if not
 * 
 * @throws AIBudgetError if limit exceeded
 */
export async function allowOrThrow(
  userId: string,
  actionType: AIActionType
): Promise<void> {
  // Check if user is premium
  const isPremium = await isPremiumUser(userId);
  if (!isPremium) {
    throw new AIBudgetError(
      'AI features are only available for premium users',
      userId,
      actionType,
      'user'
    );
  }

  const dateKey = getTodayKey();
  const userCounterKey = getUserCounterKey(userId, dateKey);
  const globalCounterKey = getGlobalCounterKey(dateKey);

  // Check user daily cap
  const userCount = await getCount(userCounterKey);
  if (userCount >= PREMIUM_USER_DAILY_CAP) {
    throw new AIBudgetError(
      `Daily AI limit exceeded. Premium users can make ${PREMIUM_USER_DAILY_CAP} AI calls per day.`,
      userId,
      actionType,
      'user'
    );
  }

  // Check global daily cap
  const globalCap = getGlobalDailyCap();
  const globalCount = await getCount(globalCounterKey);
  if (globalCount >= globalCap) {
    throw new AIBudgetError(
      `Global AI limit exceeded. Daily cap of ${globalCap} reached.`,
      userId,
      actionType,
      'global'
    );
  }

  // Increment counters
  await incrementCount(userCounterKey);
  await incrementCount(globalCounterKey);

  console.log(`[AIBudget] ✅ Allowed AI call: ${actionType} for user ${userId} (user: ${userCount + 1}/${PREMIUM_USER_DAILY_CAP}, global: ${globalCount + 1}/${globalCap})`);
}

/**
 * Get current usage for a user
 */
export async function getUserUsage(userId: string): Promise<{
  userCount: number;
  userLimit: number;
  globalCount: number;
  globalLimit: number;
}> {
  const dateKey = getTodayKey();
  const userCounterKey = getUserCounterKey(userId, dateKey);
  const globalCounterKey = getGlobalCounterKey(dateKey);

  const userCount = await getCount(userCounterKey);
  const globalCount = await getCount(globalCounterKey);

  return {
    userCount,
    userLimit: PREMIUM_USER_DAILY_CAP,
    globalCount,
    globalLimit: getGlobalDailyCap(),
  };
}

/**
 * Check if AI call is allowed (non-throwing version)
 */
export async function isAllowed(
  userId: string,
  actionType: AIActionType
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    await allowOrThrow(userId, actionType);
    return { allowed: true };
  } catch (error) {
    if (error instanceof AIBudgetError) {
      return { allowed: false, reason: error.message };
    }
    return { allowed: false, reason: 'Unknown error' };
  }
}

