/**
 * Multi-Source Event Detection & Verification
 * Combines multiple data sources to detect and verify real events
 * - Wikipedia (structured daily events)
 * - GDELT (real-time global news)
 * - Tech Events Database (curated launches)
 * - NewsAPI (when API key available)
 */

import { findEventsNearDate, type TechEvent } from './tech-events';
import { getWikipediaEventsNearDate, type WikipediaEvent } from './wikipedia-events';
import { getGDELTEventsNearDate, type GDELTEvent } from './gdelt-events';
import { fetchNewsForDate, newsToEvent } from './news-detector';
import { expandKeywords } from './keyword-expander';
import { getIntelligentKeywords, recordEventDetection } from './event-intelligence';

export interface UnifiedEvent {
  date: string;
  title: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  sources: Array<'tech-db' | 'wikipedia' | 'gdelt' | 'newsapi'>;
  category?: string;
  urls?: string[];
  verified: boolean; // True if confirmed by multiple sources
}

/**
 * Detect events from ALL sources and cross-verify
 */
export async function detectEventsMultiSource(
  date: Date | string,
  keywords: string[],
  windowDays: number = 7
): Promise<UnifiedEvent[]> {
  const targetDate = new Date(date);

  // Step 1: Get base expanded keywords
  const baseExpanded = expandKeywords(keywords);

  // Step 2: Enhance with intelligent keywords from historical success
  const expandedKeywords = getIntelligentKeywords(keywords, baseExpanded);

  console.log('[Multi-Source] Original keywords:', keywords);
  console.log('[Multi-Source] Intelligent + Expanded keywords:', expandedKeywords.slice(0, 15)); // Log first 15

  // Fetch from all sources in parallel
  const [techEvents, wikiEvents, gdeltEvents, newsArticles] = await Promise.all([
    // Source 1: Tech events database (instant, curated)
    Promise.resolve(findEventsNearDate(targetDate, keywords, windowDays)),

    // Source 2: Wikipedia current events (free, reliable, structured)
    getWikipediaEventsNearDate(targetDate, expandedKeywords, windowDays).catch(err => {
      console.warn('[Multi-Source] Wikipedia API failed:', err.message);
      return [];
    }),

    // Source 3: GDELT global news (free, comprehensive, real-time)
    getGDELTEventsNearDate(targetDate, expandedKeywords, windowDays, 20).catch(err => {
      console.warn('[Multi-Source] GDELT API failed:', err.message);
      return [];
    }),

    // Source 4: NewsAPI (optional, requires API key)
    fetchNewsForDate(targetDate, expandedKeywords, windowDays).catch(err => {
      console.warn('[Multi-Source] NewsAPI failed:', err.message);
      return [];
    }),
  ]);

  console.log(`[Multi-Source] Results: Tech=${techEvents.length}, Wiki=${wikiEvents.length}, GDELT=${gdeltEvents.length}, News=${newsArticles.length}`);

  // Convert NewsAPI articles to event format
  const newsEvents = newsArticles.map(article => newsToEvent(article, keywords));

  // Unify and deduplicate events
  const unified = unifyEvents(techEvents, wikiEvents, gdeltEvents, newsEvents);

  // Cross-verify between sources
  const verified = crossVerifyEvents(unified);

  // Record successful detections for learning (asynchronously, don't block)
  if (verified.length > 0) {
    // Record each verified event to improve future searches
    for (const event of verified.filter(e => e.verified)) {
      try {
        // Determine which keyword variation led to this event
        // Use the title to match against our expanded keywords
        const matchingKeyword = expandedKeywords.find(kw =>
          event.title.toLowerCase().includes(kw.toLowerCase()) ||
          event.description.toLowerCase().includes(kw.toLowerCase())
        ) || expandedKeywords[0];

        recordEventDetection(keywords, expandedKeywords, event, matchingKeyword);
      } catch (error) {
        console.warn('[Intelligence] Failed to record detection:', error);
      }
    }
  }

  // Sort by confidence and relevance
  return verified.sort((a, b) => {
    // Verified events first
    if (a.verified !== b.verified) return a.verified ? -1 : 1;

    // Then by confidence
    const confScore = { high: 3, medium: 2, low: 1 };
    const confDiff = confScore[b.confidence] - confScore[a.confidence];
    if (confDiff !== 0) return confDiff;

    // Then by number of sources
    return b.sources.length - a.sources.length;
  });
}

/**
 * Unify events from different sources into common format
 */
