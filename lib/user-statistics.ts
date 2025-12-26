/**
 * User Statistics and Value Metrics
 * Tracks user engagement and calculates value delivered
 */

import { prisma } from './db';

export interface UserStatistics {
  totalComparisons: number;
  savedComparisons: number;
  uniqueCategories: number;
  timeSavedMinutes: number;
  insightsGenerated: number;
  daysActive: number;
  currentStreak: number;
  longestStreak: number;
  joinDate: Date;
  lastActiveDate: Date;
}

/**
 * Calculate comprehensive user statistics
 */
export async function getUserStatistics(userId: string): Promise<UserStatistics> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      createdAt: true,
      comparisonHistory: {
        select: {
          viewedAt: true,
          slug: true,
        },
        orderBy: {
          viewedAt: 'desc',
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Get saved comparisons count
  const savedCount = await prisma.savedComparison.count({
    where: { userId },
  });

  // Calculate unique days active
  const uniqueDates = new Set(
    user.comparisonHistory.map((h: any) =>
      h.viewedAt.toISOString().split('T')[0]
    )
  );
  const daysActive = uniqueDates.size;

  // Calculate current streak
  const currentStreak = calculateCurrentStreak(user.comparisonHistory.map((h: any) => h.viewedAt));
  const longestStreak = calculateLongestStreak(user.comparisonHistory.map((h: any) => h.viewedAt));

  // Estimate time saved (5 minutes per comparison)
  const timeSavedMinutes = user.comparisonHistory.length * 5;

  // Get unique categories (this is an estimate based on comparison count)
  const uniqueCategories = Math.min(
    Math.ceil(user.comparisonHistory.length / 3),
    15
  );

  // Estimate insights generated (AI features used)
  const insightsGenerated = Math.floor(user.comparisonHistory.length * 0.6);

  const lastActiveDate = user.comparisonHistory[0]?.viewedAt || user.createdAt;

  return {
    totalComparisons: user.comparisonHistory.length,
    savedComparisons: savedCount,
    uniqueCategories,
    timeSavedMinutes,
    insightsGenerated,
    daysActive,
    currentStreak,
    longestStreak,
    joinDate: user.createdAt,
    lastActiveDate,
  };
}

/**
 * Calculate current activity streak (consecutive days)
 */
function calculateCurrentStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  const sortedDates = dates
    .map(d => d.toISOString().split('T')[0])
    .sort((a, b) => b.localeCompare(a)); // Descending

  const uniqueDates = Array.from(new Set(sortedDates));

  let streak = 1;
  const today = new Date().toISOString().split('T')[0];

  // If not active today or yesterday, streak is 0
  if (uniqueDates[0] !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (uniqueDates[0] !== yesterday) {
      return 0;
    }
  }

  // Count consecutive days
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const current = new Date(uniqueDates[i]);
    const next = new Date(uniqueDates[i + 1]);
    const diffDays = Math.floor((current.getTime() - next.getTime()) / 86400000);

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculate longest activity streak ever
 */
function calculateLongestStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  const sortedDates = dates
    .map(d => d.toISOString().split('T')[0])
    .sort((a, b) => a.localeCompare(b)); // Ascending

  const uniqueDates = Array.from(new Set(sortedDates));

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const current = new Date(uniqueDates[i]);
    const next = new Date(uniqueDates[i + 1]);
    const diffDays = Math.floor((next.getTime() - current.getTime()) / 86400000);

    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

/**
 * Get achievements for a user
 */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  progress?: number;
  target?: number;
}

export async function getUserAchievements(userId: string): Promise<Achievement[]> {
  const stats = await getUserStatistics(userId);

  return [
    {
      id: 'first-comparison',
      title: 'Getting Started',
      description: 'Complete your first comparison',
      icon: '🎯',
      earned: stats.totalComparisons >= 1,
    },
    {
      id: 'comparison-master',
      title: 'Comparison Master',
      description: 'Create 10 comparisons',
      icon: '🏆',
      earned: stats.totalComparisons >= 10,
      progress: Math.min(stats.totalComparisons, 10),
      target: 10,
    },
    {
      id: 'power-user',
      title: 'Power User',
      description: 'Create 50 comparisons',
      icon: '⚡',
      earned: stats.totalComparisons >= 50,
      progress: Math.min(stats.totalComparisons, 50),
      target: 50,
    },
    {
      id: 'trend-expert',
      title: 'Trend Expert',
      description: 'Create 100 comparisons',
      icon: '💎',
      earned: stats.totalComparisons >= 100,
      progress: Math.min(stats.totalComparisons, 100),
      target: 100,
    },
    {
      id: 'bookmark-collector',
      title: 'Bookmark Collector',
      description: 'Save 5 comparisons',
      icon: '📚',
      earned: stats.savedComparisons >= 5,
      progress: Math.min(stats.savedComparisons, 5),
      target: 5,
    },
    {
      id: 'week-warrior',
      title: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: '🔥',
      earned: stats.longestStreak >= 7,
      progress: Math.min(stats.currentStreak, 7),
      target: 7,
    },
    {
      id: 'month-master',
      title: 'Month Master',
      description: 'Maintain a 30-day streak',
      icon: '🌟',
      earned: stats.longestStreak >= 30,
      progress: Math.min(stats.currentStreak, 30),
      target: 30,
    },
    {
      id: 'category-explorer',
      title: 'Category Explorer',
      description: 'Explore 10+ different categories',
      icon: '🗺️',
      earned: stats.uniqueCategories >= 10,
      progress: Math.min(stats.uniqueCategories, 10),
      target: 10,
    },
  ];
}
