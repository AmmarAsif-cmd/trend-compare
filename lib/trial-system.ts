/**
 * 7-Day Trial System
 * Automatically grants premium access for 7 days on signup
 */

import { prisma } from './db';

export interface TrialStatus {
  isInTrial: boolean;
  trialEndsAt: Date | null;
  daysRemaining: number;
  isPremium: boolean;
  hasTrialExpired: boolean;
}

/**
 * Helper: Add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Helper: Check if a date is in the past
 */
function isPast(date: Date): boolean {
  return date < new Date();
}

/**
 * Start a 7-day trial for a new user
 */
export async function startTrial(userId: string): Promise<void> {
  const trialEndDate = addDays(new Date(), 7);

  await prisma.user.update({
    where: { id: userId },
    data: {
      trialStartedAt: new Date(),
      trialEndsAt: trialEndDate,
      subscriptionTier: 'trial', // New tier for trial users
    },
  });

  console.log(`[Trial] Started 7-day trial for user ${userId}, ends ${trialEndDate.toISOString()}`);
}

/**
 * Get trial status for a user
 */
export async function getTrialStatus(userId: string): Promise<TrialStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      trialStartedAt: true,
      trialEndsAt: true,
      subscriptionTier: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const isPremium = user.subscriptionTier === 'premium';
  const isInTrial = user.subscriptionTier === 'trial' && user.trialEndsAt && !isPast(user.trialEndsAt);
  const hasTrialExpired = user.trialEndsAt ? isPast(user.trialEndsAt) : false;

  const daysRemaining = user.trialEndsAt
    ? Math.max(0, Math.ceil((user.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    isInTrial,
    trialEndsAt: user.trialEndsAt,
    daysRemaining,
    isPremium,
    hasTrialExpired,
  };
}

/**
 * Check if user has premium access (either paid or trial)
 */
export async function hasPremiumAccess(userId: string): Promise<boolean> {
  const status = await getTrialStatus(userId);
  return status.isPremium || status.isInTrial;
}

/**
 * Convert expired trials to premium (automatic conversion after 7 days)
 * In production, you may want to check for payment method before converting
 */
export async function expireTrials(): Promise<number> {
  const result = await prisma.user.updateMany({
    where: {
      subscriptionTier: 'trial',
      trialEndsAt: {
        lt: new Date(),
      },
    },
    data: {
      subscriptionTier: 'premium',
    },
  });

  console.log(`[Trial] Converted ${result.count} trial users to premium`);
  return result.count;
}

/**
 * Convert a specific trial user to premium manually
 */
export async function convertTrialToPremium(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: 'premium',
    },
  });

  console.log(`[Trial] Manually converted user ${userId} to premium`);
}
