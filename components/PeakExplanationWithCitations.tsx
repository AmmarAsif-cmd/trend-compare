'use client';

import { ExternalLink, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

type Citation = {
  title: string;
  url: string;
  source: string;
  date?: string;
};

type Props = {
  explanation: string;
  citations: Citation[];
  confidence?: number;
  verified?: boolean;
  sources?: string[];
};

export default function PeakExplanationWithCitations({
  explanation,
  citations,
  confidence = 50,
  verified = false,
  sources = [],
}: Props) {
  const getConfidenceColor = () => {
    if (confidence >= 70) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 50) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-amber-600 bg-amber-50 border-amber-200';
  };

  const getConfidenceLabel = () => {
    if (confidence >= 70) return 'High Confidence';
    if (confidence >= 50) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <div className="bg-gradient-to-br from-white via-violet-50/30 to-purple-50/30 rounded-xl border-2 border-violet-200 shadow-lg p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex-shrink-0">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
            Peak Explanation
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {verified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </span>
            )}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border ${getConfidenceColor()}`}>
              {getConfidenceLabel()}
            </span>
            {sources.length > 0 && (
              <span className="text-xs text-slate-600">
                Sources: {sources.join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="mb-4">
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          {explanation}
        </p>
      </div>

      {/* Citations */}
      {citations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-violet-200">
          <h4 className="text-xs sm:text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <span>Citations & Sources ({citations.length})</span>
          </h4>
          <div className="space-y-2">
            {citations.map((citation, index) => (
              <a
                key={index}
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-2 p-2.5 bg-white rounded-lg border border-slate-200 hover:border-violet-300 hover:shadow-sm transition-all"
              >
                <ExternalLink className="w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5 group-hover:text-violet-700" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-slate-900 group-hover:text-violet-700 transition-colors line-clamp-2">
                    {citation.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">{citation.source}</span>
                    {citation.date && (
                      <>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-xs text-slate-500">{citation.date}</span>
                      </>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {citations.length === 0 && confidence < 50 && (
        <div className="mt-4 pt-4 border-t border-amber-200">
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              <span className="font-semibold">Note:</span> This explanation is based on pattern analysis. 
              No specific event citations were found for this peak date.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


