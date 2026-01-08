import ProductSearchHero from "@/components/ecommerce/ProductSearchHero";
import EcommerceFeatures from "@/components/ecommerce/EcommerceFeatures";
import HowItWorksEcommerce from "@/components/ecommerce/HowItWorksEcommerce";
import FAQSection from "@/components/FAQSection";
import FeaturedBlogs from "@/components/blog/FeaturedBlogs";
import type { Metadata } from "next";
import { getCanonicalUrl, getRobotsForParams } from "@/lib/seo/params";

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const resolvedSearchParams = searchParams ? await searchParams : {};

  // Always set canonical to clean homepage URL
  const canonical = getCanonicalUrl("https://trendarc.net", "/");

  // Set robots based on non-indexable params
  const robots = getRobotsForParams(resolvedSearchParams);

  return {
    title: "TrendArc - Free Amazon Product Research Tool | Find Profitable Products",
    description:
      "Free Google Trends data for all users. Upgrade to Premium ($6.99/month) for Amazon product data, price history, sales rank, and AI-powered insights.",
    keywords:
      "amazon product research, jungle scout alternative, free product research tool, amazon fba, shopify products, keepa, product trends",
    alternates: {
      canonical,
    },
    robots,
    openGraph: {
      title: "TrendArc - Free Amazon Product Research Tool",
      description:
        "Free Google Trends data. Premium ($6.99/month) includes Amazon product data, price history, sales rank, and AI-powered insights.",
      type: "website",
      url: canonical,
      images: [
        {
          url: "/og-image-ecommerce.png",
          width: 1200,
          height: 630,
          alt: "TrendArc - Free Amazon Product Research Tool",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "TrendArc - Free Amazon Product Research Tool",
      description:
        "Free Google Trends data. Premium ($6.99/month) for Amazon product data, price history, and AI insights.",
    },
  };
}

export default function Home() {
  return (
    <main id="search">
      {/* Hero Section - Product Search */}
      <ProductSearchHero />

      {/* Features Section */}
      <EcommerceFeatures />

      {/* How It Works */}
      <HowItWorksEcommerce />

      {/* Featured Blogs - Product Research Insights */}
      <div className="relative bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Latest Product Research Insights
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Learn strategies and tactics from successful Amazon sellers
            </p>
          </div>
          <FeaturedBlogs />
        </div>
      </div>

      {/* FAQ Section */}
      <div
        id="faq"
        className="relative bg-gradient-to-br from-white to-slate-50 py-20 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FAQSection />
        </div>
      </div>

      {/* CTA Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 py-20 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Find Your Next Winning Product?
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Join 9,000+ sellers who trust TrendArc for product research
          </p>
          <a
            href="#search"
            className="inline-block px-10 py-5 bg-white text-blue-600 font-bold rounded-xl hover:bg-slate-100 transition-all shadow-2xl hover:shadow-3xl text-lg"
          >
            Start Researching Now - It's Free →
          </a>
          <p className="text-white/80 mt-6 text-sm">
            No credit card required • 100% free forever
          </p>
        </div>
      </section>
    </main>
  );
}
