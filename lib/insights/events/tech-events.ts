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

  // AI & ChatGPT Events
  {
    date: '2024-02-15',
    title: 'OpenAI Sora Launch',
    description: 'OpenAI announces Sora, text-to-video AI model',
    keywords: ['openai', 'chatgpt', 'ai', 'sora', 'video'],
    category: 'product-launch',
    company: 'OpenAI',
    impact: 'high',
  },
  {
    date: '2024-05-13',
    title: 'GPT-4o Launch',
    description: 'OpenAI releases GPT-4o with improved speed and capabilities',
    keywords: ['openai', 'chatgpt', 'gpt-4', 'ai'],
    category: 'product-launch',
    company: 'OpenAI',
    impact: 'high',
  },
  {
    date: '2024-12-05',
    title: 'ChatGPT Pro Launch',
    description: 'OpenAI announces ChatGPT Pro subscription tier',
    keywords: ['openai', 'chatgpt', 'ai', 'gpt'],
    category: 'announcement',
    company: 'OpenAI',
    impact: 'high',
  },
  {
    date: '2024-12-06',
    title: 'Google Gemini 2.0 Launch',
    description: 'Google announces Gemini 2.0 AI model',
    keywords: ['google', 'gemini', 'ai', 'bard'],
    category: 'product-launch',
    company: 'Google',
    impact: 'high',
  },
  {
    date: '2024-03-19',
    title: 'Claude 3 Launch',
    description: 'Anthropic releases Claude 3 family of AI models',
    keywords: ['claude', 'anthropic', 'ai'],
    category: 'product-launch',
    company: 'Anthropic',
    impact: 'medium',
  },

  // Entertainment & Streaming
  {
    date: '2024-12-22',
    title: 'Yo Yo Honey Singh Netflix Documentary Release',
    description: 'Netflix releases documentary on Yo Yo Honey Singh',
    keywords: ['honey-singh', 'yo-yo-honey-singh', 'documentary', 'honey singh'],
    category: 'news',
    company: 'Netflix',
    impact: 'medium', // Changed from high - it's specific content, not platform-wide
  },
  {
    date: '2024-11-15',
    title: 'Netflix Mike Tyson vs Jake Paul Fight',
    description: 'Netflix livestreams Jake Paul vs Mike Tyson boxing match',
    keywords: ['jake-paul', 'mike-tyson', 'boxing', 'fight', 'tyson'],
    category: 'news',
    company: 'Netflix',
    impact: 'medium', // Specific event, not platform-wide
  },
  {
    date: '2024-07-18',
    title: 'Deadpool & Wolverine Release',
    description: 'Marvel releases Deadpool & Wolverine in theaters',
    keywords: ['deadpool', 'marvel', 'wolverine', 'movie'],
    category: 'news',
    company: 'Marvel',
    impact: 'high',
  },
  {
    date: '2024-06-14',
    title: 'Inside Out 2 Release',
    description: 'Pixar releases Inside Out 2',
    keywords: ['inside-out', 'pixar', 'disney', 'movie'],
    category: 'news',
    company: 'Disney',
    impact: 'high',
  },

  // Tesla & Electric Vehicles
  {
    date: '2024-10-10',
    title: 'Tesla Robotaxi Unveil',
    description: 'Tesla unveils Cybercab robotaxi and Robovan',
    keywords: ['tesla', 'elon-musk', 'robotaxi', 'cybercab'],
    category: 'product-launch',
    company: 'Tesla',
    impact: 'high',
  },
  {
    date: '2024-11-30',
    title: 'Tesla Cybertruck Deliveries Ramp Up',
    description: 'Tesla increases Cybertruck production and deliveries',
    keywords: ['tesla', 'cybertruck', 'elon-musk'],
    category: 'news',
    company: 'Tesla',
    impact: 'medium',
  },

  // Crypto & Finance
  {
    date: '2024-03-14',
    title: 'Bitcoin All-Time High',
    description: 'Bitcoin reaches new all-time high above $73,000',
    keywords: ['bitcoin', 'btc', 'crypto', 'cryptocurrency'],
    category: 'news',
    company: 'Crypto',
    impact: 'high',
  },
  {
    date: '2024-01-11',
    title: 'Bitcoin ETF Approval',
    description: 'SEC approves spot Bitcoin ETFs',
    keywords: ['bitcoin', 'btc', 'crypto', 'etf'],
    category: 'news',
    company: 'Crypto',
    impact: 'high',
  },
  {
    date: '2024-04-20',
    title: 'Bitcoin Halving',
    description: 'Bitcoin undergoes scheduled halving event',
    keywords: ['bitcoin', 'btc', 'crypto', 'halving'],
    category: 'news',
    company: 'Crypto',
    impact: 'high',
  },
  {
    date: '2024-05-23',
    title: 'Ethereum ETF Approval',
    description: 'SEC approves spot Ethereum ETFs',
    keywords: ['ethereum', 'eth', 'crypto', 'etf'],
    category: 'news',
    company: 'Crypto',
    impact: 'high',
  },

  // Gaming & Consoles
  {
    date: '2024-09-24',
    title: 'PlayStation 5 Pro Launch',
    description: 'Sony announces PlayStation 5 Pro with enhanced graphics',
    keywords: ['playstation', 'ps5', 'sony', 'gaming', 'ps5-pro'],
    category: 'product-launch',
    company: 'Sony',
    impact: 'high',
  },
  {
    date: '2024-06-09',
    title: 'Xbox Showcase 2024',
    description: 'Microsoft Xbox reveals new games and updates',
    keywords: ['xbox', 'microsoft', 'gaming'],
    category: 'conference',
    company: 'Microsoft',
    impact: 'medium',
  },

  // Music & Artists
  {
    date: '2024-04-19',
    title: 'Taylor Swift Album Release',
    description: 'Taylor Swift releases The Tortured Poets Department',
    keywords: ['taylor-swift', 'music', 'album'],
    category: 'news',
    company: 'Music',
    impact: 'high',
  },
  {
    date: '2024-02-04',
    title: 'Super Bowl 2024',
    description: 'Super Bowl LVIII with Kansas City Chiefs vs San Francisco 49ers',
    keywords: ['superbowl', 'super-bowl', 'nfl', 'football'],
    category: 'news',
    company: 'Sports',
    impact: 'high',
  },
  {
    date: '2024-02-11',
    title: 'Grammy Awards 2024',
    description: '66th Annual Grammy Awards ceremony',
    keywords: ['grammy', 'grammys', 'music', 'awards'],
    category: 'news',
    company: 'Music',
    impact: 'high',
  },

  // Social Media & Apps
  {
    date: '2024-03-01',
    title: 'Instagram Threads Desktop Launch',
    description: 'Meta launches Threads desktop app',
    keywords: ['threads', 'meta', 'instagram', 'twitter'],
    category: 'product-launch',
    company: 'Meta',
    impact: 'medium',
  },
  {
    date: '2024-01-31',
    title: 'TikTok Ban Legislation',
    description: 'US Congress advances legislation to ban TikTok',
    keywords: ['tiktok', 'ban', 'congress', 'bytedance'],
    category: 'news',
    company: 'TikTok',
    impact: 'high',
  },

  // Other Tech Products
  {
    date: '2024-03-21',
    title: 'Meta Quest 3 Price Drop',
    description: 'Meta reduces Quest 3 VR headset price',
    keywords: ['meta', 'quest', 'vr', 'oculus'],
    category: 'announcement',
    company: 'Meta',
    impact: 'medium',
  },
  {
    date: '2024-02-02',
    title: 'Vision Pro Launch',
    description: 'Apple Vision Pro spatial computer goes on sale',
    keywords: ['apple', 'vision-pro', 'vr', 'ar'],
    category: 'product-launch',
    company: 'Apple',
    impact: 'high',
  },

  // Cloud & Infrastructure Events (platform-level)
  {
    date: '2024-06-13',
    title: 'AWS Global Outage',
    description: 'Amazon Web Services experiences widespread service disruption affecting multiple regions',
    keywords: ['aws', 'amazon-web-services', 'outage', 'down', 'amazon'],
    category: 'news',
    company: 'Amazon',
    impact: 'high',
  },
  {
    date: '2024-03-08',
    title: 'Azure Service Disruption',
    description: 'Microsoft Azure cloud services experience outage affecting enterprise customers',
    keywords: ['azure', 'microsoft', 'cloud', 'outage', 'down'],
    category: 'news',
    company: 'Microsoft',
    impact: 'high',
  },

  // Streaming Platform Events (platform-level)
  {
    date: '2024-11-01',
    title: 'Netflix Password Sharing Crackdown Expansion',
    description: 'Netflix expands password sharing restrictions to more countries',
    keywords: ['netflix', 'password-sharing', 'subscription'],
    category: 'announcement',
    company: 'Netflix',
    impact: 'high',
  },
  {
    date: '2024-12-08',
    title: 'Disney+ Price Increase Announced',
    description: 'Disney announces subscription price increases across all tiers',
    keywords: ['disney', 'disney+', 'disney-plus', 'price', 'subscription'],
    category: 'announcement',
    company: 'Disney',
    impact: 'high',
  },
];

