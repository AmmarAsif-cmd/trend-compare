/**
 * Tech Product Launch & Event Database
 * Real events that cause search spikes - not generic seasons
 */

export interface TechEvent {
  date: string; // YYYY-MM-DD
  title: string;
  description: string;
  keywords: string[]; // Related search terms
  category: 'product-launch' | 'announcement' | 'update' | 'news' | 'conference';
  company: string;
  impact: 'high' | 'medium' | 'low';
}

/**
 * Database of known tech events
 * TODO: Move to database and make this dynamic
 */
export const TECH_EVENTS_2024: TechEvent[] = [
  // Apple Events
  {
    date: '2024-09-09',
    title: 'Apple iPhone 16 Launch Event',
    description: 'Apple announces iPhone 16, iPhone 16 Pro, Apple Watch Series 10, and AirPods 4',
    keywords: ['iphone', 'apple', 'iphone 16', 'ios', 'apple watch'],
    category: 'product-launch',
    company: 'Apple',
    impact: 'high',
  },
  {
    date: '2024-09-16',
    title: 'iPhone 16 Pre-orders Begin',
    description: 'Pre-orders start for iPhone 16 series',
    keywords: ['iphone', 'iphone 16', 'apple', 'preorder'],
    category: 'product-launch',
    company: 'Apple',
    impact: 'high',
  },
  {
    date: '2024-09-20',
    title: 'iPhone 16 Release Date',
    description: 'iPhone 16 officially available in stores',
    keywords: ['iphone', 'iphone 16', 'apple'],
    category: 'product-launch',
    company: 'Apple',
    impact: 'high',
  },
  {
    date: '2024-06-10',
    title: 'Apple WWDC 2024',
    description: 'Apple announces iOS 18, macOS Sequoia, and Apple Intelligence',
    keywords: ['apple', 'wwdc', 'ios', 'macos', 'iphone'],
    category: 'conference',
    company: 'Apple',
    impact: 'high',
  },

  // Google Events
  {
    date: '2024-08-13',
    title: 'Google Pixel 9 Launch Event',
    description: 'Google announces Pixel 9, Pixel 9 Pro, and Pixel Watch 3',
    keywords: ['google', 'pixel', 'android', 'pixel 9', 'google pixel'],
    category: 'product-launch',
    company: 'Google',
    impact: 'high',
  },
  {
    date: '2024-10-04',
    title: 'Android 15 Release',
    description: 'Google releases Android 15 to Pixel devices',
    keywords: ['android', 'google', 'pixel', 'android 15'],
    category: 'update',
    company: 'Google',
    impact: 'medium',
  },
  {
    date: '2024-05-14',
    title: 'Google I/O 2024',
    description: 'Google announces Android 15, Gemini AI updates, and new features',
    keywords: ['google', 'android', 'pixel', 'ai'],
    category: 'conference',
    company: 'Google',
    impact: 'high',
  },

  // Samsung Events
  {
    date: '2024-07-10',
    title: 'Samsung Galaxy Unpacked',
    description: 'Samsung announces Galaxy Z Fold 6, Z Flip 6, and Galaxy Ring',
    keywords: ['samsung', 'galaxy', 'android', 'galaxy fold', 'galaxy flip'],
    category: 'product-launch',
    company: 'Samsung',
    impact: 'high',
  },
  {
    date: '2024-01-17',
    title: 'Samsung Galaxy S24 Launch',
    description: 'Samsung unveils Galaxy S24, S24+, and S24 Ultra',
    keywords: ['samsung', 'galaxy', 'android', 'galaxy s24'],
    category: 'product-launch',
    company: 'Samsung',
    impact: 'high',
  },

  // Other Tech Events
  {
    date: '2024-11-22',
    title: 'Black Friday 2024',
    description: 'Major shopping event with deals on electronics',
    keywords: ['iphone', 'android', 'samsung', 'pixel', 'deals', 'shopping'],
    category: 'news',
    company: 'Industry',
    impact: 'high',
  },
  {
    date: '2024-11-29',
    title: 'Cyber Monday 2024',
    description: 'Online shopping deals on tech products',
    keywords: ['iphone', 'android', 'samsung', 'pixel', 'deals'],
    category: 'news',
    company: 'Industry',
    impact: 'high',
  },
  {
    date: '2024-12-25',
    title: 'Christmas Holiday',
    description: 'Holiday shopping and gift purchases peak',
    keywords: ['iphone', 'android', 'samsung', 'pixel', 'gift'],
    category: 'news',
    company: 'Industry',
    impact: 'high',
  },
];

