'use client';

import { ExternalLink, CheckCircle2, AlertCircle, FileText, TrendingUp, Database } from 'lucide-react';
import type { ImprovedPeakExplanation } from '@/lib/peak-explanation-improved';

type Props = {
  peakExplanation: ImprovedPeakExplanation;
  keyword: string;
};

export default function ImprovedPeakExplanationComponent({
  peakExplanation,
  keyword,
}: Props) {
  const { explanation, confidence, citations, verified, sourceCount, status } = peakExplanation;

  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          color: 'text-green-600 bg-green-50 border-green-200',
          badge: 'Verified',
          icon: <CheckCircle2 className="w-4 h-4" />,
          bgGradient: 'from-green-50 via-emerald-50/30 to-teal-50/30',
          borderColor: 'border-green-200',
        };
      case 'probable':
        return {
          color: 'text-blue-600 bg-blue-50 border-blue-200',
          badge: 'Probable',
          icon: <TrendingUp className="w-4 h-4" />,
          bgGradient: 'from-blue-50 via-indigo-50/30 to-violet-50/30',
          borderColor: 'border-blue-200',
        };
      case 'possible':
        return {
          color: 'text-amber-600 bg-amber-50 border-amber-200',
          badge: 'Possible',
          icon: <AlertCircle className="w-4 h-4" />,
          bgGradient: 'from-amber-50 via-yellow-50/30 to-orange-50/30',
          borderColor: 'border-amber-200',
        };
      case 'unknown':
        return {
          color: 'text-slate-600 bg-slate-50 border-slate-200',
          badge: 'Unknown',
          icon: <AlertCircle className="w-4 h-4" />,
          bgGradient: 'from-slate-50 via-gray-50/30 to-slate-50/30',
          borderColor: 'border-slate-300',
        };
    }
  };

  const statusConfig = getStatusConfig();

  const getConfidenceLabel = () => {
    if (confidence >= 80) return 'High';
    if (confidence >= 60) return 'Medium';
    if (confidence >= 40) return 'Low';
    return 'Unknown';
  };

  return (
    <div className={`bg-gradient-to-br ${statusConfig.bgGradient} rounded-xl border-2 ${statusConfig.borderColor} shadow-lg p-4 sm:p-6`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className={`p-2 ${statusConfig.color} rounded-lg flex-shrink-0`}>
          {statusConfig.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
            Peak Explanation
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border ${statusConfig.color}`}>
              {statusConfig.badge}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
              {confidence}% Confidence
            </span>
            {sourceCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                <Database className="w-3 h-3" />
                {sourceCount} {sourceCount === 1 ? 'Source' : 'Sources'}
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

      {/* Citations - Only show if we have real sources */}
      {citations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <h4 className="text-xs sm:text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <span>Sources & Citations ({citations.length})</span>
          </h4>
          <div className="space-y-2">
            {citations.map((citation, index) => (
              <a
                key={index}
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-2 p-3 bg-white rounded-lg border border-slate-200 hover:border-violet-300 hover:shadow-md transition-all"
              >
                <ExternalLink className="w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5 group-hover:text-violet-700" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-slate-900 group-hover:text-violet-700 transition-colors line-clamp-2">
                    {citation.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 bg-violet-50 text-violet-700 text-xs font-medium rounded">
                      {citation.source}
                    </span>
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

          {/* Source quality indicator */}
          {verified && (
            <div className="mt-3 flex items-center gap-2 p-2 bg-green-50 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-xs text-green-800">
                <span className="font-semibold">Verified:</span> Multiple independent sources confirm this event
              </p>
            </div>
          )}
        </div>
      )}

      {/* Unknown status - show helpful message */}
      {status === 'unknown' && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <AlertCircle className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs sm:text-sm text-slate-700 mb-2">
                <span className="font-semibold">What we searched:</span>
              </p>
              <ul className="text-xs text-slate-600 space-y-1 ml-4 list-disc">
                <li>Wikipedia historical events for this date</li>
                <li>Global news database (GDELT Project)</li>
                <li>News articles mentioning "{keyword}"</li>
              </ul>
              <p className="text-xs text-slate-500 mt-3">
                💡 <span className="font-semibold">Know what caused this peak?</span> Let us know so we can improve our data!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Low confidence warning */}
      {status === 'possible' && confidence < 50 && (
        <div className="mt-4 pt-4 border-t border-amber-200">
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              <span className="font-semibold">Low Confidence:</span> We found some events around this date,
              but the connection to "{keyword}" is uncertain. Take this explanation with caution.
            </p>
          </div>
        </div>
      )}

      {/* Data sources footer */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-500 text-center">
          Data sources: Wikipedia Events API • GDELT Project • AI Verification
        </p>
      </div>
    </div>
  );
}
