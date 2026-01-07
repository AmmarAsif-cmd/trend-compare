"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, Loader2, RefreshCw } from "lucide-react";
import { PRODUCT_CATEGORIES } from "@/lib/trending-products/categories";
import type { TrendingProduct } from "@/lib/trending-products/types";

interface Props {
  initialCategory?: string;
}

export default function TrendingProductsClient({ initialCategory = 'all' }: Props) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [products, setProducts] = useState<TrendingProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Fetch trending products
  const fetchProducts = async (category: string, refresh = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/trending?category=${category}&limit=30`);

      if (!response.ok) {
        throw new Error('Failed to fetch trending products');
      }

      const data = await response.json();
      setProducts(data.products || []);
      setLastUpdated(data.lastUpdated || new Date().toISOString());
    } catch (err) {
      console.error('[TrendingProducts] Error:', err);
      setError('Failed to load trending products. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load products when category changes
  useEffect(() => {
    fetchProducts(selectedCategory);
  }, [selectedCategory]);

  // Manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchProducts(selectedCategory, true);
  };

  const competitionColors = {
    low: "text-green-600 bg-green-100 border-green-300",
    medium: "text-yellow-600 bg-yellow-100 border-yellow-300",
    high: "text-red-600 bg-red-100 border-red-300",
  };

  const verdictColors = {
    'GO': 'bg-green-100 text-green-700 border-green-300',
    'MAYBE': 'bg-yellow-100 text-yellow-700 border-yellow-300',
    'NO-GO': 'bg-red-100 text-red-700 border-red-300',
  };

  return (
    <div className="space-y-8">
      {/* Category Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Filter by Category</h2>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRODUCT_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span className="mr-1.5">{category.icon}</span>
              <span className="hidden sm:inline">{category.name}</span>
              <span className="sm:hidden">{category.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {lastUpdated && !isLoading && (
          <p className="mt-4 text-xs text-slate-500">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </p>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <p className="text-lg text-slate-600">Analyzing trending products...</p>
          <p className="text-sm text-slate-500 mt-2">This may take up to 30 seconds</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => fetchProducts(selectedCategory)}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Products Grid */}
      {!isLoading && !error && products.length === 0 && (
        <div className="text-center py-20">
          <p className="text-xl text-slate-600">No trending products found for this category.</p>
          <p className="text-sm text-slate-500 mt-2">Try selecting a different category.</p>
        </div>
      )}

      {!isLoading && !error && products.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, index) => (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:border-blue-300 transition-all"
            >
              {/* Rank Badge & Verdict */}
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl font-bold text-slate-200 group-hover:text-blue-200 transition-colors">
                  #{index + 1}
                </div>
                <div className={`px-2 py-1 rounded-lg text-xs font-bold border ${verdictColors[product.verdict]}`}>
                  {product.verdict}
                </div>
              </div>

              {/* Product Name */}
              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                {product.productName}
              </h3>

              {/* Category */}
              <div className="text-sm text-slate-500 mb-4">{product.category}</div>

              {/* Metrics */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Growth</span>
                  <span className="text-lg font-bold text-green-600">{product.growthRate} 🚀</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Searches/mo</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {product.searchVolume.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Competition</span>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full border ${competitionColors[product.competitionLevel]}`}
                  >
                    {product.competitionLevel.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Avg Price</span>
                  <span className="text-sm font-semibold text-slate-900">
                    ${product.averagePrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Opportunity Score */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-600">Opportunity Score</span>
                  <span className="text-sm font-bold text-slate-900">{product.opportunityScore}/100</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${product.opportunityScore}%` }}
                  />
                </div>
              </div>

              {/* CTA */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="text-blue-600 font-medium group-hover:text-blue-700 flex items-center justify-between">
                  View Full Analysis
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Info Banner */}
      {!isLoading && !error && products.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-bold text-blue-900 mb-2">💡 How We Calculate Trends</h3>
          <p className="text-sm text-blue-800">
            Our trending products are analyzed using real Google Trends data over the past 12 months.
            We calculate growth rates, search volumes, and opportunity scores based on trend direction,
            search volume, and estimated competition. Click any product to see detailed analysis!
          </p>
        </div>
      )}
    </div>
  );
}
