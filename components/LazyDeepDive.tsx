'use client';

/**
 * Lazy-loading Deep Dive Sections
 * Loads expensive sections (forecast, geographic, AI insights) on demand
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import GeographicBreakdown from './GeographicBreakdown';
import ForecastSection from './ForecastSection';
import AIPeakExplanations from './AI/AIPeakExplanations';

interface LazyDeepDiveProps {
  slug: string;
  termA: string;
  termB: string;
  timeframe: string;
  geo: string;
  series: any[];
  forecastGuardrail?: { shouldShow: boolean; reason?: string };
  trustStats?: {
    totalEvaluated: number;
    winnerAccuracyPercent: number | null;
    intervalCoveragePercent: number | null;
    last90DaysAccuracy: number | null;
    sampleSize: number;
  } | null;
}

export default function LazyDeepDive({
  slug,
  termA,
  termB,
  timeframe,
  geo,
  series,
  forecastGuardrail,
  trustStats,
}: LazyDeepDiveProps) {
  const searchParams = useSearchParams();
  const [sections, setSections] = useState<{
    geographic?: any;
    forecast?: any;
    ai?: any;
  }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load deep dive sections when component mounts (lazy load)
    const loadSections = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          slug,
          tf: timeframe,
          geo,
          sections: 'geographic,forecast,ai',
        });

        const response = await fetch(`/api/comparison/deepdive-lazy?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to load deep dive sections');
        }

        const data = await response.json();
        console.log('[LazyDeepDive] Loaded sections:', {
          hasGeographic: !!data.geographic,
          hasForecast: !!data.forecast,
          hasAI: !!data.ai,
          geographicKeys: data.geographic ? Object.keys(data.geographic) : null,
        });
        setSections(data);
      } catch (err: any) {
        console.error('[LazyDeepDive] Error loading sections:', err);
        setError(err.message || 'Failed to load sections');
      } finally {
        setLoading(false);
      }
    };

    loadSections();
  }, [slug, timeframe, geo]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-sm text-slate-600">Loading detailed analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800">
          Some sections could not be loaded. Please refresh the page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Geographic Breakdown - Always render, component handles empty data */}
      {sections.geographic !== undefined && sections.geographic !== null ? (
        <GeographicBreakdown
          termA={termA}
          termB={termB}
          geoData={sections.geographic}
        />
      ) : !loading ? (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-center">
          <p className="text-sm text-slate-600">
            Geographic data is being loaded or is not available for this comparison.
          </p>
        </div>
      ) : null}

      {/* Forecast Section */}
      {sections.forecast && forecastGuardrail?.shouldShow && (
        <ForecastSection
          termA={termA}
          termB={termB}
          series={series}
          forecastPack={sections.forecast}
          trustStats={trustStats || null}
        />
      )}

      {/* AI Peak Explanations */}
      {sections.ai?.peakExplanations && (
        <AIPeakExplanations
          termA={termA}
          termB={termB}
          peakExplanations={sections.ai.peakExplanations}
        />
      )}

      {/* Why This Comparison Matters */}
      {sections.ai?.whyThisMatters && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-gradient-to-b from-slate-500 to-slate-600 rounded-full" />
            Why This Comparison Matters
          </h3>
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
            {sections.ai.whyThisMatters}
          </p>
        </div>
      )}
    </div>
  );
}

