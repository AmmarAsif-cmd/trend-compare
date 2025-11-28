/**
 * News Event Detection
 * Fetches real news events that explain search spikes
 * Uses multiple data sources for comprehensive coverage
 */

import type { TechEvent } from './tech-events';

interface NewsArticle {
  title: string;
  description: string;
  publishedAt: string;
  source: string;
  url: string;
  relevance: number;
}

/**
 * Fetch news articles for a specific date and keywords
 * This would integrate with NewsAPI, GDELT, or other news sources
 */
export async function fetchNewsForDate(
  date: string | Date,
  keywords: string[],
  windowDays: number = 3
): Promise<NewsArticle[]> {
  // TODO: Integrate with real news APIs
  // For now, return empty - will be populated when we add API keys

  /* Example NewsAPI integration:
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];

  const targetDate = new Date(date);
  const fromDate = new Date(targetDate);
  fromDate.setDate(fromDate.getDate() - windowDays);
  const toDate = new Date(targetDate);
  toDate.setDate(toDate.getDate() + windowDays);

  const query = keywords.join(' OR ');
  const url = `https://newsapi.org/v2/everything?` +
    `q=${encodeURIComponent(query)}&` +
    `from=${fromDate.toISOString().split('T')[0]}&` +
    `to=${toDate.toISOString().split('T')[0]}&` +
    `sortBy=relevancy&` +
    `language=en&` +
    `apiKey=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'ok' && data.articles) {
      return data.articles.map((article: any) => ({
        title: article.title,
        description: article.description,
        publishedAt: article.publishedAt,
        source: article.source.name,
        url: article.url,
        relevance: calculateRelevance(article, keywords),
      })).sort((a, b) => b.relevance - a.relevance);
    }
  } catch (error) {
    console.error('News API error:', error);
  }
  */

  return [];
}

/**
 * Convert news article to TechEvent format
 */
export function newsToEvent(article: NewsArticle, keywords: string[]): TechEvent {
  // Detect category from title/description
  const text = `${article.title} ${article.description}`.toLowerCase();

  let category: TechEvent['category'] = 'news';
  let impact: TechEvent['impact'] = 'medium';

  if (text.includes('launch') || text.includes('announces') || text.includes('unveils')) {
    category = 'product-launch';
    impact = 'high';
  } else if (text.includes('update') || text.includes('release')) {
    category = 'update';
  } else if (text.includes('conference') || text.includes('keynote')) {
    category = 'conference';
    impact = 'high';
  }

  // Extract company
  let company = 'Unknown';
  if (text.includes('apple')) company = 'Apple';
  else if (text.includes('google')) company = 'Google';
  else if (text.includes('samsung')) company = 'Samsung';
  else if (text.includes('microsoft')) company = 'Microsoft';
  else company = article.source;

  return {
    date: new Date(article.publishedAt).toISOString().split('T')[0],
    title: article.title,
    description: article.description,
    keywords: keywords,
    category,
    company,
    impact,
  };
}

/**
 * Calculate relevance score for news article
 */
function calculateRelevance(article: any, keywords: string[]): number {
  const text = `${article.title} ${article.description}`.toLowerCase();
  let score = 0;

  keywords.forEach(keyword => {
    const kw = keyword.toLowerCase();
    // Title match = higher score
    if (article.title.toLowerCase().includes(kw)) score += 3;
    // Description match
    if (article.description?.toLowerCase().includes(kw)) score += 1;
  });

  return score;
}

/**
 * Fetch Wikipedia current events for a date
 * Wikipedia has daily event summaries that can provide context
 */
export async function fetchWikipediaEvents(
  date: string | Date
): Promise<string[]> {
  // TODO: Implement Wikipedia API integration
  // Wikipedia has "Current events" pages with structured data
  // Example: https://en.wikipedia.org/wiki/Portal:Current_events/September_2024

  return [];
}

/**
 * Smart event detection combining multiple sources
 */
export async function detectRealEvents(
  date: string | Date,
  keywords: string[]
): Promise<TechEvent[]> {
  const events: TechEvent[] = [];

  // Fetch from news APIs (when implemented)
  const newsArticles = await fetchNewsForDate(date, keywords, 3);

  // Convert top news to events
  const topNews = newsArticles.slice(0, 3);
  topNews.forEach(article => {
    events.push(newsToEvent(article, keywords));
  });

  return events;
}
