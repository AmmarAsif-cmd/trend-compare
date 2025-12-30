'use client';

import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Info, 
  BarChart3,
  Shield,
  Zap
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

interface ForecastPoint {
  date: string;
  value: number;
  lower80: number;
  upper80: number;
  lower95: number;
  upper95: number;
}

interface ForecastResult {
  points: ForecastPoint[];
  model: 'ets' | 'arima' | 'naive';
  metrics: {
    mae: number;
    mape: number;
    intervalCoverage80: number;
    intervalCoverage95: number;
    sampleSize: number;
  };
  confidenceScore: number;
  qualityFlags: {
    seriesTooShort: boolean;
    tooSpiky: boolean;
    eventShockLikely: boolean;
  };
}

interface HeadToHeadForecast {
  winnerProbability: number;
  expectedMarginPoints: number;
  leadChangeRisk: 'low' | 'medium' | 'high';
  currentMargin: number;
  forecastHorizon: number;
}

interface ForecastPack {
  termA: ForecastResult;
  termB: ForecastResult;
  headToHead: HeadToHeadForecast;
  computedAt: string;
  horizon: number;
}

interface Props {
  termA: string;
  termB: string;
  series: Array<{ date: string; [key: string]: number | string }>;
  forecastPack: ForecastPack | null;
  trustStats?: {
    totalEvaluated: number;
    winnerAccuracyPercent: number | null;
    intervalCoveragePercent: number | null;
    last90DaysAccuracy: number | null;
    sampleSize: number;
  } | null;
}

