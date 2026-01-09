"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { validateProductName, productNameToSlug } from "@/lib/utils/product-validation";

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

    // Validate input
    const validation = validateProductName(term);
    if (!validation.valid) {
      // Show error to user (could add toast notification here)
      console.error('Invalid product name:', validation.error);
      return;
    }

    setIsLoading(true);

    // Convert to URL-friendly slug using validation utility
    const slug = productNameToSlug(term);

    if (!slug) {
      setIsLoading(false);
      return;
    }

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
          <div className="inline-block mb-8 sm:mb-10">
            <span className="bg-emerald-100 text-emerald-800 px-6 py-2 rounded-full text-sm font-bold border border-emerald-200 shadow-sm relative overflow-hidden group hover:scale-105 transition-transform cursor-default">
              <span className="relative z-10">✨ Stop Guessing. Start Printing.</span>
              <div className="absolute inset-0 bg-white/40 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12"></div>
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-slate-900 mb-8 sm:mb-10 leading-[0.9] tracking-tighter px-2">
            <span className="block mb-2">Don't Be Boring.</span>
            <span className="block bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent transform -rotate-1 origin-left inline-block">
              Sell Winners.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed font-medium px-4">
            Most product research tools cost $99/mo and look like a spreadsheet from 2005.
            <br className="hidden sm:block" />
            <span className="text-slate-900 font-bold">TrendArc is $6.99/mo.</span> It's faster. It's prettier. And it actually works.
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto px-4 mt-12 text-left">
            {[
              { label: "Real Data", desc: "No guesstimates." },
              { label: "AI Verdicts", desc: "Instant Go/No-Go." },
              { label: "Viral Alerts", desc: "Spot trends early." },
              { label: "$6.99/mo", desc: "Cancel anytime." },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white/60 backdrop-blur-md px-5 py-4 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{item.label}</div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{item.desc}</div>
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
