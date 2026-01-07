import { BRAND } from "@/lib/brand";
import BackButton from "@/components/BackButton";
import { Target, Zap, Users, TrendingUp } from "lucide-react";

export const metadata = {
  title: `About Us | ${BRAND}`,
  description:
    "TrendArc is a free Amazon product research tool that helps sellers find profitable products using AI-powered analysis. We also offer advanced trend analysis tools for researchers and analysts.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="mb-8">
          <BackButton />
        </div>

        {/* Hero Section */}
        <section className="text-center mb-20">
          <div className="inline-block mb-4">
            <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-semibold border border-blue-200">
              🚀 About TrendArc
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="block text-slate-900">Free Product Research</span>
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              For Everyone
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
            TrendArc is a 100% free Amazon product research tool that helps e-commerce sellers
            find profitable products using AI-powered analysis. We also offer advanced trend
            analysis tools for researchers and analysts.
          </p>
        </section>

        {/* Features Grid */}
        <section className="grid md:grid-cols-2 gap-8 mb-20">
          <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-slate-900">What We Do</h2>
            <p className="text-slate-600 leading-relaxed">
              TrendArc provides free AI-powered product research for Amazon and Shopify sellers.
              We analyze search trends, price history, competition, and market opportunities to
              help you find profitable products in seconds. We also offer advanced trend analysis
              tools that aggregate data from multiple sources like Google Trends, Spotify, YouTube,
              and more.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-slate-900">How It Works</h2>
            <p className="text-slate-600 leading-relaxed">
              Simply enter any product name, and our AI analyzes market data in seconds. We check
              search interest trends, price history, competition levels, and seasonality patterns.
              Then we give you a clear GO/NO-GO verdict with actionable recommendations. All for
              free, no signup required, instant results.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-slate-900">Why It Matters</h2>
            <p className="text-slate-600 leading-relaxed">
              Product research tools like Jungle Scout and Helium 10 cost $49-99/month, putting them
              out of reach for many new sellers. TrendArc provides the same essential insights
              completely free. We believe every entrepreneur should have access to powerful product
              research tools without breaking the bank. Our mission is to level the playing field.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-slate-900">Our Vision</h2>
            <p className="text-slate-600 leading-relaxed">
              To become the #1 free product research platform trusted by e-commerce sellers worldwide.
              We believe powerful tools shouldn&rsquo;t require expensive subscriptions. By offering
              AI-powered product research for free, we help thousands of entrepreneurs launch successful
              online businesses without the upfront costs.
            </p>
          </div>
        </section>

        {/* Mission Statement */}
        <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Our Mission</h2>
          <p className="text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed opacity-95">
            Democratize access to powerful product research tools. Make Amazon and Shopify product
            analysis free, fast, and AI-powered. Help entrepreneurs find profitable products without
            expensive monthly subscriptions. Empower 10,000+ sellers to build successful e-commerce
            businesses with confidence.
          </p>
        </section>

        {/* Additional Tools */}
        <section className="mt-12 bg-slate-50 rounded-2xl p-8 border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 text-center">
            More Than Just Product Research
          </h2>
          <p className="text-slate-600 text-center max-w-2xl mx-auto mb-6">
            While our focus is on helping e-commerce sellers, we also offer advanced trend
            analysis tools for researchers and analysts.
          </p>
          <div className="text-center">
            <a
              href="/tools/trend-comparison"
              className="inline-block px-6 py-3 bg-white border-2 border-blue-200 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
            >
              Explore Trend Analysis Tools →
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
