import type { Metadata } from "next";
import Link from "next/link";
import { TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "Trending Products | TrendArc - Amazon Product Research",
  description: "Discover trending products on Amazon. Pre-analyzed opportunities updated daily.",
  keywords: "trending products, amazon trends, hot products, product opportunities",
};

// Sample trending products (in production, this would come from a database)
const SAMPLE_TRENDING_PRODUCTS = [
  {
    name: "Resistance Bands",
    slug: "resistance-bands",
    trend: "+380%",
    competition: "low",
    category: "Sports & Fitness",
  },
  {
    name: "Air Fryer",
    slug: "air-fryer",
    trend: "+245%",
    competition: "high",
    category: "Kitchen",
  },
  {
    name: "Yoga Mat",
    slug: "yoga-mat",
    trend: "+156%",
    competition: "medium",
    category: "Sports & Fitness",
  },
  {
    name: "Standing Desk Converter",
    slug: "standing-desk-converter",
    trend: "+198%",
    competition: "medium",
    category: "Office",
  },
  {
    name: "Water Bottle",
    slug: "water-bottle",
    trend: "+142%",
    competition: "high",
    category: "Sports & Fitness",
  },
  {
    name: "Phone Case",
    slug: "phone-case",
    trend: "+89%",
    competition: "high",
    category: "Electronics",
  },
];

export default function TrendingProductsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <header className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
          <TrendingUp className="w-4 h-4" />
          Updated Daily
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
          🔥 Trending Products This Week
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Discover pre-analyzed product opportunities with AI-powered insights
        </p>
      </header>

      {/* Products Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {SAMPLE_TRENDING_PRODUCTS.map((product, index) => {
          const competitionColors = {
            low: "text-green-600 bg-green-100 border-green-300",
            medium: "text-yellow-600 bg-yellow-100 border-yellow-300",
            high: "text-red-600 bg-red-100 border-red-300",
          };

          return (
            <Link
              key={product.slug}
              href={`/product/${product.slug}`}
              className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:border-blue-300 transition-all"
            >
              {/* Rank Badge */}
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl font-bold text-slate-200 group-hover:text-blue-200 transition-colors">
                  #{index + 1}
                </div>
                <div className="text-2xl">
                  {product.competition === "low" ? "🟢" : product.competition === "high" ? "🔴" : "🟡"}
                </div>
              </div>

              {/* Product Name */}
              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                {product.name}
              </h3>

              {/* Category */}
              <div className="text-sm text-slate-500 mb-4">{product.category}</div>

              {/* Metrics */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Growth</span>
                  <span className="text-lg font-bold text-green-600">{product.trend} 🚀</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Competition</span>
                  <span
                    className={`text-sm font-semibold px-3 py-1 rounded-full border ${competitionColors[product.competition as keyof typeof competitionColors]}`}
                  >
                    {product.competition.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="text-blue-600 font-medium group-hover:text-blue-700 flex items-center justify-between">
                  View Analysis
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* CTA */}
      <div className="text-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-12 border border-blue-200">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">
          Search for Any Product
        </h2>
        <p className="text-lg text-slate-600 mb-6">
          Not seeing what you're looking for? Search our database of millions of products.
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg text-lg"
        >
          Search Products →
        </Link>
      </div>
    </main>
  );
}
