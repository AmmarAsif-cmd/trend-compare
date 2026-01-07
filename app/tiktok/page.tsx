/**
 * TikTok Explorer Page
 * Browse TikTok comparisons and create new ones
 */

import TikTokCompareForm from "@/components/tiktok/TikTokCompareForm";
import TikTokFeed from "@/components/tiktok/TikTokFeed";

export const metadata = {
  title: "TikTok Creator Comparisons | TrendArc",
  description: "Compare TikTok creators, view follower counts, engagement rates, and more. Discover trending TikTok comparisons.",
};

export default function TikTokExplorerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      {/* Hero Section with Form */}
      <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              TikTok Creator Comparisons
            </h1>
            <p className="text-xl text-purple-100 max-w-2xl mx-auto">
              Compare TikTok creators, see who's trending, and discover insights about your favorite creators
            </p>
          </div>

          {/* Comparison Form */}
          <div className="max-w-3xl mx-auto">
            <TikTokCompareForm />
          </div>
        </div>
      </div>

      {/* Feed Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <TikTokFeed />
      </div>
    </div>
  );
}

