"use client";

import { useState, useEffect } from "react";
import type { CachedProductData } from "@/lib/services/product/cache";
import OpportunityVerdict from "./OpportunityVerdict";
import PriceHistoryChart from "./PriceHistoryChart";
import CompetitionMetrics from "./CompetitionMetrics";
import AIProductInsights from "./AIProductInsights";

interface Props {
  productName: string;
  data: CachedProductData;
}

export default function ProductAnalysisClient({ productName, data }: Props) {
  const [aiInsights, setAIInsights] = useState<any>(data.analysis);
  const [isLoadingAI, setIsLoadingAI] = useState(!data.analysis);

  // Load AI insights if not cached
  useEffect(() => {
    if (!data.analysis && data.keepaData) {
      loadAIInsights();
    }
  }, [data]);

  const loadAIInsights = async () => {
    try {
      setIsLoadingAI(true);

      const response = await fetch("/api/product/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          keepaData: data.keepaData,
          trendsData: data.trendsData,
        }),
      });

      if (response.ok) {
        const insights = await response.json();
        setAIInsights(insights);
      }
    } catch (error) {
      console.error("[ProductAnalysis] Error loading AI insights:", error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const keepaData = data.keepaData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-4">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
          {productName}
        </h1>

        {keepaData?.brand && (
          <p className="text-lg text-slate-600">
            Brand: <span className="font-semibold">{keepaData.brand}</span>
          </p>
        )}

        {/* Product Image */}
        {keepaData?.imageUrl && (
          <div className="flex justify-center sm:justify-start">
            <img
              src={keepaData.imageUrl}
              alt={productName}
              className="w-48 h-48 object-contain rounded-lg border border-slate-200"
            />
          </div>
        )}
      </header>

      {/* Opportunity Verdict */}
      <OpportunityVerdict
        productName={productName}
        keepaData={keepaData}
        aiInsights={aiInsights}
        isLoadingAI={isLoadingAI}
      />

      {/* Price History */}
      {keepaData && keepaData.priceHistory.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            💰 Price History
          </h2>
          <PriceHistoryChart data={keepaData} />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="text-sm text-slate-600 mb-1">Current Price</div>
              <div className="text-2xl font-bold text-slate-900">
                {keepaData.currentPrice ? `$${keepaData.currentPrice.toFixed(2)}` : "N/A"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-slate-600 mb-1">Average Price</div>
              <div className="text-2xl font-bold text-slate-900">
                {keepaData.averagePrice ? `$${keepaData.averagePrice.toFixed(2)}` : "N/A"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-slate-600 mb-1">Min Price</div>
              <div className="text-2xl font-bold text-green-600">
                ${keepaData.minPrice.toFixed(2)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-slate-600 mb-1">Max Price</div>
              <div className="text-2xl font-bold text-red-600">
                ${keepaData.maxPrice.toFixed(2)}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Competition Metrics */}
      {keepaData && (
        <CompetitionMetrics keepaData={keepaData} />
      )}

      {/* AI Insights */}
      <AIProductInsights
        insights={aiInsights}
        isLoading={isLoadingAI}
      />

      {/* Additional Info */}
      {keepaData && (
        <section className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl border border-slate-200 p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            📊 Additional Metrics
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-slate-600 mb-1">Rating</div>
              <div className="text-xl font-bold text-slate-900">
                {keepaData.rating ? `${keepaData.rating.toFixed(1)} ⭐` : "N/A"}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-slate-600 mb-1">Reviews</div>
              <div className="text-xl font-bold text-slate-900">
                {keepaData.reviewCount?.toLocaleString() || "N/A"}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-slate-600 mb-1">Out of Stock (30 days)</div>
              <div className="text-xl font-bold text-slate-900">
                {keepaData.outOfStockPercentage30Days.toFixed(1)}%
              </div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-slate-600 mb-1">Out of Stock (90 days)</div>
              <div className="text-xl font-bold text-slate-900">
                {keepaData.outOfStockPercentage90Days.toFixed(1)}%
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white">
        <h3 className="text-2xl font-bold mb-4">
          Ready to Research Another Product?
        </h3>
        <a
          href="/"
          className="inline-block px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-slate-100 transition-all shadow-lg text-lg"
        >
          Search Again →
        </a>
      </section>
    </div>
  );
}
