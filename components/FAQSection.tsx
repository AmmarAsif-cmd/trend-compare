// components/FAQSection.tsx
"use client";

import React from "react";
import { HelpCircle, ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Where does TrendArc get its data?",
    a: "TrendArc combines data from multiple sources: Google Trends (primary source for charts), Reddit (social engagement), and Wikipedia (knowledge interest). This multi-source approach gives you a complete picture of how topics trend across different platforms.",
  },
  {
    q: "How often is data updated?",
    a: "Our data refreshes every 4 hours. Popular comparisons update hourly to ensure you always have the latest insights.",
  },
  {
    q: "Is TrendArc free to use?",
    a: "Yes! TrendArc is completely free to use with unlimited comparisons, trend analysis, and AI-powered insights.",
  },
  {
    q: "What can I compare?",
    a: "You can compare almost any two topics that people search for - products, brands, people, events, or general terms.",
  },
  {
    q: "Can I share a comparison?",
    a: "Yes. Each comparison has its own clean URL that you can copy and share. Anyone with the link will see the same data.",
  },
  {
    q: "How accurate are the trends?",
    a: "Google Trends is designed for relative interest rather than exact search counts. Use the charts to compare patterns and direction.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };

  return (
    <section className="mx-auto max-w-4xl">
      <div className="text-center mb-12 sm:mb-16">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
          Frequently Asked
          <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Questions
          </span>
        </h2>
        <p className="text-lg sm:text-xl text-slate-600">
          Everything you need to know about TrendArc
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300"
          >
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full px-6 sm:px-8 py-5 sm:py-6 flex items-start justify-between gap-4 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start gap-3 sm:gap-4 flex-1">
                <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0 mt-1" />
                <span className="font-bold text-base sm:text-lg text-slate-900">{faq.q}</span>
              </div>
              <ChevronDown
                className={`w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0 transition-transform duration-300 ${
                  openIndex === idx ? "rotate-180" : ""
                }`}
              />
            </button>
            {openIndex === idx && (
              <div className="px-6 sm:px-8 pb-5 sm:pb-6 border-t border-slate-100 pt-4 sm:pt-5 animate-fadeIn">
                <p className="text-slate-600 leading-relaxed pl-8 sm:pl-10 text-sm sm:text-base">{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </section>
  );
}
