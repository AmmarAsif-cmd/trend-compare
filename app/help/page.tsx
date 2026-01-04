/**
 * Help & Support Page
 * Comprehensive help documentation and FAQs
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { HelpCircle, Search, BookOpen, MessageSquare, ArrowRight, CheckCircle } from 'lucide-react';
import { GLOBAL_FAQS } from '@/lib/faqs/global-faqs';

export const metadata: Metadata = {
  title: 'Help & Support | TrendArc',
  description: 'Get help with TrendArc. Find answers to common questions, learn how to use features, and get support.',
};

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-6">
              <HelpCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4">
              Help & Support
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Find answers to common questions and learn how to get the most out of TrendArc
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid sm:grid-cols-2 gap-4 mb-12">
            <Link
              href="/contact"
              className="flex items-center gap-4 p-6 bg-white rounded-xl border-2 border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                <MessageSquare className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">Contact Support</h3>
                <p className="text-sm text-slate-600">Get in touch with our team</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </Link>

            <Link
              href="/feedback"
              className="flex items-center gap-4 p-6 bg-white rounded-xl border-2 border-slate-200 hover:border-purple-300 hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">Send Feedback</h3>
                <p className="text-sm text-slate-600">Share your thoughts and ideas</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 transition-colors" />
            </Link>
          </div>

          {/* FAQs Section */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-6 h-6 text-indigo-600" />
              <h2 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-4">
              {GLOBAL_FAQS.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-slate-900 mb-2 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    {faq.question}
                  </h3>
                  <p className="text-slate-600 leading-relaxed pl-8">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Getting Started */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Search className="w-6 h-6 text-indigo-600" />
              <h2 className="text-2xl font-bold text-slate-900">Getting Started</h2>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">How to Compare Trends</h3>
                <ol className="list-decimal list-inside space-y-2 text-slate-600 ml-4">
                  <li>Enter two topics in the search bar on the homepage</li>
                  <li>Select a timeframe (12 months, 5 years, etc.)</li>
                  <li>Optionally choose a geographic region</li>
                  <li>View the comprehensive comparison with scores, charts, and insights</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Understanding the Dashboard</h3>
                <p className="text-slate-600 mb-2">
                  Your dashboard helps you track and monitor comparisons:
                </p>
                <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
                  <li><strong>Tracked Comparisons:</strong> Save comparisons to monitor changes over time</li>
                  <li><strong>Alerts:</strong> Set up notifications for significant changes</li>
                  <li><strong>Reports:</strong> Download PDF or CSV exports of your comparisons</li>
                  <li><strong>History:</strong> View your recent comparison activity</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Exporting Data</h3>
                <p className="text-slate-600">
                  Premium users can export comparison data as PDF reports or CSV files. PDF reports include executive summaries, charts, and insights. CSV files contain raw time series data for analysis.
                </p>
              </div>
            </div>
          </div>

          {/* Still Need Help */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 p-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Still Need Help?</h2>
            <p className="text-slate-600 mb-6">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm hover:shadow-md"
            >
              <MessageSquare className="w-5 h-5" />
              Contact Support
            </Link>
          </div>
        </div>
      </main>
  );
}

