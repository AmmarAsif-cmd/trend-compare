"use client";

import { TrendingUp } from "lucide-react";

const topSearches = [
  { term: "ChatGPT", category: "AI & Tech", trend: "+245%" },
  { term: "Taylor Swift", category: "Entertainment", trend: "+89%" },
  { term: "iPhone 15", category: "Technology", trend: "+156%" },
  { term: "Barbie Movie", category: "Entertainment", trend: "+892%" },
  { term: "Threads", category: "Social Media", trend: "+1240%" },
  { term: "AI", category: "Technology", trend: "+178%" },
  { term: "Oppenheimer", category: "Movies", trend: "+654%" },
  { term: "Wordle", category: "Games", trend: "+23%" },
];

export default function TopGoogleSearches() {
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
            What people are searching for globally
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {topSearches.map((item, idx) => (
            <div
              key={idx}
              className="group bg-white border-2 border-slate-200 hover:border-purple-500 rounded-2xl p-5 sm:p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden"
            >
              {/* Trending indicator */}
              <div className="absolute top-3 right-3">
                <TrendingUp className="w-5 h-5 text-purple-500 group-hover:animate-bounce" />
              </div>

              {/* Rank badge */}
              <div className="absolute top-3 left-3 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                {idx + 1}
              </div>

              <div className="mt-8">
                <h3 className="text-lg sm:text-xl font-bold mb-2 text-slate-900 group-hover:text-purple-600 transition-colors">
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
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-slate-500 mt-8">
          💡 Data based on trending Google searches. Updated regularly to show current interests.
        </p>
      </div>
    </section>
  );
}
