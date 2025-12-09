// components/AmazonProductSection.tsx
"use client";

import React from "react";
import { ShoppingCart, Star, Package, TrendingUp, ExternalLink } from "lucide-react";
import type { AmazonProduct } from "@/lib/amazon-mock-data";
import Image from "next/image";

interface AmazonProductSectionProps {
  termA: string;
  termB: string;
  productA: AmazonProduct | null;
  productB: AmazonProduct | null;
  isDemoMode?: boolean;
}

export default function AmazonProductSection({
  termA,
  termB,
  productA,
  productB,
  isDemoMode = true,
}: AmazonProductSectionProps) {
  // Don't show if no products found
  if (!productA && !productB) {
    return null;
  }

  // Don't show if products are in different categories
  if (productA && productB && productA.category !== productB.category) {
    return null;
  }

  const getAvailabilityColor = (availability: string): string => {
    switch (availability) {
      case 'in_stock':
        return 'text-green-600';
      case 'limited_stock':
        return 'text-yellow-600';
      case 'out_of_stock':
        return 'text-red-600';
      default:
        return 'text-slate-500';
    }
  };

  const getAvailabilityText = (availability: string): string => {
    switch (availability) {
      case 'in_stock':
        return 'In Stock';
      case 'limited_stock':
        return 'Limited Stock';
      case 'out_of_stock':
        return 'Out of Stock';
      default:
        return 'Unknown';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= Math.round(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-slate-200 text-slate-200'
            }`}
          />
        ))}
      </div>
    );
  };

  const getPriceComparison = (): string | null => {
    if (!productA?.price || !productB?.price) return null;

    const diff = productA.price.value - productB.price.value;
    const percentage = Math.abs((diff / productB.price.value) * 100);

    if (Math.abs(diff) < 1) return "Same price";

    if (diff > 0) {
      return `${productB.brand} is ${percentage.toFixed(0)}% cheaper`;
    } else {
      return `${productA.brand} is ${percentage.toFixed(0)}% cheaper`;
    }
  };

  const getRatingComparison = (): string | null => {
    if (!productA?.rating || !productB?.rating) return null;

    const diff = productA.rating.value - productB.rating.value;

    if (Math.abs(diff) < 0.1) return "Rated equally";

    if (diff > 0) {
      return `${productA.brand} rated ${diff.toFixed(1)} stars higher`;
    } else {
      return `${productB.brand} rated ${Math.abs(diff).toFixed(1)} stars higher`;
    }
  };

  const priceComparison = getPriceComparison();
  const ratingComparison = getRatingComparison();

  return (
    <section className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border-2 border-amber-200 p-6 sm:p-8 shadow-xl">
      {isDemoMode && (
        <div className="mb-6 bg-blue-100 border-2 border-blue-300 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl">ℹ️</span>
            </div>
            <div>
              <h4 className="font-bold text-blue-900 mb-1">Demo Mode - Sample Data</h4>
              <p className="text-sm text-blue-800">
                This is mock Amazon product data to show you how the feature works.
                Real prices, ratings, and availability will come from Amazon Product API.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
          <ShoppingCart className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Product Comparison
          </h3>
          <p className="text-sm text-slate-600">
            Current prices, ratings, and availability on Amazon
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Product A */}
        <div className="bg-white rounded-2xl border border-amber-200 p-6 hover:shadow-lg transition-shadow">
          {productA ? (
            <>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-24 h-24 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-200">
                  {productA.image ? (
                    <Image
                      src={productA.image}
                      alt={productA.title}
                      width={96}
                      height={96}
                      className="object-contain"
                    />
                  ) : (
                    <Package className="w-12 h-12 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-amber-600 mb-1">{productA.brand}</p>
                  <h4 className="font-bold text-sm text-slate-900 line-clamp-2 mb-2">
                    {productA.title}
                  </h4>
                  {productA.isPrime && (
                    <span className="inline-flex items-center text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      Prime
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {productA.price && (
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-slate-600">Price</span>
                    <span className="text-2xl font-bold text-slate-900">
                      {productA.price.displayPrice}
                    </span>
                  </div>
                )}

                {productA.rating && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Rating</span>
                      <div className="flex items-center gap-2">
                        {renderStars(productA.rating.value)}
                        <span className="text-sm font-semibold text-slate-900">
                          {productA.rating.value.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 text-right">
                      {productA.rating.count.toLocaleString()} reviews
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-sm text-slate-600">Availability</span>
                  <span className={`text-sm font-semibold ${getAvailabilityColor(productA.availability)}`}>
                    {getAvailabilityText(productA.availability)}
                  </span>
                </div>
              </div>

              <a
                href={productA.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-2.5 px-4 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                View on Amazon
                <ExternalLink className="w-4 h-4" />
              </a>
            </>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No product found for {termA}</p>
            </div>
          )}
        </div>

        {/* Product B */}
        <div className="bg-white rounded-2xl border border-amber-200 p-6 hover:shadow-lg transition-shadow">
          {productB ? (
            <>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-24 h-24 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-200">
                  {productB.image ? (
                    <Image
                      src={productB.image}
                      alt={productB.title}
                      width={96}
                      height={96}
                      className="object-contain"
                    />
                  ) : (
                    <Package className="w-12 h-12 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-amber-600 mb-1">{productB.brand}</p>
                  <h4 className="font-bold text-sm text-slate-900 line-clamp-2 mb-2">
                    {productB.title}
                  </h4>
                  {productB.isPrime && (
                    <span className="inline-flex items-center text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      Prime
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {productB.price && (
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-slate-600">Price</span>
                    <span className="text-2xl font-bold text-slate-900">
                      {productB.price.displayPrice}
                    </span>
                  </div>
                )}

                {productB.rating && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Rating</span>
                      <div className="flex items-center gap-2">
                        {renderStars(productB.rating.value)}
                        <span className="text-sm font-semibold text-slate-900">
                          {productB.rating.value.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 text-right">
                      {productB.rating.count.toLocaleString()} reviews
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-sm text-slate-600">Availability</span>
                  <span className={`text-sm font-semibold ${getAvailabilityColor(productB.availability)}`}>
                    {getAvailabilityText(productB.availability)}
                  </span>
                </div>
              </div>

              <a
                href={productB.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-2.5 px-4 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                View on Amazon
                <ExternalLink className="w-4 h-4" />
              </a>
            </>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No product found for {termB}</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Comparison Summary */}
      {productA && productB && (
        <div className="bg-white/60 rounded-xl border border-amber-200 p-5">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h5 className="font-semibold text-sm text-slate-900 mb-2">
                Quick Comparison
              </h5>
              <div className="space-y-1.5 text-sm text-slate-700">
                {priceComparison && (
                  <p className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    {priceComparison}
                  </p>
                )}
                {ratingComparison && (
                  <p className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    {ratingComparison}
                  </p>
                )}
                {productA.isPrime && productB.isPrime && (
                  <p className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Both available with Prime shipping
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
