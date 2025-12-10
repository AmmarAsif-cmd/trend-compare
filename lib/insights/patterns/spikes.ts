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
import { getBestEventExplanation, formatEventForDisplay } from '../events/multi-source-detector';

/**
 * Detect spikes (unusual surges)
 */
export async function detectSpikes(
  series: EnrichedDataPoint[],
  term: string,
  thresholdStdDev: number = 2,
  minMagnitude: number = 20,
  allTerms: string[] = []
): Promise<SpikeEvent[]> {
  if (series.length < 7) return []; // Need minimum data

  const values = series.map(p => p[term] as number);

  // Calculate baseline statistics
  const mean = calculateMean(values);
  const stdDev = calculateStdDev(values);

  // Statistical threshold (2 standard deviations above mean)
  const threshold = mean + (thresholdStdDev * stdDev);

  const potentialSpikes: Array<{ point: EnrichedDataPoint; index: number; magnitude: number; zScore: number }> = [];

  series.forEach((point, index) => {
    const value = point[term] as number;

    // Check if this is a spike
    if (value > threshold) {
      const magnitude = ((value - mean) / mean) * 100;

      // Only consider significant spikes
      if (magnitude >= minMagnitude) {
        const zScore = calculateZScore(value, mean, stdDev);
        potentialSpikes.push({ point, index, magnitude, zScore });
      }
    }
  });

  // Fetch contexts for all spikes in parallel
  const keywords = allTerms.length > 0 ? allTerms : [term];
  const contextPromises = potentialSpikes.map(s => inferSpikeContext(s.point, keywords));
  const contexts = await Promise.all(contextPromises);

  // Build spike events with contexts
  const spikes: SpikeEvent[] = potentialSpikes.map((spike, i) => ({
    type: 'spike',
    date: spike.point.date,
    value: spike.point[term] as number,
    magnitude: spike.magnitude,
    zScore: spike.zScore,
    context: contexts[i],
    confidence: Math.min(100, Math.round(spike.zScore * 25)),
    strength: Math.round(spike.magnitude),
    description: generateSpikeDescription(spike.magnitude, spike.point, contexts[i]),
    dataPoints: [spike.index],
    metadata: {
      baseline: mean,
      threshold,
      stdDev,
    },
  }));

  // Sort by magnitude (strongest first)
  spikes.sort((a, b) => b.magnitude - a.magnitude);

  // Return top spikes (avoid overwhelming with too many)
  return spikes.slice(0, 5);
}

/**
 * Detect anomalies (outliers using IQR method)
 * More conservative than spike detection
 */
export async function detectAnomalies(
  series: EnrichedDataPoint[],
  term: string,
  allTerms: string[] = []
): Promise<SpikeEvent[]> {
  if (series.length < 10) return [];

  const values = series.map(p => p[term] as number);
  const outlierIndices = detectOutliers(values);

  const keywords = allTerms.length > 0 ? allTerms : [term];
  const mean = calculateMean(values);
  const stdDev = calculateStdDev(values);

  // Fetch contexts for all anomalies in parallel
  const points = outlierIndices.map(index => series[index]);
  const contextPromises = points.map(point => inferSpikeContext(point, keywords));
  const contexts = await Promise.all(contextPromises);

  const anomalies: SpikeEvent[] = outlierIndices.map((index, i) => {
    const point = series[index];
    const value = point[term] as number;
    const magnitude = ((value - mean) / mean) * 100;
    const zScore = calculateZScore(value, mean, stdDev);
    const context = contexts[i];

    return {
      type: 'anomaly',
      date: point.date,
      value,
      magnitude,
      zScore,
      context,
      confidence: Math.min(100, Math.round(Math.abs(zScore) * 25)),
      strength: Math.round(Math.abs(magnitude)),
      description: generateAnomalyDescription(magnitude, point, context),
      dataPoints: [index],
      metadata: {
        detectionMethod: 'IQR',
      },
    };
  });

  return anomalies.sort((a, b) => Math.abs(b.magnitude) - Math.abs(a.magnitude));
}

/**
 * Calculate relevance score for an event to a keyword
 * Returns 0-100, higher = more relevant
 */
