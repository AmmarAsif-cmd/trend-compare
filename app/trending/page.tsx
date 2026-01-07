import type { Metadata } from "next";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import TrendingProductsClient from "@/components/trending/TrendingProductsClient";

export const metadata: Metadata = {
  title: "Trending Products | TrendArc - Amazon Product Research",
  description: "Discover trending products on Amazon powered by real Google Trends data. Pre-analyzed opportunities updated daily across all major categories.",
  keywords: "trending products, amazon trends, hot products, product opportunities, google trends, product research",
};

export default function TrendingProductsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <header className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
          <TrendingUp className="w-4 h-4" />
          Updated Daily • Real Google Trends Data
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
          🔥 Trending Products This Week
        </h1>
        <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Discover pre-analyzed product opportunities with AI-powered insights.
          All data sourced from real Google Trends with growth rates, search volumes, and competition analysis.
        </p>
      </header>

      {/* Trending Products (Client Component) */}
      <TrendingProductsClient />

      {/* CTA */}
      <div className="mt-12 text-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 sm:p-8 lg:p-12 border border-blue-200">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
          Search for Any Product
        </h2>
        <p className="text-base sm:text-lg text-slate-600 mb-6 px-4">
          Not seeing what you're looking for? Search our database of millions of products.
        </p>
        <Link
          href="/"
          className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg text-base sm:text-lg"
        >
          Search Products →
        </Link>
      </div>

      {/* Data Sources */}
      <div className="mt-12 bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-200">
        <h3 className="text-xl font-bold text-slate-900 mb-4 text-center">
          📊 Our Data Sources
        </h3>
        <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-3xl mb-2">📈</div>
            <div className="font-semibold text-slate-900 mb-1">Google Trends</div>
            <div className="text-sm text-slate-600">Real search interest data over 12 months</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🤖</div>
            <div className="font-semibold text-slate-900 mb-1">AI Analysis</div>
            <div className="text-sm text-slate-600">Claude AI processes trend patterns</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">💰</div>
            <div className="font-semibold text-slate-900 mb-1">Market Insights</div>
            <div className="text-sm text-slate-600">Competition & pricing estimates</div>
          </div>
        </div>
        <p className="text-xs text-slate-500 text-center mt-6">
          Data is refreshed every 24 hours. Click the refresh button to get the latest trends.
        </p>
      </div>
    </main>
  );
}
