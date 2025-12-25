"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // User not logged in, redirect to login
          router.push("/login?redirect=/pricing");
          return;
        }
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              TrendArc
            </Link>
            <div className="flex gap-4">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Start free with 20 comparisons daily, upgrade for unlimited AI insights
        </p>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {/* Free Tier */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
              <div className="flex items-baseline justify-center mb-4">
                <span className="text-5xl font-bold text-gray-900">$0</span>
                <span className="text-gray-600 ml-2">/month</span>
              </div>
              <p className="text-gray-600">Perfect for casual exploration</p>
            </div>

            {/* Daily Limit Badge */}
            <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
              <p className="text-blue-900 font-semibold text-sm">
                ⏰ 20 comparisons per day
              </p>
              <p className="text-blue-700 text-xs mt-1">Resets daily at midnight UTC</p>
            </div>

            <ul className="space-y-4 mb-8 text-left">
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-700">
                  All trend comparison charts
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-700">TrendArc Score analysis</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-700">Multi-source data breakdown</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-700">All timeframes (7d to 5y)</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-700">Save comparisons</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-700">Geographic data</span>
              </li>

              {/* What's NOT included */}
              <li className="flex items-start opacity-50">
                <svg
                  className="w-6 h-6 text-gray-400 mr-2 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span className="text-gray-500">No AI-powered insights</span>
              </li>
              <li className="flex items-start opacity-50">
                <svg
                  className="w-6 h-6 text-gray-400 mr-2 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span className="text-gray-500">No trend predictions</span>
              </li>
              <li className="flex items-start opacity-50">
                <svg
                  className="w-6 h-6 text-gray-400 mr-2 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span className="text-gray-500">No PDF/CSV exports</span>
              </li>
            </ul>

            <Link
              href="/signup"
              className="block w-full py-3 px-6 text-center font-medium text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Get Started Free
            </Link>
          </div>

          {/* Premium Tier */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 border-2 border-purple-400 relative">
            <div className="absolute top-0 right-0 bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
              POPULAR
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
              <div className="flex items-baseline justify-center mb-4">
                <span className="text-5xl font-bold text-white">$4.99</span>
                <span className="text-blue-100 ml-2">/month</span>
              </div>
              <p className="text-blue-100">For marketers, researchers & power users</p>
            </div>

            {/* Unlimited Badge */}
            <div className="mb-6 bg-white/20 backdrop-blur border-2 border-white/30 rounded-lg p-3">
              <p className="text-white font-semibold text-sm">
                ∞ Unlimited comparisons
              </p>
              <p className="text-blue-100 text-xs mt-1">No daily limits, ever</p>
            </div>

            <ul className="space-y-4 mb-8 text-left">
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-yellow-300 mr-2 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-white font-medium">
                  Everything in Free, plus:
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-yellow-300 mr-2 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <div className="text-white">
                  <strong>AI Peak Explanations</strong>
                  <p className="text-blue-100 text-sm">Why trends spike with real events & dates</p>
                </div>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-yellow-300 mr-2 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <div className="text-white">
                  <strong>30-Day Predictions</strong>
                  <p className="text-blue-100 text-sm">ML-powered forecasts with 5 ensemble methods</p>
                </div>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-yellow-300 mr-2 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <div className="text-white">
                  <strong>Actionable Insights</strong>
                  <p className="text-blue-100 text-sm">What the data means for your business</p>
                </div>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-yellow-300 mr-2 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-white">PDF & CSV exports</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-yellow-300 mr-2 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-white">Email trend alerts</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-yellow-300 mr-2 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-white">Ad-free experience</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-yellow-300 mr-2 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-white">Priority support</span>
              </li>
            </ul>

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="block w-full py-3 px-6 text-center font-medium text-purple-600 bg-white rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Upgrade to Premium"}
            </button>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="max-w-5xl mx-auto mt-16 bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Feature Comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-4 text-gray-700 font-semibold">Feature</th>
                    <th className="text-center py-4 px-4 text-gray-700 font-semibold">Free</th>
                    <th className="text-center py-4 px-4 text-purple-700 font-semibold">Premium</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-4 px-4 text-gray-700">Daily comparisons</td>
                    <td className="text-center py-4 px-4 text-gray-600">20/day</td>
                    <td className="text-center py-4 px-4 text-purple-600 font-semibold">Unlimited</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="py-4 px-4 text-gray-700">Basic charts & data</td>
                    <td className="text-center py-4 px-4">✅</td>
                    <td className="text-center py-4 px-4">✅</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-700">Save comparisons</td>
                    <td className="text-center py-4 px-4">✅</td>
                    <td className="text-center py-4 px-4">✅</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="py-4 px-4 text-gray-700">AI peak explanations</td>
                    <td className="text-center py-4 px-4 text-gray-400">❌</td>
                    <td className="text-center py-4 px-4">✅</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-700">30-day ML predictions</td>
                    <td className="text-center py-4 px-4 text-gray-400">❌</td>
                    <td className="text-center py-4 px-4">✅</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="py-4 px-4 text-gray-700">Actionable insights</td>
                    <td className="text-center py-4 px-4 text-gray-400">❌</td>
                    <td className="text-center py-4 px-4">✅</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-700">PDF exports</td>
                    <td className="text-center py-4 px-4 text-gray-400">❌</td>
                    <td className="text-center py-4 px-4">✅</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="py-4 px-4 text-gray-700">CSV/JSON exports</td>
                    <td className="text-center py-4 px-4 text-gray-400">❌</td>
                    <td className="text-center py-4 px-4">✅</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-700">Email alerts</td>
                    <td className="text-center py-4 px-4 text-gray-400">❌</td>
                    <td className="text-center py-4 px-4">✅</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="py-4 px-4 text-gray-700">Ad-free</td>
                    <td className="text-center py-4 px-4 text-gray-400">❌</td>
                    <td className="text-center py-4 px-4">✅</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-gray-900 mb-2">
                What happens when I hit the 20 comparison daily limit?
              </h3>
              <p className="text-gray-600">
                You'll see a friendly message letting you know you've reached your daily limit.
                Your limit resets at midnight UTC each day. Or upgrade to Premium for unlimited comparisons!
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Yes! You can cancel your Premium subscription at any time.
                You'll continue to have access until the end of your billing
                period.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-gray-900 mb-2">
                What are "AI peak explanations"?
              </h3>
              <p className="text-gray-600">
                Premium users get AI-powered analysis that explains WHY trends spike,
                with specific dates, real events, and citations from Wikipedia and news sources.
                It's like having a trend analyst explain every chart to you.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-gray-900 mb-2">
                How accurate are the predictions?
              </h3>
              <p className="text-gray-600">
                Our predictions use 5 different machine learning methods (ensemble approach)
                and we track accuracy over time. You can see verified predictions with actual
                accuracy scores on comparison pages.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards, debit cards, and payment
                methods through Stripe's secure payment processing.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-gray-900 mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600">
                We offer a 7-day money-back guarantee. If you're not satisfied
                with Premium, contact us within 7 days for a full refund.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-gray-900 mb-2">
                Do I need to create an account for the free tier?
              </h3>
              <p className="text-gray-600">
                You can browse comparisons without an account, but creating a free account
                lets you track your daily usage, save favorite comparisons, and view your history.
                Sign up is quick and only requires an email address.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I save comparisons on the free tier?
              </h3>
              <p className="text-gray-600">
                Yes! Free users can save up to 50 comparisons and access their comparison history.
                Premium users get unlimited saved comparisons and additional organization features.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-gray-900 mb-2">
                What happens to my data if I downgrade from Premium?
              </h3>
              <p className="text-gray-600">
                Your saved comparisons and history are preserved when you downgrade. You'll just
                lose access to premium features like AI insights, predictions, and exports. You can
                upgrade again anytime to restore full access.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-gray-900 mb-2">
                Is there a free trial for Premium?
              </h3>
              <p className="text-gray-600">
                While we don't offer a traditional free trial, the free tier gives you a great taste
                of our platform with 20 comparisons daily. You can see all the data and charts - Premium
                just adds the AI insights, predictions, and exports. Plus, we have a 7-day money-back guarantee!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600">
          <p>© 2025 TrendArc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
