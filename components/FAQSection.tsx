// components/FAQSection.tsx
"use client";

import React from "react";

const faqs = [
  {
    q: "How fresh is the data?",
    a: "TrendArc uses Google Trends data. Exact freshness depends on the timeframe, but for recent views it is typically delayed by a short amount of time rather than being fully real time.",
  },
  {
    q: "What can I compare?",
    a: "You can compare almost any two topics that people search for on Google, such as products, people, brands, events or general terms. If a term has very little search volume, the chart may look sparse.",
  },
  {
    q: "Where does the data come from?",
    a: "All charts and scores are based on Google Trends interest over time. We normalise the values so each line goes from 0 to 100 within the selected period.",
  },
  {
    q: "Is it free to use?",
    a: "Yes. You can run comparisons and explore interest trends for free. We may add premium features later, but the core comparison view will stay free to use.",
  },
  {
    q: "Why are some results slower to load?",
    a: "When you open a comparison for the first time we fetch the data from Google Trends and generate summaries. After that, repeat visits to the same comparison should feel much faster.",
  },
  {
    q: "Can I share a comparison?",
    a: "Yes. Each comparison has its own clean URL that you can copy and share. Anyone with the link will see the same chart and summaries.",
  },
  {
    q: "Do I need an account?",
    a: "No account is required to browse comparisons. If we add saved lists or alerts in future, those might use optional sign in.",
  },
  {
    q: "How accurate are the trends?",
    a: "Google Trends is designed for relative interest rather than exact search counts. Use the charts to compare patterns, peaks and direction rather than as precise numbers.",
  },
];

export default function FAQSection() {
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
    <section className="mx-auto mt-16 mb-10 max-w-3xl px-4">
      <h2 className="text-center text-2xl font-semibold tracking-tight mb-2">
        Frequently Asked Questions
      </h2>
      <p className="text-center text-sm text-slate-600 mb-6">
        Quick answers to the most common questions about how TrendArc works and
        how to read the charts.
      </p>

      <div className="divide-y rounded-2xl border border-slate-200 bg-white shadow-sm">
        {faqs.map((item, idx) => (
          <details
            key={idx}
            className="group"
            {...(idx === 0 ? { open: true } : {})}
          >
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-slate-800">
              <span>{item.q}</span>
              <span className="ml-2 text-slate-400 group-open:rotate-90 transition-transform">
                ▸
              </span>
            </summary>
            <div className="px-4 pb-4 text-sm text-slate-700">
              {item.a}
            </div>
          </details>
        ))}
      </div>

      <script
        type="application/ld+json"
        // JSON-LD for Google
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </section>
  );
}