export default function ForecastSection({ 
  termA, 
  termB, 
  series, 
  forecastPack,
  trustStats 
}: Props) {
  const [show95Interval, setShow95Interval] = useState(false);

  if (!forecastPack) {
    return null;
  }

  const prettyTerm = (term: string) => term.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  // Sort series by date to ensure proper ordering
  const sortedSeries = [...series].sort((a, b) => a.date.localeCompare(b.date));
  
  // Find matching keys in series (same logic as forecast-pack.ts)
  const firstPoint = sortedSeries[0];
  const availableKeys = firstPoint ? Object.keys(firstPoint).filter(k => k !== 'date') : [];
  const normalizeKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const findMatchingKey = (term: string): string | null => {
    const termNormalized = normalizeKey(term);
    return availableKeys.find(k => {
      const keyNormalized = normalizeKey(k);
      return (
        k.toLowerCase() === term.toLowerCase() ||
        keyNormalized === termNormalized ||
        k.toLowerCase().replace(/\s+/g, '-') === term.toLowerCase() ||
        k.toLowerCase().replace(/-/g, ' ') === term.toLowerCase()
      );
    }) || availableKeys[0] || null;
  };
  
  const termAKey = findMatchingKey(termA);
  const termBKey = findMatchingKey(termB);
  
  if (!termAKey || !termBKey) {
    // Silently return null if keys not found (data issue, not user-facing error)
    return null;
  }
  
  // Combine historical and forecast data
  const historicalDates = sortedSeries.map(p => p.date);
  const historicalValuesA = sortedSeries.map(p => Number(p[termAKey] || 0));
  const historicalValuesB = sortedSeries.map(p => Number(p[termBKey] || 0));

  const forecastDates = forecastPack.termA.points.map(p => p.date);
  const forecastValuesA = forecastPack.termA.points.map(p => p.value);
  const forecastValuesB = forecastPack.termB.points.map(p => p.value);
  
  // Get the last historical date to ensure smooth transition
  const lastHistoricalDate = historicalDates[historicalDates.length - 1];
  const firstForecastDate = forecastDates[0];
  
  // Combine dates, ensuring no duplicates
  const allDates = [...historicalDates];
  if (firstForecastDate && firstForecastDate !== lastHistoricalDate) {
    allDates.push(...forecastDates);
  } else if (firstForecastDate === lastHistoricalDate) {
    // Skip first forecast date if it matches last historical
    allDates.push(...forecastDates.slice(1));
  }
  
  // Create data arrays aligned with allDates
  const allValuesA: (number | null)[] = [];
  const allValuesB: (number | null)[] = [];
  const allLower80A: (number | null)[] = [];
  const allUpper80A: (number | null)[] = [];
  const allLower95A: (number | null)[] = [];
  const allUpper95A: (number | null)[] = [];
  const allLower80B: (number | null)[] = [];
  const allUpper80B: (number | null)[] = [];
  const allLower95B: (number | null)[] = [];
  const allUpper95B: (number | null)[] = [];
  
  // Map historical data
  for (let i = 0; i < allDates.length; i++) {
    const date = allDates[i];
    const histIdx = historicalDates.indexOf(date);
    
    if (histIdx >= 0) {
      // Historical data point
      allValuesA.push(historicalValuesA[histIdx]);
      allValuesB.push(historicalValuesB[histIdx]);
      allLower80A.push(null);
      allUpper80A.push(null);
      allLower95A.push(null);
      allUpper95A.push(null);
      allLower80B.push(null);
      allUpper80B.push(null);
      allLower95B.push(null);
      allUpper95B.push(null);
    } else {
      // Forecast data point
      const forecastIdx = forecastDates.indexOf(date);
      if (forecastIdx >= 0) {
        allValuesA.push(forecastValuesA[forecastIdx]);
        allValuesB.push(forecastValuesB[forecastIdx]);
        allLower80A.push(forecastPack.termA.points[forecastIdx].lower80);
        allUpper80A.push(forecastPack.termA.points[forecastIdx].upper80);
        allLower95A.push(forecastPack.termA.points[forecastIdx].lower95);
        allUpper95A.push(forecastPack.termA.points[forecastIdx].upper95);
        allLower80B.push(forecastPack.termB.points[forecastIdx].lower80);
        allUpper80B.push(forecastPack.termB.points[forecastIdx].upper80);
        allLower95B.push(forecastPack.termB.points[forecastIdx].lower95);
        allUpper95B.push(forecastPack.termB.points[forecastIdx].upper95);
      } else {
        // Fill with null if date not found
        allValuesA.push(null);
        allValuesB.push(null);
        allLower80A.push(null);
        allUpper80A.push(null);
        allLower95A.push(null);
        allUpper95A.push(null);
        allLower80B.push(null);
        allUpper80B.push(null);
        allLower95B.push(null);
        allUpper95B.push(null);
      }
    }
  }

  // Determine if forecast should be shown prominently
  const isExperimental = 
    forecastPack.termA.qualityFlags.seriesTooShort ||
    forecastPack.termA.qualityFlags.tooSpiky ||
    forecastPack.termB.qualityFlags.seriesTooShort ||
    forecastPack.termB.qualityFlags.tooSpiky;

  const avgConfidence = (forecastPack.termA.confidenceScore + forecastPack.termB.confidenceScore) / 2;
  const isLowConfidence = avgConfidence < 50;

  // Find the split point between historical and forecast
  const splitIndex = historicalDates.length;
  
  const datasets: any[] = [
    // Confidence band 95% - Term A (background, filled)
    {
      label: `${prettyTerm(termA)} 95% Confidence`,
      data: allLower95A.map((lower, idx) => {
        if (lower === null || idx < splitIndex) return null;
        return lower;
      }),
      borderColor: 'transparent',
      backgroundColor: 'rgba(59, 130, 246, 0.05)',
      borderWidth: 0,
      fill: '+1',
      pointRadius: 0,
      order: 0,
    },
    {
      label: `${prettyTerm(termA)} 95% Upper`,
      data: allUpper95A.map((upper, idx) => {
        if (upper === null || idx < splitIndex) return null;
        return upper;
      }),
      borderColor: 'transparent',
      backgroundColor: 'transparent',
      borderWidth: 0,
      fill: false,
      pointRadius: 0,
      order: 0,
    },
    // Confidence band 80% - Term A
    {
      label: `${prettyTerm(termA)} 80% Confidence`,
      data: allLower80A.map((lower, idx) => {
        if (lower === null || idx < splitIndex) return null;
        return lower;
      }),
      borderColor: 'rgba(59, 130, 246, 0.2)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 1,
      borderDash: [2, 2],
      fill: '+1',
      pointRadius: 0,
      order: 1,
    },
    {
      label: `${prettyTerm(termA)} 80% Upper`,
      data: allUpper80A.map((upper, idx) => {
        if (upper === null || idx < splitIndex) return null;
        return upper;
      }),
      borderColor: 'rgba(59, 130, 246, 0.2)',
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderDash: [2, 2],
      fill: false,
      pointRadius: 0,
      order: 1,
    },
    // Historical data - Term A
    {
      label: `${prettyTerm(termA)} (Historical)`,
      data: allValuesA.map((val, idx) => idx < splitIndex ? val : null),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 3,
      fill: false,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 6,
      order: 3,
      spanGaps: false,
    },
    // Forecast - Term A (includes last historical point for seamless connection)
    {
      label: `${prettyTerm(termA)} (Forecast)`,
      data: allValuesA.map((val, idx) => {
        // Include last historical point (at splitIndex - 1) as bridge
        if (idx === splitIndex - 1) return val;
        // Include all forecast points
        return idx >= splitIndex ? val : null;
      }),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 3,
      borderDash: [8, 4],
      fill: false,
      tension: 0.4,
      pointRadius: (ctx: any) => ctx.dataIndex === splitIndex - 1 ? 0 : 3, // Hide bridge point
      pointHoverRadius: 8,
      order: 3,
      spanGaps: false,
    },
    // Confidence band 95% - Term B
    {
      label: `${prettyTerm(termB)} 95% Confidence`,
      data: allLower95B.map((lower, idx) => {
        if (lower === null || idx < splitIndex) return null;
        return lower;
      }),
      borderColor: 'transparent',
      backgroundColor: 'rgba(168, 85, 247, 0.05)',
      borderWidth: 0,
      fill: '+1',
      pointRadius: 0,
      order: 0,
    },
    {
      label: `${prettyTerm(termB)} 95% Upper`,
      data: allUpper95B.map((upper, idx) => {
        if (upper === null || idx < splitIndex) return null;
        return upper;
      }),
      borderColor: 'transparent',
      backgroundColor: 'transparent',
      borderWidth: 0,
      fill: false,
      pointRadius: 0,
      order: 0,
    },
    // Confidence band 80% - Term B
    {
      label: `${prettyTerm(termB)} 80% Confidence`,
      data: allLower80B.map((lower, idx) => {
        if (lower === null || idx < splitIndex) return null;
        return lower;
      }),
      borderColor: 'rgba(168, 85, 247, 0.2)',
      backgroundColor: 'rgba(168, 85, 247, 0.1)',
      borderWidth: 1,
      borderDash: [2, 2],
      fill: '+1',
      pointRadius: 0,
      order: 1,
    },
    {
      label: `${prettyTerm(termB)} 80% Upper`,
      data: allUpper80B.map((upper, idx) => {
        if (upper === null || idx < splitIndex) return null;
        return upper;
      }),
      borderColor: 'rgba(168, 85, 247, 0.2)',
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderDash: [2, 2],
      fill: false,
      pointRadius: 0,
      order: 1,
    },
    // Historical data - Term B
    {
      label: `${prettyTerm(termB)} (Historical)`,
      data: allValuesB.map((val, idx) => idx < splitIndex ? val : null),
      borderColor: 'rgb(168, 85, 247)',
      backgroundColor: 'rgba(168, 85, 247, 0.1)',
      borderWidth: 3,
      fill: false,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 6,
      order: 3,
      spanGaps: false,
    },
    // Forecast - Term B (includes last historical point for seamless connection)
    {
      label: `${prettyTerm(termB)} (Forecast)`,
      data: allValuesB.map((val, idx) => {
        // Include last historical point (at splitIndex - 1) as bridge
        if (idx === splitIndex - 1) return val;
        // Include all forecast points
        return idx >= splitIndex ? val : null;
      }),
      borderColor: 'rgb(168, 85, 247)',
      backgroundColor: 'rgba(168, 85, 247, 0.1)',
      borderWidth: 3,
      borderDash: [8, 4],
      fill: false,
      tension: 0.4,
      pointRadius: (ctx: any) => ctx.dataIndex === splitIndex - 1 ? 0 : 3, // Hide bridge point
      pointHoverRadius: 8,
      order: 3,
      spanGaps: false,
    },
  ];

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 80) return { label: 'High Confidence', color: 'text-green-600' };
    if (score >= 60) return { label: 'Medium Confidence', color: 'text-yellow-600' };
    if (score >= 40) return { label: 'Low Confidence', color: 'text-orange-600' };
    return { label: 'Very Low Confidence', color: 'text-red-600' };
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8 mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Forecast and Reliability
          </h2>
          <p className="text-sm text-slate-600">
            {forecastPack.horizon}-day forecast using {forecastPack.termA.model.toUpperCase()} and {forecastPack.termB.model.toUpperCase()} models
          </p>
        </div>
        {isExperimental && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">Experimental Forecast</span>
          </div>
        )}
      </div>

      {/* Forecast Chart */}
      <div className="mb-6" style={{ height: '400px', position: 'relative' }}>
        <Line
          data={{
            labels: allDates.map(date => {
              const d = new Date(date);
              return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            datasets,
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: 'index',
              intersect: false,
            },
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 12,
                  font: { size: 12, family: 'inherit' },
                  usePointStyle: true,
                  filter: (legendItem) => {
                    // Hide confidence band labels from legend
                    const label = legendItem.text || '';
                    return !label.includes('Confidence') && !label.includes('Upper');
                  },
                },
              },
              tooltip: {
                enabled: true,
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#f1f5f9',
                bodyColor: '#e2e8f0',
                padding: 12,
                borderColor: 'rgba(148, 163, 184, 0.3)',
                borderWidth: 1,
                cornerRadius: 8,
                filter: (tooltipItem) => {
                  // Hide confidence band labels from tooltip
                  const label = tooltipItem.dataset.label || '';
                  return !label.includes('Confidence') && !label.includes('Upper');
                },
                callbacks: {
                  label: (context) => {
                    const label = context.dataset.label || '';
                    const value = context.parsed.y;
                    if (value === null || isNaN(value)) return '';
                    
                    // Add confidence intervals for forecast points
                    if (label.includes('Forecast')) {
                      const index = context.dataIndex;
                      if (index >= splitIndex) {
                        const forecastIndex = index - splitIndex;
                        if (forecastIndex >= 0 && forecastIndex < forecastPack.termA.points.length) {
                          const isTermA = label.includes(prettyTerm(termA));
                          const point = isTermA 
                            ? forecastPack.termA.points[forecastIndex]
                            : forecastPack.termB.points[forecastIndex];
                          
                          if (point) {
                            const interval80 = `(80%: ${point.lower80.toFixed(1)} - ${point.upper80.toFixed(1)})`;
                            const interval95 = `(95%: ${point.lower95.toFixed(1)} - ${point.upper95.toFixed(1)})`;
                            return `${label}: ${value.toFixed(1)} ${show95Interval ? interval95 : interval80}`;
                          }
                        }
                      }
                    }
                    return `${label}: ${value.toFixed(1)}`;
                  },
                },
              },
            },
            scales: {
              x: {
                grid: { 
                  display: true,
                  color: 'rgba(148, 163, 184, 0.1)',
                },
                ticks: {
                  maxRotation: 45,
                  minRotation: 45,
                  font: { size: 11, family: 'inherit' },
                  color: '#64748b',
                },
                border: {
                  display: false,
                },
              },
              y: {
                beginAtZero: true,
                grid: { 
                  color: 'rgba(148, 163, 184, 0.1)',
                },
                ticks: {
                  font: { size: 11, family: 'inherit' },
                  color: '#64748b',
                },
                border: {
                  display: false,
                },
              },
            },
          }}
        />
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Winner Probability */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-4 flex flex-col items-center text-center">
          <div className="p-3 rounded-full bg-purple-100 text-purple-600 mb-2">
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-purple-800 mb-1">
            {forecastPack.headToHead.winnerProbability.toFixed(1)}%
          </p>
          <p className="text-sm text-purple-700 font-medium">Winner Probability</p>
          <p className="text-xs text-purple-600 mt-1">
            {forecastPack.headToHead.winnerProbability > 50
              ? `${prettyTerm(forecastPack.headToHead.expectedMarginPoints > 0 ? termB : termA)} favored`
              : forecastPack.headToHead.winnerProbability < 50
              ? `${prettyTerm(forecastPack.headToHead.expectedMarginPoints < 0 ? termA : termB)} favored`
              : 'Evenly matched'}
          </p>
        </div>

        {/* Expected Margin */}
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border border-pink-200 p-4 flex flex-col items-center text-center">
          <div className="p-3 rounded-full bg-pink-100 text-pink-600 mb-2">
            <BarChart3 className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-pink-800 mb-1">
            {Math.abs(forecastPack.headToHead.expectedMarginPoints).toFixed(1)}
          </p>
          <p className="text-sm text-pink-700 font-medium">Expected Margin</p>
          <p className="text-xs text-pink-600 mt-1">
            {forecastPack.headToHead.expectedMarginPoints > 0
              ? `${prettyTerm(termB)} leading`
              : forecastPack.headToHead.expectedMarginPoints < 0
              ? `${prettyTerm(termA)} leading`
              : 'No clear lead'}
          </p>
        </div>

        {/* Lead Change Risk */}
        <div className={`rounded-xl border p-4 flex flex-col items-center text-center ${getRiskColor(forecastPack.headToHead.leadChangeRisk)}`}>
          <div className={`p-3 rounded-full mb-2 ${
            forecastPack.headToHead.leadChangeRisk === 'low' ? 'bg-green-100 text-green-600' :
            forecastPack.headToHead.leadChangeRisk === 'medium' ? 'bg-yellow-100 text-yellow-600' :
            'bg-red-100 text-red-600'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold mb-1 capitalize">
            {forecastPack.headToHead.leadChangeRisk}
          </p>
          <p className="text-sm font-medium">Lead Change Risk</p>
          <p className="text-xs mt-1">
            {forecastPack.headToHead.leadChangeRisk === 'high'
              ? 'High volatility expected'
              : forecastPack.headToHead.leadChangeRisk === 'medium'
              ? 'Moderate volatility expected'
              : 'Stable trend expected'}
          </p>
        </div>

        {/* Confidence Score */}
        <div className={`rounded-xl border p-4 flex flex-col items-center text-center ${
          avgConfidence >= 80 ? 'bg-green-50 border-green-200' :
          avgConfidence >= 60 ? 'bg-yellow-50 border-yellow-200' :
          avgConfidence >= 40 ? 'bg-orange-50 border-orange-200' :
          'bg-red-50 border-red-200'
        }`}>
          <div className={`p-3 rounded-full mb-2 ${
            avgConfidence >= 80 ? 'bg-green-100 text-green-600' :
            avgConfidence >= 60 ? 'bg-yellow-100 text-yellow-600' :
            avgConfidence >= 40 ? 'bg-orange-100 text-orange-600' :
            'bg-red-100 text-red-600'
          }`}>
            <Shield className="w-5 h-5" />
          </div>
          <p className={`text-3xl font-bold mb-1 ${
            avgConfidence >= 80 ? 'text-green-800' :
            avgConfidence >= 60 ? 'text-yellow-800' :
            avgConfidence >= 40 ? 'text-orange-800' :
            'text-red-800'
          }`}>
            {avgConfidence.toFixed(0)}%
          </p>
          <p className="text-sm font-medium">Overall Confidence</p>
          <p className={`text-xs mt-1 ${
            avgConfidence >= 80 ? 'text-green-700' :
            avgConfidence >= 60 ? 'text-yellow-700' :
            avgConfidence >= 40 ? 'text-orange-700' :
            'text-red-700'
          }`}>
            {getConfidenceLabel(avgConfidence).label}
          </p>
        </div>
      </div>

      {/* Trust Stats */}
      {trustStats && trustStats.totalEvaluated > 0 && (
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                Trust Statistics
                <button
                  className="text-slate-400 hover:text-slate-600"
                  title="Based on backtesting of past forecasts. 'Successful' means correct winner prediction and actual values within confidence intervals."
                >
                  <Info className="w-4 h-4" />
                </button>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {trustStats.winnerAccuracyPercent !== null && (
                  <div>
                    <div className="text-slate-600 text-xs mb-1">Winner Accuracy</div>
                    <div className="font-bold text-slate-900">
                      {trustStats.winnerAccuracyPercent.toFixed(1)}%
                    </div>
                  </div>
                )}
                {trustStats.intervalCoveragePercent !== null && (
                  <div>
                    <div className="text-slate-600 text-xs mb-1">Interval Coverage</div>
                    <div className="font-bold text-slate-900">
                      {trustStats.intervalCoveragePercent.toFixed(1)}%
                    </div>
                  </div>
                )}
                {trustStats.last90DaysAccuracy !== null && (
                  <div>
                    <div className="text-slate-600 text-xs mb-1">Last 90 Days</div>
                    <div className="font-bold text-slate-900">
                      {trustStats.last90DaysAccuracy.toFixed(1)}%
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-slate-600 text-xs mb-1">Sample Size</div>
                  <div className="font-bold text-slate-900">
                    {trustStats.sampleSize} forecasts
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disclosure Text */}
      {(isLowConfidence || isExperimental) && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 mb-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p>
            Forecasts are short-term projections based on recent patterns. Sudden news events can change trends quickly.
            {isExperimental && " This is an experimental forecast due to limited or volatile data."}
            {isLowConfidence && ` Confidence score is ${avgConfidence.toFixed(0)}/100, indicating higher uncertainty.`}
          </p>
        </div>
      )}

      {/* Model Details */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8">
        <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-slate-600" />
          Model Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-slate-800 mb-2">{prettyTerm(termA)} Model: {forecastPack.termA.model.toUpperCase()}</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>MAE: {forecastPack.termA.metrics.mae.toFixed(2)}</li>
              <li>MAPE: {forecastPack.termA.metrics.mape.toFixed(2)}%</li>
              <li>80% Interval Coverage: {forecastPack.termA.metrics.intervalCoverage80.toFixed(1)}%</li>
              <li>95% Interval Coverage: {forecastPack.termA.metrics.intervalCoverage95.toFixed(1)}%</li>
              <li>Backtest Sample Size: {forecastPack.termA.metrics.sampleSize}</li>
              {forecastPack.termA.qualityFlags.seriesTooShort && <li><span className="text-yellow-600">Warning: Series too short</span></li>}
              {forecastPack.termA.qualityFlags.tooSpiky && <li><span className="text-yellow-600">Warning: Series too spiky</span></li>}
              {forecastPack.termA.qualityFlags.eventShockLikely && <li><span className="text-yellow-600">Warning: Event shock likely</span></li>}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 mb-2">{prettyTerm(termB)} Model: {forecastPack.termB.model.toUpperCase()}</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>MAE: {forecastPack.termB.metrics.mae.toFixed(2)}</li>
              <li>MAPE: {forecastPack.termB.metrics.mape.toFixed(2)}%</li>
              <li>80% Interval Coverage: {forecastPack.termB.metrics.intervalCoverage80.toFixed(1)}%</li>
              <li>95% Interval Coverage: {forecastPack.termB.metrics.intervalCoverage95.toFixed(1)}%</li>
              <li>Backtest Sample Size: {forecastPack.termB.metrics.sampleSize}</li>
              {forecastPack.termB.qualityFlags.seriesTooShort && <li><span className="text-yellow-600">Warning: Series too short</span></li>}
              {forecastPack.termB.qualityFlags.tooSpiky && <li><span className="text-yellow-600">Warning: Series too spiky</span></li>}
              {forecastPack.termB.qualityFlags.eventShockLikely && <li><span className="text-yellow-600">Warning: Event shock likely</span></li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

