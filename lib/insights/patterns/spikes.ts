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
import { findEventsNearDate, getBestMatchingEvent, getEventContext } from '../events/tech-events';

/**
 * Detect spikes (unusual surges)
 */
export function detectSpikes(
  series: EnrichedDataPoint[],
  term: string,
  thresholdStdDev: number = 2,
  minMagnitude: number = 20,
  allTerms: string[] = []
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
        const keywords = allTerms.length > 0 ? allTerms : [term];
        const context = inferSpikeContext(point, keywords);

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
  term: string,
  allTerms: string[] = []
): SpikeEvent[] {
  if (series.length < 10) return [];

  const values = series.map(p => p[term] as number);
  const outlierIndices = detectOutliers(values);

  const keywords = allTerms.length > 0 ? allTerms : [term];

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
      context: inferSpikeContext(point, keywords),
      confidence: Math.min(100, Math.round(Math.abs(zScore) * 25)),
      strength: Math.round(Math.abs(magnitude)),
      description: generateAnomalyDescription(magnitude, point, inferSpikeContext(point, keywords)),
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
 * Uses REAL EVENTS - product launches, news, actual happenings
 */
function inferSpikeContext(point: EnrichedDataPoint, keywords: string[]): string | undefined {
  const date = new Date(point.date);

  // First, try to find a real tech event
  const matchedEvent = getBestMatchingEvent(point.date, keywords, 7);

  if (matchedEvent) {
    return getEventContext(matchedEvent);
  }

  // If no specific tech event, check for major calendar events only
  // (but DON'T use generic "back-to-school" or "fall season" nonsense)
  const month = point.month ?? date.getMonth();
  const dayOfMonth = point.dayOfMonth ?? date.getDate();

  // Black Friday
  if (month === 10 && dayOfMonth >= 23 && dayOfMonth <= 29) {
    return 'Black Friday shopping event';
  }

  // Cyber Monday
  if (month === 10 && dayOfMonth >= 26 && dayOfMonth <= 30) {
    return 'Cyber Monday online shopping';
  }

  // Christmas shopping
  if (month === 11 && dayOfMonth >= 20) {
    return 'Christmas holiday shopping';
  }

  // New Year
  if (month === 0 && dayOfMonth <= 7) {
    return 'New Year resolutions and shopping';
  }

  // No generic seasonal context - if we don't know, we don't know
  return undefined;
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
    return `${rounded}% increase in searches on ${date} - likely due to: ${context}`;
  }

  return `${rounded}% increase in searches on ${date}`;
}

/**
 * Generate description for anomaly
 */
function generateAnomalyDescription(
  magnitude: number,
  point: EnrichedDataPoint,
  context?: string
): string {
  const date = formatDate(point.date, 'long');
  const rounded = Math.round(Math.abs(magnitude));

  if (magnitude > 0) {
    if (context) {
      return `Unusual ${rounded}% increase in searches on ${date} - likely due to: ${context}`;
    }
    return `Unusual ${rounded}% increase in searches on ${date}`;
  } else {
    if (context) {
      return `Unusual ${rounded}% drop in searches on ${date} - possibly related to: ${context}`;
    }
    return `Unusual ${rounded}% drop in searches on ${date}`;
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
