/**
 * Deduplication and Quality Filtering Utilities
 * Removes duplicate events and filters out weak insights
 */

import type { SpikeEvent } from '../core/types';

/**
 * Deduplicate events that refer to the same spike
 * Prioritizes spikes over anomalies (spikes are more specific)
 */
export function deduplicateEvents(events: Array<SpikeEvent & { term: string; eventType: string }>): Array<SpikeEvent & { term: string; eventType: string }> {
  if (events.length === 0) return [];

  // Group events by term and date (within 3 days of each other)
  const groups: Map<string, Array<SpikeEvent & { term: string; eventType: string }>> = new Map();

  for (const event of events) {
    const eventTime = new Date(event.date).getTime();
    let foundGroup = false;

    // Check if this event belongs to an existing group
    for (const [groupKey, groupEvents] of groups.entries()) {
      const groupTime = new Date(groupEvents[0].date).getTime();
      const daysDiff = Math.abs((eventTime - groupTime) / (1000 * 60 * 60 * 24));

      // Same term and within 3 days = same event
      if (groupEvents[0].term === event.term && daysDiff <= 3) {
        groupEvents.push(event);
        foundGroup = true;
        break;
      }
    }

    if (!foundGroup) {
      groups.set(`${event.term}-${event.date}`, [event]);
    }
  }

  // For each group, pick the best representative
  const deduplicated: Array<SpikeEvent & { term: string; eventType: string }> = [];

  for (const groupEvents of groups.values()) {
    if (groupEvents.length === 1) {
      deduplicated.push(groupEvents[0]);
      continue;
    }

    // Prefer spikes over anomalies (spikes are more specific)
    const spikes = groupEvents.filter(e => e.eventType === 'spike');
    if (spikes.length > 0) {
      // Take the one with highest magnitude
      spikes.sort((a, b) => b.magnitude - a.magnitude);
      deduplicated.push(spikes[0]);
    } else {
      // All anomalies, take the highest magnitude
      groupEvents.sort((a, b) => b.magnitude - a.magnitude);
      deduplicated.push(groupEvents[0]);
    }
  }

  return deduplicated;
}

/**
 * Filter out weak or meaningless insights
 */
export function filterWeakInsights(insights: any[]): any[] {
  return insights.filter(insight => {
    // Filter out trends with very low strength
    if (insight.type === 'trend' && insight.strength !== undefined) {
      if (insight.strength < 10) {
        return false; // Too weak to be meaningful
      }
    }

    // Filter out insights with very low confidence
    if (insight.confidence !== undefined && insight.confidence < 50) {
      return false;
    }

    return true;
  });
}

/**
 * Check if an insight is meaningful enough to show
 */
export function isMeaningfulInsight(content: string): boolean {
  // Remove insights that are too vague or generic
  const vaguePatterns = [
    /is stable with \d+% trend strength/i,
    /no significant change/i,
    /relatively stable/i,
  ];

  for (const pattern of vaguePatterns) {
    if (pattern.test(content)) {
      return false;
    }
  }

  return true;
}

/**
 * Sort events by importance
 */
export function sortByImportance(events: Array<SpikeEvent & { term: string; eventType: string }>): Array<SpikeEvent & { term: string; eventType: string }> {
  return events.sort((a, b) => {
    // First by magnitude (bigger changes are more important)
    const magnitudeDiff = b.magnitude - a.magnitude;
    if (Math.abs(magnitudeDiff) > 10) return magnitudeDiff;

    // Then by whether they have context (events with explanations are more valuable)
    const aHasContext = a.context ? 1 : 0;
    const bHasContext = b.context ? 1 : 0;
    if (aHasContext !== bHasContext) return bHasContext - aHasContext;

    // Then by date (more recent = more relevant)
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}
