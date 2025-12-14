/**
 * Geographic Breakdown Component
 * Shows which regions prefer which term
 * FREE - No API costs, uses PyTrends data
 */

import { Globe, MapPin } from "lucide-react";
import type { GeographicBreakdown as GeoData } from "@/lib/getGeographicData";

type GeographicBreakdownProps = {
  geoData: GeoData;
  termA: string;
  termB: string;
};

function prettyTerm(t: string): string {
  return t
    .replace(/-/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function GeographicBreakdown({
  geoData,
  termA,
  termB,
}: GeographicBreakdownProps) {
  if (
    !geoData ||
    (geoData.termA_dominance.length === 0 &&
      geoData.termB_dominance.length === 0 &&
      geoData.competitive_regions.length === 0)
  ) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
          <span>Geographic Breakdown</span>
        </h3>
        <p className="text-slate-600 text-xs sm:text-sm">
          Which regions prefer {prettyTerm(termA)} vs {prettyTerm(termB)}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Term A Dominance */}
        {geoData.termA_dominance.length > 0 && (
          <div>
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600"></span>
              {prettyTerm(termA)} Dominates
            </h4>
            <div className="space-y-3">
              {geoData.termA_dominance.slice(0, 5).map((region, index) => (
                <div key={index} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">
                        {region.country}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-blue-600">
                      +{Math.round(region.advantage)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (region.advantage / 50) * 100)}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                    <span>{region.termA_value}</span>
                    <span>vs</span>
                    <span>{region.termB_value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Term B Dominance */}
        {geoData.termB_dominance.length > 0 && (
          <div>
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-600"></span>
              {prettyTerm(termB)} Dominates
            </h4>
            <div className="space-y-3">
              {geoData.termB_dominance.slice(0, 5).map((region, index) => (
                <div key={index} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">
                        {region.country}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-purple-600">
                      +{Math.round(region.advantage)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (region.advantage / 50) * 100)}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                    <span>{region.termA_value}</span>
                    <span>vs</span>
                    <span>{region.termB_value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Competitive Regions */}
        {geoData.competitive_regions.length > 0 && (
          <div>
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-600"></span>
              Most Competitive
            </h4>
            <div className="space-y-3">
              {geoData.competitive_regions.slice(0, 5).map((region, index) => (
                <div key={index} className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-3 h-3 text-amber-600" />
                    <span className="text-sm font-medium text-slate-700">
                      {region.country}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-blue-600">{region.termA_value}</span>
                      <span className="text-slate-500">{prettyTerm(termA)}</span>
                    </div>
                    <span className="text-slate-400">vs</span>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-purple-600">{region.termB_value}</span>
                      <span className="text-slate-500">{prettyTerm(termB)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 text-center">
                    Only {Math.round(region.advantage)} point difference
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-500 italic">
          💡 Regional data shows where each term is more popular. Competitive regions have close races with less than 10-point differences.
        </p>
      </div>
    </div>
  );
}