// 2023 Events - Major movie releases and entertainment
export const TECH_EVENTS_2023: TechEvent[] = [
  // Barbenheimer - July 2023
  {
    date: '2023-07-21',
    title: 'Barbie Movie Theatrical Release',
    description: 'Greta Gerwig\'s Barbie starring Margot Robbie releases in theaters, becoming highest-grossing film of 2023',
    keywords: ['barbie', 'margot-robbie', 'movie', 'greta-gerwig'],
    category: 'news',
    company: 'Warner Bros',
    impact: 'high',
  },
  {
    date: '2023-07-21',
    title: 'Oppenheimer Theatrical Release',
    description: 'Christopher Nolan\'s Oppenheimer starring Cillian Murphy releases in theaters',
    keywords: ['oppenheimer', 'christopher-nolan', 'cillian-murphy', 'movie'],
    category: 'news',
    company: 'Universal Pictures',
    impact: 'high',
  },
  {
    date: '2023-03-10',
    title: 'Oscars 2023 - Everything Everywhere All at Once Wins',
    description: '95th Academy Awards with Everything Everywhere All at Once winning Best Picture',
    keywords: ['oscars', 'academy-awards', 'movie', 'everything-everywhere'],
    category: 'news',
    company: 'Entertainment',
    impact: 'high',
  },
  {
    date: '2023-07-12',
    title: 'Threads App Launch',
    description: 'Meta launches Threads as Twitter competitor',
    keywords: ['threads', 'meta', 'instagram', 'twitter'],
    category: 'product-launch',
    company: 'Meta',
    impact: 'high',
  },
  {
    date: '2023-11-06',
    title: 'ChatGPT Anniversary & GPT-4 Turbo Launch',
    description: 'OpenAI DevDay with GPT-4 Turbo announcement',
    keywords: ['chatgpt', 'openai', 'gpt-4', 'ai'],
    category: 'product-launch',
    company: 'OpenAI',
    impact: 'high',
  },
  {
    date: '2023-05-03',
    title: 'The Super Mario Bros. Movie Success',
    description: 'Super Mario Bros. Movie becomes highest-grossing video game adaptation',
    keywords: ['mario', 'nintendo', 'movie', 'super-mario'],
    category: 'news',
    company: 'Nintendo',
    impact: 'high',
  },
  {
    date: '2023-12-13',
    title: 'Google Gemini Launch',
    description: 'Google launches Gemini AI model family',
    keywords: ['gemini', 'google', 'ai', 'bard'],
    category: 'product-launch',
    company: 'Google',
    impact: 'high',
  },
  {
    date: '2023-11-22',
    title: 'The Lion King Mufasa Trailer Release',
    description: 'Disney releases first trailer for Mufasa: The Lion King prequel',
    keywords: ['lion-king', 'mufasa', 'disney', 'movie'],
    category: 'news',
    company: 'Disney',
    impact: 'medium',
  },
  {
    date: '2023-09-12',
    title: 'Apple iPhone 15 Launch',
    description: 'Apple announces iPhone 15 with USB-C and Dynamic Island',
    keywords: ['iphone', 'apple', 'iphone 15'],
    category: 'product-launch',
    company: 'Apple',
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

  const allEvents = [...TECH_EVENTS_2023, ...TECH_EVENTS_2024, ...TECH_EVENTS_2025];

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
