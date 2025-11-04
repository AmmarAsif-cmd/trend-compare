"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How fresh is the data?",
    answer:
      "The data is updated in real time whenever you open a new comparison. After that, TrendCompare keeps a fast cached version so repeat visits load instantly.",
  },
  {
    question: "What can I compare?",
    answer:
      "You can compare search interest for any two topics, brands, or keywords — from ‘AI vs Crypto’ to ‘Tea vs Coffee’.",
  },
  {
    question: "Where does the data come from?",
    answer:
      "TrendCompare uses official Google Trends data to visualize how people’s interests change over time.",
  },
  {
    question: "Is it free to use?",
    answer:
      "Yes! All comparisons and charts are completely free to explore.",
  },
  {
    question: "Why are some results slower to load?",
    answer:
      "If a topic hasn’t been searched before, TrendCompare fetches fresh data directly from Google — this can take a few seconds.",
  },
  {
    question: "Can I share a comparison?",
    answer:
      "Absolutely. Every comparison has its own shareable link, so you can send it to friends or post it anywhere.",
  },
  {
    question: "Do I need an account?",
    answer:
      "No signup needed — just enter your keywords and start comparing instantly.",
  },
  {
    question: "How accurate are the trends?",
    answer:
      "All charts are based on real Google search interest data, normalized and scaled to show clear relative popularity.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="max-w-3xl mx-auto px-6 py-16">
      <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="flex justify-between items-center w-full text-left px-6 py-4 bg-white hover:bg-gray-50 transition"
            >
              <span className="font-medium text-gray-900">{faq.question}</span>
              <ChevronDown
                className={`w-5 h-5 text-gray-500 transform transition-transform ${
                  openIndex === index ? "rotate-180" : ""
                }`}
              />
            </button>
            {openIndex === index && (
              <div className="px-6 pb-4 text-gray-600 bg-gray-50">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
