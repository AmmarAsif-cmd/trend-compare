/**
 * Key Evidence Section
 * Shows top 3 strongest evidence cards with expand control
 */

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { filterValidEvidence } from '@/lib/evidence-validation';
import type { EvidenceCard } from '@/lib/prepare-evidence';

interface KeyEvidenceSectionProps {
  evidence: EvidenceCard[];
  termA: string;
  termB: string;
}

export default function KeyEvidenceSection({
  evidence,
  termA,
  termB,
}: KeyEvidenceSectionProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Filter to only valid evidence
  const validEvidence = filterValidEvidence(evidence);
  const top3 = validEvidence.slice(0, 3);
  const remaining = validEvidence.slice(3);

  const getDirectionLabel = (direction: string, termA: string, termB: string) => {
    if (direction === 'termA') return termA.replace(/-/g, ' ');
    if (direction === 'termB') return termB.replace(/-/g, ' ');
    return 'Tie';
  };

  const getMagnitudeLabel = (magnitude: number) => {
    if (magnitude > 20) return 'Strong';
    if (magnitude > 10) return 'Moderate';
    return 'Weak';
  };

  // Show nothing if no valid evidence
  if (validEvidence.length === 0) {
    return (
      <div className="bg-white rounded-xl border-2 border-slate-200 shadow-lg p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">Key Evidence</h3>
            <p className="text-sm text-slate-600">
              Limited evidence available for some sources in this comparison.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border-2 border-slate-200 shadow-lg p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
          Key Evidence
        </h3>
        {validEvidence.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {expanded ? (
              <>
                <span>Show less</span>
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>View full evidence ({validEvidence.length - 3} more)</span>
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {top3.map((card, idx) => (
          <div
            key={idx}
            className="p-4 bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-lg"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-sm font-bold text-slate-900">{card.source}</span>
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                {getMagnitudeLabel(card.magnitude)}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-slate-600">
                {getDirectionLabel(card.direction, termA, termB)} leads by {card.magnitude.toFixed(1)} points
              </span>
            </div>
            <p className="text-sm text-slate-700">{card.interpretation}</p>
          </div>
        ))}

        {expanded && remaining.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-slate-200">
            {remaining.map((card, idx) => (
              <div
                key={idx}
                className="p-4 bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-bold text-slate-900">{card.source}</span>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                    {getMagnitudeLabel(card.magnitude)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-slate-600">
                    {getDirectionLabel(card.direction, termA, termB)} leads by {card.magnitude.toFixed(1)} points
                  </span>
                </div>
                <p className="text-sm text-slate-700">{card.interpretation}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

