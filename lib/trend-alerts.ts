import { prisma } from './db';
import { getOrBuildComparison } from './getOrBuild';
import { runIntelligentComparison } from './intelligent-comparison';

export type TrendAlertType = 'score_change' | 'position_change' | 'threshold' | 'custom';

export type TrendAlertFrequency = 'daily' | 'weekly' | 'instant';

export type TrendAlert = {
  id: string;
  userId: string;
  slug: string;
  termA: string;
  termB: string;
  alertType: TrendAlertType;
  threshold?: number;
  baselineScoreA?: number;
  baselineScoreB?: number;
  changePercent: number;
  frequency: TrendAlertFrequency;
  status: 'active' | 'paused' | 'deleted';
  lastTriggered?: Date;
  lastChecked?: Date;
  notifyCount: number;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Create a new trend alert
 */
export async function createTrendAlert(data: {
  userId: string;
  slug: string;
  termA: string;
  termB: string;
  alertType: TrendAlertType;
  threshold?: number;
  changePercent?: number;
  frequency?: TrendAlertFrequency;
}): Promise<TrendAlert> {
  // Get current scores as baseline
  const comparison = await getOrBuildComparison({
    slug: data.slug,
    terms: [data.termA, data.termB],
    timeframe: '12m',
    geo: '',
  });

  if (!comparison) {
    throw new Error('Comparison not found');
  }

  // Get intelligent comparison for scores
  const intelligentComparison = await runIntelligentComparison(
    [data.termA, data.termB],
    comparison.series,
    {
      enableYouTube: !!process.env.YOUTUBE_API_KEY,
      enableTMDB: !!process.env.TMDB_API_KEY,
      enableBestBuy: !!process.env.BESTBUY_API_KEY,
      enableSpotify: !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET),
      enableSteam: true,
      cachedCategory: comparison.category,
    }
  );

  const baselineScoreA = intelligentComparison.scores.termA.overall;
  const baselineScoreB = intelligentComparison.scores.termB.overall;
  const baselineDate = new Date();

  const alert = await prisma.trendAlert.create({
    data: {
      userId: data.userId,
      slug: data.slug,
      termA: data.termA,
      termB: data.termB,
      alertType: data.alertType,
      threshold: data.threshold ? Number(data.threshold) : null,
      baselineScoreA: Number(baselineScoreA),
      baselineScoreB: Number(baselineScoreB),
      changePercent: data.changePercent ? Number(data.changePercent) : 10,
      frequency: data.frequency || 'daily',
      status: 'active',
      lastChecked: baselineDate,
      baselineDate: baselineDate,
    },
  });

  return alert as TrendAlert;
}

/**
 * Get all active alerts for a user
 */