function unifyEvents(
  techEvents: TechEvent[],
  wikiEvents: WikipediaEvent[],
  gdeltEvents: GDELTEvent[],
  newsEvents: TechEvent[] = []
): UnifiedEvent[] {
  const unified: UnifiedEvent[] = [];

  // Add tech events
  for (const event of techEvents) {
    unified.push({
      date: event.date,
      title: event.title,
      description: event.description,
      confidence: 'high', // Curated events are high confidence
      sources: ['tech-db'],
      category: event.category,
      verified: false,
    });
  }

  // Add Wikipedia events
  for (const event of wikiEvents) {
    unified.push({
      date: event.date,
      title: event.title,
      description: event.description,
      confidence: 'high', // Wikipedia is reliable
      sources: ['wikipedia'],
      category: event.category,
      urls: [event.url],
      verified: false,
    });
  }

  // Add GDELT events
  for (const event of gdeltEvents) {
    unified.push({
      date: event.date,
      title: event.title,
      description: event.description,
      confidence: 'medium', // News can vary in reliability
      sources: ['gdelt'],
      urls: [event.url],
      verified: false,
    });
  }

  // Add NewsAPI events
  for (const event of newsEvents) {
    unified.push({
      date: event.date,
      title: event.title,
      description: event.description,
      confidence: 'medium', // News varies in reliability
      sources: ['newsapi'],
      category: event.category,
      verified: false,
    });
  }

  return unified;
}

/**
 * Cross-verify events by checking if they appear in multiple sources
 */
function crossVerifyEvents(events: UnifiedEvent[]): UnifiedEvent[] {
  // Group similar events (same date +/- 1 day, similar titles)
  const groups: UnifiedEvent[][] = [];

  for (const event of events) {
    let foundGroup = false;

    for (const group of groups) {
      const representative = group[0];

      // Check if this event belongs to this group
      if (isSimilarEvent(event, representative)) {
        group.push(event);
        foundGroup = true;
        break;
      }
    }

    if (!foundGroup) {
      groups.push([event]);
    }
  }

  // Merge events within each group
  const merged: UnifiedEvent[] = [];

  for (const group of groups) {
    if (group.length === 1) {
      // Single source event
      merged.push(group[0]);
    } else {
      // Multiple sources - merge and mark as verified
      const first = group[0];
      const allSources = Array.from(new Set(group.flatMap(e => e.sources)));
      const allUrls = Array.from(new Set(group.flatMap(e => e.urls || [])));

      // Take the most descriptive title/description
      const longestDesc = group.reduce((a, b) =>
        a.description.length > b.description.length ? a : b
      );

      merged.push({
        date: first.date,
        title: first.title,
        description: longestDesc.description,
        confidence: 'high', // Multiple sources = high confidence
        sources: allSources as any,
        category: first.category,
        urls: allUrls,
        verified: true, // Confirmed by multiple sources
      });
    }
  }

  return merged;
}

/**
 * Check if two events are similar (likely same event from different sources)
 */
function isSimilarEvent(event1: UnifiedEvent, event2: UnifiedEvent): boolean {
  // Check date proximity (within 1 day)
  const date1 = new Date(event1.date).getTime();
  const date2 = new Date(event2.date).getTime();
  const daysDiff = Math.abs((date1 - date2) / (1000 * 60 * 60 * 24));

  if (daysDiff > 1) return false;

  // Check title similarity
  const title1 = event1.title.toLowerCase();
  const title2 = event2.title.toLowerCase();

  // Extract key words (skip common words)
  const words1 = new Set(title1.split(/\s+/).filter(w => w.length > 4));
  const words2 = new Set(title2.split(/\s+/).filter(w => w.length > 4));

  // Calculate Jaccard similarity
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  const similarity = intersection.size / union.size;

  // Similar if > 30% word overlap
  return similarity > 0.3;
}

/**
 * Get the best event explanation for a spike
 */
export async function getBestEventExplanation(
  date: Date | string,
  keywords: string[],
  windowDays: number = 7
): Promise<UnifiedEvent | null> {
  const events = await detectEventsMultiSource(date, keywords, windowDays);

  if (events.length === 0) return null;

  // Return the most confident, verified event
  const verified = events.find(e => e.verified);
  if (verified) return verified;

  // Otherwise return highest confidence event
  return events[0] || null;
}

/**
 * Format event for display to users
 */
export function formatEventForDisplay(event: UnifiedEvent): string {
  const confidence = event.verified ? '(Verified by multiple sources)' : '';
  return `${event.title} ${confidence}`.trim();
}

/**
 * Get event confidence score (0-100)
 */
export function getEventConfidenceScore(event: UnifiedEvent): number {
  let score = 0;

  // Base score from confidence level
  if (event.confidence === 'high') score += 40;
  else if (event.confidence === 'medium') score += 25;
  else score += 10;

  // Bonus for each source
  score += event.sources.length * 15;

  // Bonus if verified
  if (event.verified) score += 25;

  return Math.min(100, score);
}
