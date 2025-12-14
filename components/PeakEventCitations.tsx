"use client";

import { ExternalLink, CheckCircle, AlertCircle, Calendar } from "lucide-react";
import type { PeakEvent } from "@/lib/peak-event-detector";

interface PeakEventCitationsProps {
  peaks: PeakEvent[];
  termA: string;
  termB: string;
}

export default function PeakEventCitations({ peaks, termA, termB }: PeakEventCitationsProps) {
  if (peaks.length === 0) return null;

  // Group peaks by term
  const peaksA = peaks.filter(p => p.term === termA);
  const peaksB = peaks.filter(p => p.term === termB);

  // Show top 3 peaks per term
  const topPeaksA = peaksA.slice(0, 3);
  const topPeaksB = peaksB.slice(0, 3);

  return (
    <section className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl border-2 border-blue-200 shadow-lg p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
          <Calendar className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Peak Events & Citations</h2>
          <p className="text-sm text-slate-600">Real-world events that caused search spikes</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Term A Peaks */}
        {topPeaksA.length > 0 && (
          <div>
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              {termA} Peaks
            </h3>
            <div className="space-y-4">
              {topPeaksA.map((peak, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {new Date(peak.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-xs text-slate-500">Peak: {Math.round(peak.value)}</span>
                      </div>
                      {peak.event ? (
                        <p className="text-sm font-semibold text-slate-900 mb-2">{peak.event.title}</p>
                      ) : (
                        <p className="text-sm text-slate-500 italic">No event detected for this peak</p>
                      )}
                    </div>
                    {peak.event?.verified && (
                      <div title="Verified by multiple sources">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      </div>
                    )}
                  </div>
                  
                  {peak.citations.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold text-slate-700 mb-2">Citations:</p>
                      {peak.citations.map((citation, cIdx) => (
                        <a
                          key={cIdx}
                          href={citation.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-2 text-xs text-blue-600 hover:text-blue-700 hover:underline group"
                        >
                          <ExternalLink className="w-3 h-3 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                          <div className="flex-1">
                            <span className="font-medium">{citation.title}</span>
                            <span className="text-slate-500 ml-2">({citation.source})</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Term B Peaks */}
        {topPeaksB.length > 0 && (
          <div>
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              {termB} Peaks
            </h3>
            <div className="space-y-4">
              {topPeaksB.map((peak, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded">
                          {new Date(peak.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-xs text-slate-500">Peak: {Math.round(peak.value)}</span>
                      </div>
                      {peak.event ? (
                        <p className="text-sm font-semibold text-slate-900 mb-2">{peak.event.title}</p>
                      ) : (
                        <p className="text-sm text-slate-500 italic">No event detected for this peak</p>
                      )}
                    </div>
                    {peak.event?.verified && (
                      <div title="Verified by multiple sources">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      </div>
                    )}
                  </div>
                  
                  {peak.citations.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold text-slate-700 mb-2">Citations:</p>
                      {peak.citations.map((citation, cIdx) => (
                        <a
                          key={cIdx}
                          href={citation.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-2 text-xs text-blue-600 hover:text-blue-700 hover:underline group"
                        >
                          <ExternalLink className="w-3 h-3 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                          <div className="flex-1">
                            <span className="font-medium">{citation.title}</span>
                            <span className="text-slate-500 ml-2">({citation.source})</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {peaksA.length === 0 && peaksB.length === 0 && (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">No significant peaks detected in this timeframe</p>
        </div>
      )}
    </section>
  );
}

