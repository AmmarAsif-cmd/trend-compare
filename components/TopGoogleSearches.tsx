import { TrendingUp } from "lucide-react";
import { getRealTimeTrending, getCacheStatus } from "@/lib/real-time-trending";
import { getKeywordCategory } from "@/lib/keyword-categories";
import TrendingCountdown from "./TrendingCountdown";

export default async function TopGoogleSearches() {
  // Fetch real-time trending data from Google Trends
  // This uses a 12-hour cache, so it updates twice daily
  const trendingItems = await getRealTimeTrending('US', 8);
  const cacheStatus = getCacheStatus();

  // Map trending items to display format
  const topSearches = trendingItems.map((item) => ({
    term: item.keyword,
    category: getCategoryDisplay(getKeywordCategory(item.keyword)),
    trend: item.formattedTraffic,
    imageUrl: item.imageUrl,
    newsUrl: item.newsUrl,
  }));

  return (
    <section className="bg-gradient-to-b from-white to-slate-50 py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            <span className="block text-slate-900">Hot Topics on</span>
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Google Right Now
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-slate-600">
            Real-time trending searches from Google Trends
          </p>

          {/* Countdown timer */}
          {cacheStatus.isCached && cacheStatus.expiresIn > 0 && (
            <TrendingCountdown expiresIn={cacheStatus.expiresIn} />
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {topSearches.map((item, idx) => (
            <div
              key={idx}
              className="group bg-white border-2 border-slate-200 hover:border-purple-500 rounded-2xl p-5 sm:p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden"
            >
              {/* Background image if available */}
              {item.imageUrl && (
                <div
                  className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity bg-cover bg-center"
                  style={{ backgroundImage: `url(${item.imageUrl})` }}
                />
              )}

              {/* Trending indicator */}
              <div className="absolute top-3 right-3 z-10">
                <TrendingUp className="w-5 h-5 text-purple-500 group-hover:animate-bounce" />
              </div>

              {/* Rank badge */}
              <div className="absolute top-3 left-3 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg z-10">
                {idx + 1}
              </div>

              <div className="mt-8 relative z-10">
                <h3 className="text-lg sm:text-xl font-bold mb-2 text-slate-900 group-hover:text-purple-600 transition-colors line-clamp-2 min-h-[3.5rem]">
                  {item.term}
                </h3>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                    {item.category}
                  </span>
                  <span className="text-sm font-bold text-blue-600">
                    {item.trend}
                  </span>
                </div>

                {/* Optional: News link if available */}
                {item.newsUrl && (
                  <a
                    href={item.newsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-purple-600 hover:underline mt-2 block"
                  >
                    Read news →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Data source attribution */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-sm text-slate-600 font-medium">
            📊 Data Source: <span className="text-purple-600">Google Trends API</span>
          </p>
          <p className="text-xs text-slate-500">
            Trusted, real-time search data from Google. Updated automatically.
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * Convert category to display-friendly name
 */
function getCategoryDisplay(category: string): string {
  const categoryMap: Record<string, string> = {
    'technology': 'Technology',
    'entertainment': 'Entertainment',
    'sports': 'Sports',
    'business': 'Business',
    'politics': 'Politics',
    'lifestyle': 'Lifestyle',
    'health': 'Health',
    'education': 'Education',
    'gaming': 'Gaming',
    'automotive': 'Automotive',
    'finance': 'Finance',
    'science': 'Science',
    'general': 'General',
  };

  return categoryMap[category] || 'General';
}
