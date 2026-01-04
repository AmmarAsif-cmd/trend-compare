/**
 * Deep Dive Accordion
 * Collapsible section containing detailed analysis
 * Collapsed by default with lazy loading
 */

'use client';

import { useState, lazy, Suspense } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DeepDiveAccordionProps {
  children: React.ReactNode;
}

export default function DeepDiveAccordion({ children }: DeepDiveAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border-2 border-slate-200 shadow-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 sm:p-6 hover:bg-slate-50 transition-colors"
        aria-expanded={isOpen}
        aria-controls="deep-dive-content"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-gradient-to-b from-slate-500 to-slate-600 rounded-full" />
            Deep Dive
          </h3>
          <span className="text-sm text-slate-500 font-normal">
            Charts, forecast, sources, geography, FAQs
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-slate-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-600" />
        )}
      </button>

      {isOpen ? (
        <div 
          id="deep-dive-content"
          className="border-t border-slate-200 p-5 sm:p-6 space-y-6"
        >
          <Suspense fallback={<div className="text-center py-8 text-slate-500">Loading...</div>}>
            {children}
          </Suspense>
        </div>
      ) : null}
    </div>
  );
}

