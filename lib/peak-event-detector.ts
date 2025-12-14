/**
 * Peak Event Detector with Citations
 * Detects peaks in trend data and finds real-world events with citations
 */

import type { SeriesPoint } from './trends';
import { detectEventsMultiSource, type UnifiedEvent } from './insights/events/multi-source-detector';

export type PeakEvent = {
  date: string;
  value: number;
  term: string;
  event: UnifiedEvent | null;
  confidence: number;
  citations: Array<{
    title: string;
    url: string;
    source: string;
  }>;
};

/**
 * Detect peaks in trend data and find associated events
 */
export async function detectPeaksWithEvents(
  series: SeriesPoint[],
  terms: string[],
  minProminence: number = 20 // Minimum spike to consider a peak
): Promise<PeakEvent[]> {
  const peaks: PeakEvent[] = [];

  for (const term of terms) {
    const values = series.map(p => Number(p[term] || 0));
    const dates = series.map(p => p.date);
    
    // Find peaks using simple algorithm: value significantly higher than neighbors
    const detectedPeaks = findPeaks(values, dates, minProminence);
    
    for (const peak of detectedPeaks) {
      // Try to find events around this peak date
      const peakDate = new Date(peak.date);
      const events = await detectEventsMultiSource(peakDate, [term], 7).catch(() => []);
      
      // Get the best matching event
      const bestEvent = events.length > 0 ? events[0] : null;
      
      // Build citations from event URLs
      const citations = bestEvent?.urls?.map(url => ({
        title: bestEvent.title,
        url,
        source: bestEvent.sources.join(', '),
      })) || [];
      
      peaks.push({
        date: peak.date,
        value: peak.value,
        term,
        event: bestEvent,
        confidence: bestEvent ? (bestEvent.verified ? 90 : bestEvent.confidence === 'high' ? 75 : 50) : 30,
        citations,
      });
    }
  }

  // Sort by value (highest peaks first)
  return peaks.sort((a, b) => b.value - a.value);
}

/**
 * Simple peak detection algorithm
 */
function findPeaks(
  values: number[],
  dates: string[],
  minProminence: number
): Array<{ date: string; value: number }> {
  const peaks: Array<{ date: string; value: number }> = [];
  
  if (values.length < 3) return peaks;
  
  // Calculate average to determine prominence threshold
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const threshold = avg + minProminence;
  
  for (let i = 1; i < values.length - 1; i++) {
    const current = values[i];
    const prev = values[i - 1];
    const next = values[i + 1];
    
    // Peak if current is higher than neighbors and above threshold
    if (current > prev && current > next && current >= threshold) {
      // Check if it's significantly higher (at least 20% more than neighbors)
      const minNeighbor = Math.min(prev, next);
      if (current >= minNeighbor * 1.2) {
        peaks.push({
          date: dates[i],
          value: current,
        });
      }
    }
  }
  
  return peaks;
}

/**
 * Get event citations for a specific date and term
 */
export async function getEventCitations(
  date: Date | string,
  term: string,
  windowDays: number = 7
): Promise<Array<{ title: string; url: string; source: string; verified: boolean }>> {
  try {
    const events = await detectEventsMultiSource(date, [term], windowDays);
    
    return events.map(event => ({
      title: event.title,
      url: event.urls?.[0] || '',
      source: event.sources.join(', '),
      verified: event.verified,
    }));
  } catch (error) {
    console.error('[PeakEventDetector] Error getting citations:', error);
    return [];
  }
}

