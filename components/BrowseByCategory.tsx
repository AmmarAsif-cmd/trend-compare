"use client";

import { useState } from "react";
import Link from "next/link";
import type { CategoryInfo } from "@/lib/categoryComparisons";

type Props = {
  categories: CategoryInfo[];
  hybridData: Record<string, Array<{ slug: string; title: string; trending?: boolean }>>;
};

export default function BrowseByCategory({ categories, hybridData }: Props) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || "movies");

  const activeCategoryData = categories.find((c) => c.id === activeCategory);
  const comparisons = hybridData[activeCategory] || [];

  return (
    <section>
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-slate-900">
          Browse by Category
        </h2>
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto">
          Explore trending comparisons across different categories
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`
              px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base
              transition-all duration-200 border-2
              ${
                activeCategory === category.id
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white border-transparent shadow-lg scale-105"
                  : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:shadow-md"
              }
            `}
          >
            <span className="mr-2">{category.emoji}</span>
            {category.name}
          </button>
        ))}
      </div>

      {/* Active Category Content */}
      {activeCategoryData && (
        <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">{activeCategoryData.emoji}</span>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                {activeCategoryData.name}
              </h3>
              <p className="text-slate-600 text-sm">{activeCategoryData.description}</p>
            </div>
          </div>

          {/* Comparisons Grid - Show more comparisons */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {comparisons.map((comparison, idx) => (
              <Link
                key={comparison.slug}
                href={`/compare/${comparison.slug}`}
                className="group relative bg-gradient-to-br from-slate-50 to-white rounded-xl border-2 border-slate-200 p-5 hover:border-blue-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Trending Badge */}
                {comparison.trending && (
                  <div className="absolute top-2 right-2 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Trending
                  </div>
                )}

                {/* Rank Badge */}
                <div className="absolute top-2 left-2 w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md">
                  {idx + 1}
                </div>

                <div className="pt-6">
                  <div className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                    {comparison.title}
                  </div>
                  <div className="flex items-center text-blue-600 text-sm font-medium">
                    View comparison
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* View All Link */}
          <div className="mt-6 text-center">
            <p className="text-slate-500 text-sm">
              Want to see more?{" "}
              <span className="text-blue-600 font-semibold cursor-pointer hover:underline">
                Explore all {activeCategoryData.name.toLowerCase()} comparisons
              </span>
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
