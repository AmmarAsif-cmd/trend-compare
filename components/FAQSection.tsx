/**
 * Hybrid FAQ Section
 * Shows global FAQs + comparison-specific FAQs
 */

'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { GLOBAL_FAQS } from '@/lib/faqs/global-faqs';
import type { ComparisonFAQ } from '@/lib/faqs/comparison-faqs';

interface FAQSectionProps {
  comparisonFaqs?: ComparisonFAQ[];
}

export default function FAQSection({ comparisonFaqs = [] }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [comparisonFaqsOpen, setComparisonFaqsOpen] = useState(false);

  const allFaqs = [
    ...GLOBAL_FAQS.map(f => ({ id: f.id, q: f.question, a: f.answer })),
    ...(comparisonFaqs.length > 0 ? [{ id: 'comparison-separator', q: '', a: '' }] : []),
  ];

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      ...GLOBAL_FAQS.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answer,
        },
      })),
      ...comparisonFaqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answer,
        },
      })),
    ],
  };

  return (
    <section className="mx-auto max-w-4xl">
      <div className="text-center mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">
          Frequently Asked
          <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Questions
          </span>
        </h2>
        <p className="text-base sm:text-lg text-slate-600">
          Everything you need to know about TrendArc
        </p>
      </div>

      {/* Global FAQs */}
      <div className="space-y-4 mb-6">
        {GLOBAL_FAQS.map((faq, idx) => (
          <div
            key={faq.id}
            className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300"
          >
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-start justify-between gap-4 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start gap-3 sm:gap-4 flex-1">
                <HelpCircle className="w-5 h-5 sm:w-6 text-blue-600 flex-shrink-0 mt-1" />
                <span className="font-bold text-base sm:text-lg text-slate-900">{faq.question}</span>
              </div>
              <ChevronDown
                className={`w-5 h-5 sm:w-6 text-blue-600 flex-shrink-0 transition-transform duration-300 ${
                  openIndex === idx ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openIndex === idx && (
              <div className="px-5 sm:px-6 pb-4 sm:pb-5 border-t border-slate-100 pt-4 sm:pt-5 animate-fadeIn">
                <p className="text-slate-600 leading-relaxed pl-8 sm:pl-10 text-sm sm:text-base">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Comparison-Specific FAQs (collapsed by default) */}
      {comparisonFaqs.length > 0 && (
        <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden">
          <button
            onClick={() => setComparisonFaqsOpen(!comparisonFaqsOpen)}
            className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4 text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
              <span className="font-bold text-base sm:text-lg text-slate-900">
                FAQs about this comparison
              </span>
              <span className="text-xs text-slate-500 font-normal">
                ({comparisonFaqs.length} questions)
              </span>
            </div>
            {comparisonFaqsOpen ? (
              <ChevronUp className="w-5 h-5 text-purple-600 flex-shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-purple-600 flex-shrink-0" />
            )}
          </button>

          {comparisonFaqsOpen && (
            <div className="border-t border-slate-100">
              <div className="space-y-4 p-5 sm:p-6">
                {comparisonFaqs.map((faq, idx) => (
                  <div
                    key={faq.id}
                    className="bg-purple-50 rounded-lg border border-purple-200 p-4"
                  >
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 mb-2">{faq.question}</h4>
                    <p className="text-sm text-slate-700 leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </section>
  );
}