export async function getUserAlerts(userId: string): Promise<TrendAlert[]> {
  const alerts = await prisma.trendAlert.findMany({
    where: {
      userId,
      status: 'active',
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return alerts as TrendAlert[];
}

/**
 * Update alert status
 */
export async function updateAlertStatus(
  alertId: string,
  userId: string,
  status: 'active' | 'paused' | 'deleted'
): Promise<void> {
  await prisma.trendAlert.updateMany({
    where: {
      id: alertId,
      userId, // Ensure user owns this alert
    },
    data: {
      status,
    },
  });
}

/**
 * Delete an alert
 */
export async function deleteAlert(alertId: string, userId: string): Promise<void> {
  await updateAlertStatus(alertId, userId, 'deleted');
}

/**
 * Check if an alert should trigger
 */
export async function checkAlert(alert: TrendAlert): Promise<{
  shouldTrigger: boolean;
  reason?: string;
  currentScoreA?: number;
  currentScoreB?: number;
}> {
  try {
    // Get current comparison data
    const comparison = await getOrBuildComparison({
      slug: alert.slug,
      terms: [alert.termA, alert.termB],
      timeframe: '12m',
      geo: '',
    });

    if (!comparison) {
      return {
        shouldTrigger: false,
        reason: 'Comparison not found',
      };
    }

    const intelligentComparison = await runIntelligentComparison(
      [alert.termA, alert.termB],
      comparison.series,
      {
        enableYouTube: !!process.env.YOUTUBE_API_KEY,
        enableTMDB: !!process.env.TMDB_API_KEY,
        enableBestBuy: !!process.env.BESTBUY_API_KEY,
        enableSpotify: !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET),
        enableSteam: true,
        cachedCategory: comparison.category,
      }
    );

    const currentScoreA = Math.round(intelligentComparison.scores.termA.overall);
    const currentScoreB = Math.round(intelligentComparison.scores.termB.overall);

    // Check based on alert type
    if (alert.alertType === 'score_change') {
      const changeA = Math.abs(currentScoreA - (alert.baselineScoreA || 0));
      const changeB = Math.abs(currentScoreB - (alert.baselineScoreB || 0));
      const maxChange = Math.max(changeA, changeB);
      const percentChange = alert.baselineScoreA 
        ? (maxChange / alert.baselineScoreA) * 100 
        : 0;

      if (percentChange >= alert.changePercent) {
        return {
          shouldTrigger: true,
          reason: `Score changed by ${percentChange.toFixed(1)}% (threshold: ${alert.changePercent}%)`,
          currentScoreA,
          currentScoreB,
        };
      }
    } else if (alert.alertType === 'position_change') {
      // Check if winner changed
      const baselineWinner = (alert.baselineScoreA || 0) >= (alert.baselineScoreB || 0) 
        ? alert.termA 
        : alert.termB;
      const currentWinner = currentScoreA >= currentScoreB ? alert.termA : alert.termB;

      if (baselineWinner !== currentWinner) {
        return {
          shouldTrigger: true,
          reason: `Winner changed from ${baselineWinner} to ${currentWinner}`,
          currentScoreA,
          currentScoreB,
        };
      }
    } else if (alert.alertType === 'threshold' && alert.threshold) {
      // Check if score exceeds threshold
      if (currentScoreA >= alert.threshold || currentScoreB >= alert.threshold) {
        const term = currentScoreA >= alert.threshold ? alert.termA : alert.termB;
        const score = currentScoreA >= alert.threshold ? currentScoreA : currentScoreB;
        return {
          shouldTrigger: true,
          reason: `${term} reached threshold of ${alert.threshold} (current: ${score})`,
          currentScoreA,
          currentScoreB,
        };
      }
    }

    // Alert didn't trigger - update last checked
    // (If alert triggered, the caller will update lastTriggered and lastChecked)
    await prisma.trendAlert.update({
      where: { id: alert.id },
      data: { lastChecked: new Date() },
    });

    return {
      shouldTrigger: false,
      currentScoreA,
      currentScoreB,
    };
  } catch (error) {
    console.error('[TrendAlerts] Error checking alert:', error);
    return {
      shouldTrigger: false,
    };
  }
}

/**
 * Get alerts that need checking (based on frequency)
 */
export async function getAlertsToCheck(): Promise<TrendAlert[]> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const alerts = await prisma.trendAlert.findMany({
    where: {
      status: 'active',
      OR: [
        // Never checked before
        { lastChecked: null },
        // Instant alerts: check every hour
        {
          AND: [
            { frequency: 'instant' },
            { lastChecked: { lt: oneHourAgo } },
          ],
        },
        // Daily alerts: check once per day
        {
          AND: [
            { frequency: 'daily' },
            { lastChecked: { lt: oneDayAgo } },
          ],
        },
        // Weekly alerts: check once per week
        {
          AND: [
            { frequency: 'weekly' },
            { lastChecked: { lt: oneWeekAgo } },
          ],
        },
      ],
    },
    orderBy: {
      lastChecked: 'asc', // Check oldest first
    },
  });

  return alerts as TrendAlert[];
}


