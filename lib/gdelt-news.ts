/**
 * GDELT News API Integration
 * The GDELT Project monitors news media worldwide in 100+ languages
 * Completely free and comprehensive
 * API Docs: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
 */

export type GDELTArticle = {
  title: string;
  url: string;
  domain: string;
  seendate: string; // Format: YYYYMMDDHHMMSS
  socialimage?: string;
  language: string;
  sourcecountry: string;
};

export type GDELTNewsResult = {
  title: string;
  description: string;
  url: string;
  date: Date;
  source: string; // Domain name
  language: string;
  country: string;
};

/**
 * Fetch news articles from GDELT for a specific keyword and date range
 */
export async function fetchGDELTNews(
  keyword: string,
  targetDate: Date,
  windowDays: number = 7
): Promise<GDELTNewsResult[]> {
  // Calculate date range
  const startDate = new Date(targetDate);
  startDate.setDate(startDate.getDate() - windowDays);

  const endDate = new Date(targetDate);
  endDate.setDate(endDate.getDate() + windowDays);

  // Format dates for GDELT API (YYYYMMDDHHMMSS)
  const formatGDELTDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}000000`;
  };

  const startDateTime = formatGDELTDate(startDate);
  const endDateTime = formatGDELTDate(endDate);

  // Build GDELT API URL
  const queryKeyword = encodeURIComponent(keyword.replace(/-/g, ' '));
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${queryKeyword}&mode=artlist&maxrecords=50&format=json&startdatetime=${startDateTime}&enddatetime=${endDateTime}&sort=datedesc`;

  console.log(`[GDELT] Fetching news for "${keyword}" around ${targetDate.toISOString().split('T')[0]}...`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TrendCompare/1.0',
      },
    });

    if (!response.ok) {
      console.error(`[GDELT] API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const articles: GDELTNewsResult[] = [];

    if (data.articles && Array.isArray(data.articles)) {
      for (const article of data.articles) {
        // Parse GDELT date format (YYYYMMDDHHMMSS)
        const dateStr = article.seendate || '';
        let articleDate: Date;

        if (dateStr.length >= 8) {
          const year = parseInt(dateStr.substring(0, 4));
          const month = parseInt(dateStr.substring(4, 6)) - 1;
          const day = parseInt(dateStr.substring(6, 8));
          articleDate = new Date(year, month, day);
        } else {
          articleDate = new Date();
        }

        // Extract domain name for source
        let source = article.domain || 'Unknown';
        try {
          const domain = new URL(article.url).hostname.replace('www.', '');
          source = domain.split('.')[0];
          source = source.charAt(0).toUpperCase() + source.slice(1);
        } catch {
          // Keep original domain
        }

        articles.push({
          title: article.title || 'Untitled Article',
          description: article.title || '', // GDELT doesn't provide descriptions in artlist mode
          url: article.url,
          date: articleDate,
          source,
          language: article.language || 'en',
          country: article.sourcecountry || 'Unknown',
        });
      }
    }

    console.log(`[GDELT] Found ${articles.length} articles for "${keyword}"`);
    return articles;

  } catch (error) {
    console.error('[GDELT] Error fetching news:', error);
    return [];
  }
}

/**
 * Filter GDELT articles to only those close to the target date
 */
export function filterGDELTByDateProximity(
  articles: GDELTNewsResult[],
  targetDate: Date,
  maxDaysDiff: number = 3
): GDELTNewsResult[] {
  return articles.filter(article => {
    const daysDiff = Math.abs(
      (article.date.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff <= maxDaysDiff;
  });
}

/**
 * Get article count by date (for trend validation)
 */
export function getArticleCountByDate(articles: GDELTNewsResult[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const article of articles) {
    const dateKey = article.date.toISOString().split('T')[0];
    counts.set(dateKey, (counts.get(dateKey) || 0) + 1);
  }

  return counts;
}
