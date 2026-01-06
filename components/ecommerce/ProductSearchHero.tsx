"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const EXAMPLE_SEARCHES = [
  "Yoga Mat",
  "Phone Case",
  "Kitchen Tools",
  "Resistance Bands",
  "Wireless Earbuds",
  "Water Bottle",
];

export default function ProductSearchHero() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async (searchTerm?: string) => {
    const term = searchTerm || query;
    if (!term.trim()) return;

    setIsLoading(true);

    // Convert to URL-friendly slug
    const slug = term.toLowerCase().replace(/\s+/g, "-");

    // Navigate to product analysis page
    router.push(`/product/${slug}`);
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
    handleSearch(example);
  };

  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50/30 py-20 sm:py-24 lg:py-32 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-block mb-6 sm:mb-8">
            <span className="bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 px-5 py-2.5 rounded-full text-sm font-semibold border border-blue-200 shadow-sm">
              🎯 100% Free Forever • No Credit Card • Instant Results
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-slate-900 mb-6 sm:mb-8 leading-tight px-4">
            <span className="block">Find Profitable Products</span>
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              in 30 Seconds
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl lg:text-2xl text-slate-600 mb-10 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
            Free Amazon product research tool powered by AI. Analyze trends, price history, and competition
            to find your next winning product.
          </p>

          {/* Search Form */}
          <div className="max-w-3xl mx-auto mb-8 sm:mb-10 px-4">
            <div className="relative bg-white/90 backdrop-blur-sm p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/50 hover:shadow-3xl transition-all duration-300">
              <div className="flex gap-2 sm:gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearch();
                      }
                    }}
                    placeholder="Search any Amazon product... (e.g., resistance bands)"
                    className="w-full px-5 sm:px-6 py-4 sm:py-5 text-base sm:text-lg rounded-xl sm:rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                    disabled={isLoading}
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
                <button
                  onClick={() => handleSearch()}
                  disabled={!query.trim() || isLoading}
                  className="px-6 sm:px-8 py-4 sm:py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl sm:rounded-2xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl text-base sm:text-lg whitespace-nowrap"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Analyzing...
                    </span>
                  ) : (
                    "Analyze"
                  )}
                </button>
              </div>
            </div>

            {/* Example searches */}
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              <span className="text-sm text-slate-600 mr-2">Try these:</span>
              {EXAMPLE_SEARCHES.map((example) => (
                <button
                  key={example}
                  onClick={() => handleExampleClick(example)}
                  className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  disabled={isLoading}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto px-4">
            {[
              { icon: "✓", text: "100% Free Forever" },
              { icon: "🤖", text: "AI-Powered Analysis" },
              { icon: "🚫", text: "No Credit Card" },
              { icon: "⚡", text: "30-Second Results" },
            ].map((item) => (
              <div
                key={item.text}
                className="bg-white/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-200 shadow-sm"
              >
                <div className="text-2xl mb-1">{item.icon}</div>
                <div className="text-sm font-medium text-slate-700">{item.text}</div>
              </div>
            ))}
          </div>

          {/* Social Proof */}
          <div className="mt-10 sm:mt-12">
            <p className="text-sm text-slate-500">
              Trusted by <span className="font-semibold text-slate-700">9,000+</span> Amazon sellers and e-commerce entrepreneurs
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
