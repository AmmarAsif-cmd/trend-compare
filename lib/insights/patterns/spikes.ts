/**
 * Spike & Anomaly Detection
 * Identifies unusual surges or drops in interest
 * Uses statistical methods - NO keyword-specific rules
 */

import type { EnrichedDataPoint, SpikeEvent } from '../core/types';
import { calculateMean, calculateStdDev, calculateZScore, detectOutliers } from '../core/statistics';
import {
  isHoliday,
  isShoppingSeason,
  formatDate,
  getMonthName,
  getDayName,
} from '../core/temporal';

/**
 * Detect spikes (unusual surges)
 */
export function detectSpikes(
  series: EnrichedDataPoint[],
  term: string,
  thresholdStdDev: number = 2,
  minMagnitude: number = 20
): SpikeEvent[] {
  if (series.length < 7) return []; // Need minimum data

  const values = series.map(p => p[term] as number);

  // Calculate baseline statistics
  const mean = calculateMean(values);
  const stdDev = calculateStdDev(values);

  // Statistical threshold (2 standard deviations above mean)
  const threshold = mean + (thresholdStdDev * stdDev);

  const spikes: SpikeEvent[] = [];

  series.forEach((point, index) => {
    const value = point[term] as number;

    // Check if this is a spike
    if (value > threshold) {
      const magnitude = ((value - mean) / mean) * 100;

      // Only consider significant spikes
      if (magnitude >= minMagnitude) {
        const zScore = calculateZScore(value, mean, stdDev);
        const context = inferSpikeContext(point);

        spikes.push({
          type: 'spike',
          date: point.date,
          value,
          magnitude,
          zScore,
          context,
          confidence: Math.min(100, Math.round(zScore * 25)),
          strength: Math.round(magnitude),
          description: generateSpikeDescription(magnitude, point, context),
          dataPoints: [index],
          metadata: {
            baseline: mean,
            threshold,
            stdDev,
          },
        });
      }
    }
  });

  // Sort by magnitude (strongest first)
  spikes.sort((a, b) => b.magnitude - a.magnitude);

  // Return top spikes (avoid overwhelming with too many)
  return spikes.slice(0, 5);
}

/**
 * Detect anomalies (outliers using IQR method)
 * More conservative than spike detection
 */
export function detectAnomalies(
  series: EnrichedDataPoint[],
  term: string
): SpikeEvent[] {
  if (series.length < 10) return [];

  const values = series.map(p => p[term] as number);
  const outlierIndices = detectOutliers(values);

  const anomalies: SpikeEvent[] = outlierIndices.map(index => {
    const point = series[index];
    const value = point[term] as number;

    const mean = calculateMean(values);
    const stdDev = calculateStdDev(values);
    const magnitude = ((value - mean) / mean) * 100;
    const zScore = calculateZScore(value, mean, stdDev);

    return {
      type: 'anomaly',
      date: point.date,
      value,
      magnitude,
      zScore,
      context: inferSpikeContext(point),
      confidence: Math.min(100, Math.round(Math.abs(zScore) * 25)),
      strength: Math.round(Math.abs(magnitude)),
      description: generateAnomalyDescription(magnitude, point),
      dataPoints: [index],
      metadata: {
        detectionMethod: 'IQR',
      },
    };
  });

  return anomalies.sort((a, b) => Math.abs(b.magnitude) - Math.abs(a.magnitude));
}

/**
 * Infer context for why a spike might have occurred
 * Uses GENERIC calendar events - NO keyword-specific logic
 */
