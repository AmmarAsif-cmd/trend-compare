import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductByQuery, parseKeepaProduct } from "@/lib/services/keepa/client";
import { getCachedProduct, setCachedProduct } from "@/lib/services/product/cache";
import { getProductTrendData } from "@/lib/services/product/trends";
import ProductAnalysisClient from "@/components/product/ProductAnalysisClient";
import BackButton from "@/components/BackButton";

// Force dynamic rendering for product pages
export const dynamic = "force-dynamic";
export const revalidate = 3600; // Revalidate every hour

interface Props {
  params: Promise<{ slug: string }>;
}

import { slugToProductName, validateProductName, sanitizeProductName } from "@/lib/utils/product-validation";

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const productName = slugToProductName(slug);

  return {
    title: `${productName} Analysis - Amazon Product Research | TrendArc`,
    description: `Free product research for ${productName}. Analyze search trends, price history, competition, and get AI-powered recommendations.`,
    keywords: `${productName}, amazon product research, ${productName} trends, ${productName} price history`,
    openGraph: {
      title: `${productName} Product Analysis | TrendArc`,
      description: `Comprehensive product research for ${productName} with AI insights`,
      type: "article",
    },
  };
}

export default async function ProductAnalysisPage({ params }: Props) {
  const { slug } = await params;
  
  // Validate and sanitize slug
  if (!slug || typeof slug !== 'string') {
    notFound();
  }

  const productName = slugToProductName(slug);
  const validation = validateProductName(productName);
  
  if (!validation.valid) {
    return (
      <main className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8 py-12">
        <BackButton label="Back to Search" />
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Invalid Product Name</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {validation.error || 'The product name is invalid.'}
          </p>
          <a
            href="/"
            className="inline-block mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Search
          </a>
        </div>
      </main>
    );
  }

  // Check cache first
  let cachedData = await getCachedProduct(productName);

  // If not cached or cache is old, fetch fresh data
  if (!cachedData) {
    try {
      // Fetch Keepa data if API key is configured
      let keepaData = null;
      if (process.env.KEEPA_API_KEY) {
        try {
          const keepaProduct = await getProductByQuery(productName);
          if (keepaProduct) {
            keepaData = parseKeepaProduct(keepaProduct);
          }
        } catch (error) {
          console.error("[ProductAnalysis] Keepa API error:", error);
          // Continue without Keepa data - we can still show trends data
          // This is graceful degradation
        }
      }

      // Fetch Google Trends data
      let trendsData = null;
      try {
        trendsData = await getProductTrendData(productName, {
          timeframe: '12m',
          geo: 'US',
        });
      } catch (error) {
        console.error("[ProductAnalysis] Google Trends error:", error);
        // Continue without trends data - it's not critical
      }

      // Prepare data for caching
      cachedData = {
        keepaData,
        trendsData,
        analysis: null, // Will be populated by AI
        cachedAt: new Date().toISOString(),
      };

      // Cache the data
      await setCachedProduct(productName, cachedData);
    } catch (error) {
      console.error("[ProductAnalysis] Error fetching product data:", error);

      // Return error page
      return (
        <main className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8 py-12">
          <BackButton label="Back to Search" />
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{productName}</h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Unable to fetch product data. Please try again later or search for a different
              product.
            </p>
            <a
              href="/"
              className="inline-block mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Search
            </a>
          </div>
        </main>
      );
    }
  }

  // If no data available, show not found
  if (!cachedData?.keepaData && !cachedData?.trendsData) {
    return (
      <main className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8 py-12">
        <BackButton label="Back to Search" />
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
            <svg
              className="w-8 h-8 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">{productName}</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            No data available for this product. This could mean:
          </p>
          <ul className="text-left max-w-md mx-auto space-y-2 text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-amber-600 mt-1">•</span>
              <span>The product name is too specific or misspelled</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 mt-1">•</span>
              <span>The product is not available on Amazon</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 mt-1">•</span>
              <span>Try using a more general product category</span>
            </li>
          </ul>
          <a
            href="/"
            className="inline-block mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Another Search
          </a>
        </div>
      </main>
    );
  }

  // Render the product analysis page
  return (
    <main className="mx-auto max-w-7xl space-y-6 sm:space-y-8 px-4 sm:px-6 lg:px-8 pt-6 pb-12">
      <BackButton label="Back to Search" />

      <ProductAnalysisClient productName={productName} data={cachedData} />
    </main>
  );
}