function calculateEventRelevance(event: { title: string; description: string }, keyword: string): number {
  const kw = keyword.toLowerCase();
  const title = event.title.toLowerCase();
  const desc = event.description.toLowerCase();

  // Also check keyword without hyphens
  const kwNoHyphen = kw.replace(/-/g, ' ');

  let score = 0;

  // Exact match in title = very relevant
  if (title === kw || title === kwNoHyphen ||
      title.includes(` ${kw} `) || title.includes(` ${kwNoHyphen} `) ||
      title.startsWith(kw + ' ') || title.startsWith(kwNoHyphen + ' ') ||
      title.endsWith(' ' + kw) || title.endsWith(' ' + kwNoHyphen)) {
    score += 50;
  }

  // Title contains keyword (with or without hyphens)
  if (title.includes(kw) || title.includes(kwNoHyphen)) {
    score += 30;
  }

  // Description contains keyword (with or without hyphens)
  if (desc.includes(kw) || desc.includes(kwNoHyphen)) {
    score += 15; // Increased from 10
  }

  // Partial word matching for better coverage
  const kwParts = kwNoHyphen.split(' ');
  if (kwParts.length > 1) {
    const allPartsInTitle = kwParts.every(part => title.includes(part));
    const allPartsInDesc = kwParts.every(part => desc.includes(part));

    if (allPartsInTitle) score += 20;
    else if (allPartsInDesc) score += 10;
  }

  // Penalize if event is about specific content when searching for platforms
  // e.g., "honey singh documentary" shouldn't match "netflix" search
  const platformKeywords = ['netflix', 'disney', 'hulu', 'amazon', 'apple', 'google', 'microsoft', 'meta', 'aws', 'azure'];
  if (platformKeywords.includes(kw)) {
    // If title is about specific content/people, penalize
    const isSpecificContent = title.match(/\b(documentary|movie|show|series|fight|match|vs|concert|album)\b/);
    if (isSpecificContent && !title.includes(kw)) {
      score = Math.max(0, score - 40); // Heavy penalty
    }
  }

  return Math.min(100, score);
}

/**
 * Infer context for why a spike might have occurred
 * PRIORITIZES APIs over database, uses relevance scoring
 * If nothing is found, returns undefined - NO GUESSING!
 */
async function inferSpikeContext(point: EnrichedDataPoint, keywords: string[]): Promise<string | undefined> {
  const date = new Date(point.date);
  const now = new Date();

  // Skip future dates - we can't detect events for dates that haven't happened
  if (date > now) {
    console.log(`[Event Detection] Skipping future date: ${point.date}`);
    return undefined;
  }

  // Log what we're searching for
  console.log(`[Event Detection] Searching for events on ${point.date} with keywords:`, keywords);

  try {
    // STRATEGY 1: Try APIs first (Wikipedia + GDELT + NewsAPI)
    // These are live, comprehensive, and always up-to-date
    const event = await getBestEventExplanation(point.date, keywords, 7);

    if (event) {
      // Calculate relevance score for this event
      const relevanceScores = keywords.map(kw => calculateEventRelevance(event, kw));
      const maxRelevance = Math.max(...relevanceScores);

      console.log(`[Event Detection] API event relevance: ${maxRelevance}/100 for "${event.title}"`);

      // Only use if relevance is decent (>20) - lowered threshold for better detection
      if (maxRelevance > 20) {
        console.log(`[Event Detection] ✓ Using API event:`, event.title, `(${event.sources.length} sources, ${maxRelevance}% relevant)`);
        return formatEventForDisplay(event);
      } else {
        console.log(`[Event Detection] ✗ API event too generic (${maxRelevance}% relevance), trying fallback`);
      }
    }

    console.log(`[Event Detection] ✗ No relevant events from APIs`);
  } catch (error) {
    console.error('[Event Detection] API error:', error);
  }

  // STRATEGY 2: Fallback to curated tech database (only for high-impact, broad events)
  const techEvent = getBestMatchingEvent(point.date, keywords, 7);

  if (techEvent) {
    // Calculate relevance for tech database event
    const relevanceScores = keywords.map(kw => calculateEventRelevance(techEvent, kw));
    const maxRelevance = Math.max(...relevanceScores);

    console.log(`[Event Detection] Tech DB event relevance: ${maxRelevance}/100 for "${techEvent.title}"`);

    // Only use if highly relevant (>30) - database events must be more relevant than APIs
    if (maxRelevance > 30) {
      console.log(`[Event Detection] ✓ Using tech DB event:`, techEvent.title, `(${maxRelevance}% relevant)`);
      return getEventContext(techEvent);
    } else {
      console.log(`[Event Detection] ✗ Tech DB event not relevant enough (${maxRelevance}%)`);
    }
  }

  // NO GENERIC FALLBACKS!
  // Better to show no explanation than a wrong one
  console.log(`[Event Detection] ✗ No relevant explanation found - returning undefined`);
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