export const TECH_EVENTS_2025: TechEvent[] = [
  // Apple Events
  {
    date: '2025-09-08',
    title: 'Apple iPhone 17 Launch Event',
    description: 'Apple announces iPhone 17 series and new products',
    keywords: ['iphone', 'apple', 'iphone 17', 'ios'],
    category: 'product-launch',
    company: 'Apple',
    impact: 'high',
  },
  {
    date: '2025-06-09',
    title: 'Apple WWDC 2025',
    description: 'Apple developer conference with iOS 19 and software updates',
    keywords: ['apple', 'wwdc', 'ios', 'iphone'],
    category: 'conference',
    company: 'Apple',
    impact: 'high',
  },

  // Google Events
  {
    date: '2025-08-12',
    title: 'Google Pixel 10 Launch',
    description: 'Google announces Pixel 10 series',
    keywords: ['google', 'pixel', 'android', 'pixel 10'],
    category: 'product-launch',
    company: 'Google',
    impact: 'high',
  },
  {
    date: '2025-05-13',
    title: 'Google I/O 2025',
    description: 'Google developer conference with Android updates',
    keywords: ['google', 'android', 'pixel'],
    category: 'conference',
    company: 'Google',
    impact: 'high',
  },

  // Samsung Events
  {
    date: '2025-07-09',
    title: 'Samsung Galaxy Unpacked',
    description: 'Samsung announces new Galaxy devices',
    keywords: ['samsung', 'galaxy', 'android'],
    category: 'product-launch',
    company: 'Samsung',
    impact: 'high',
  },
  {
    date: '2025-01-22',
    title: 'Samsung Galaxy S25 Launch',
    description: 'Samsung unveils Galaxy S25 series',
    keywords: ['samsung', 'galaxy', 'android', 'galaxy s25'],
    category: 'product-launch',
    company: 'Samsung',
    impact: 'high',
  },
];

/**
 * Find events near a specific date
 */
export function findEventsNearDate(
  date: string | Date,
  keywords: string[],
  windowDays: number = 7
): TechEvent[] {
  const targetDate = new Date(date);
  const targetTime = targetDate.getTime();

  const allEvents = [...TECH_EVENTS_2024, ...TECH_EVENTS_2025];

  return allEvents.filter(event => {
    // Check if event is within time window
    const eventDate = new Date(event.date);
    const eventTime = eventDate.getTime();
    const daysDiff = Math.abs((targetTime - eventTime) / (1000 * 60 * 60 * 24));

    if (daysDiff > windowDays) return false;

    // Check if event is relevant to any of the keywords
    const isRelevant = keywords.some(keyword =>
      event.keywords.some(eventKeyword =>
        eventKeyword.toLowerCase().includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(eventKeyword.toLowerCase())
      )
    );

    return isRelevant;
  });
}

/**
 * Get the most likely event for a spike
 */
export function getBestMatchingEvent(
  date: string | Date,
  keywords: string[],
  windowDays: number = 7
): TechEvent | null {
  const events = findEventsNearDate(date, keywords, windowDays);

  if (events.length === 0) return null;

  // Sort by impact and date proximity
  const targetTime = new Date(date).getTime();

  events.sort((a, b) => {
    // First by impact
    const impactScore: Record<string, number> = { high: 3, medium: 2, low: 1 };
    const impactDiff = impactScore[b.impact] - impactScore[a.impact];
    if (impactDiff !== 0) return impactDiff;

    // Then by date proximity
    const aDiff = Math.abs(new Date(a.date).getTime() - targetTime);
    const bDiff = Math.abs(new Date(b.date).getTime() - targetTime);
    return aDiff - bDiff;
  });

  return events[0];
}

/**
 * Get event context string for display
 */
export function getEventContext(event: TechEvent): string {
  const categoryLabels: Record<string, string> = {
    'product-launch': 'Product Launch',
    'announcement': 'Announcement',
    'update': 'Software Update',
    'news': 'Major Event',
    'conference': 'Tech Conference',
  };

  return `${event.title} (${categoryLabels[event.category]})`;
}