function inferSpikeContext(point: EnrichedDataPoint): string | undefined {
  const date = new Date(point.date);
  const month = point.month ?? date.getMonth();
  const dayOfMonth = point.dayOfMonth ?? date.getDate();
  const dayOfWeek = point.dayOfWeek ?? date.getDay();

  // Check for generic calendar patterns
  const contexts: string[] = [];

  // Holiday season
  if (month === 11 && dayOfMonth >= 20) {
    contexts.push('Holiday shopping period');
  } else if (month === 10 && dayOfMonth >= 20) {
    contexts.push('Black Friday/Cyber Monday period');
  }

  // New Year
  if (month === 0 && dayOfMonth <= 7) {
    contexts.push('New Year period');
  }

  // Back to school
  if ((month === 7 && dayOfMonth >= 15) || (month === 8 && dayOfMonth <= 15)) {
    contexts.push('Back-to-school season');
  }

  // Spring season (tax refunds, spring shopping)
  if (month >= 2 && month <= 4) {
    contexts.push('Spring season');
  }

  // Summer vacation
  if (month >= 5 && month <= 7) {
    contexts.push('Summer period');
  }

  // Fall season
  if (month >= 8 && month <= 10) {
    contexts.push('Fall season');
  }

  // Payday patterns (beginning/end of month)
  if (dayOfMonth <= 5) {
    contexts.push('Beginning of month');
  } else if (dayOfMonth >= 25) {
    contexts.push('End of month');
  }

  // Weekend patterns
  if (point.isWeekend || dayOfWeek === 0 || dayOfWeek === 6) {
    contexts.push('Weekend');
  }

  // Mid-week (Tuesday-Thursday typically higher for B2B)
  if (dayOfWeek >= 2 && dayOfWeek <= 4) {
    contexts.push('Mid-week period');
  }

  // Major shopping days
  if (isShoppingSeason(date)) {
    contexts.push('Major shopping season');
  }

  // Holiday
  if (isHoliday(date)) {
    contexts.push('Major holiday');
  }

  // Quarter end (business reporting)
  const isQuarterEnd = (month + 1) % 3 === 0 && dayOfMonth >= 25;
  if (isQuarterEnd) {
    contexts.push('Quarter-end period');
  }

  return contexts.length > 0 ? contexts[0] : undefined;
}

/**
 * Generate description for spike
 */
function generateSpikeDescription(
  magnitude: number,
  point: EnrichedDataPoint,
  context?: string
): string {
  const date = formatDate(point.date, 'long');
  const rounded = Math.round(magnitude);

  if (context) {
    return `${rounded}% surge on ${date}, coinciding with ${context.toLowerCase()}`;
  }

  return `${rounded}% increase observed on ${date}`;
}

/**
 * Generate description for anomaly
 */
function generateAnomalyDescription(
  magnitude: number,
  point: EnrichedDataPoint
): string {
  const date = formatDate(point.date, 'long');
  const rounded = Math.round(Math.abs(magnitude));

  if (magnitude > 0) {
    return `Unusual ${rounded}% surge detected on ${date}`;
  } else {
    return `Unusual ${rounded}% drop detected on ${date}`;
  }
}

/**
 * Classify spike significance
 */
export function classifySpike(magnitude: number, zScore: number): 'minor' | 'moderate' | 'major' | 'extreme' {
  if (zScore >= 4 || magnitude >= 100) return 'extreme';
  if (zScore >= 3 || magnitude >= 50) return 'major';
  if (zScore >= 2 || magnitude >= 25) return 'moderate';
  return 'minor';
}

/**
 * Find spike clusters (multiple spikes close together)
 */
export function findSpikeClusters(
  spikes: SpikeEvent[],
  maxDaysBetween: number = 7
): Array<{ spikes: SpikeEvent[]; startDate: string; endDate: string }> {
  if (spikes.length === 0) return [];

  // Sort by date
  const sorted = [...spikes].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const clusters: Array<{ spikes: SpikeEvent[]; startDate: string; endDate: string }> = [];
  let currentCluster: SpikeEvent[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(sorted[i - 1].date);
    const currDate = new Date(sorted[i].date);
    const daysDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff <= maxDaysBetween) {
      // Part of same cluster
      currentCluster.push(sorted[i]);
    } else {
      // New cluster
      if (currentCluster.length >= 2) {
        clusters.push({
          spikes: currentCluster,
          startDate: currentCluster[0].date,
          endDate: currentCluster[currentCluster.length - 1].date,
        });
      }
      currentCluster = [sorted[i]];
    }
  }

  // Don't forget the last cluster
  if (currentCluster.length >= 2) {
    clusters.push({
      spikes: currentCluster,
      startDate: currentCluster[0].date,
      endDate: currentCluster[currentCluster.length - 1].date,
    });
  }

  return clusters;
}
