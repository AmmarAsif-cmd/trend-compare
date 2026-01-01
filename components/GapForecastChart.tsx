/**
 * Gap Forecast Chart Component
 * 
 * Visualizes the gap forecast (historical + forecasted gap between termA and termB)
 * Shows confidence intervals and forecast horizon
 */

'use client';

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
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import type { GapForecastResult } from '@/lib/forecasting/gap-forecaster';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

interface GapForecastChartProps {
  gapForecast: GapForecastResult;
  historicalSeries: Array<{ date: string; termA: number; termB: number }>;
  termA: string;
  termB: string;
  horizon: number;
}

function prettyTerm(t: string): string {
  return t.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function GapForecastChart({
  gapForecast,
  historicalSeries,
  termA,
  termB,
  horizon,
}: GapForecastChartProps) {
  if (!gapForecast.reliability.shouldShow) {
    return null;
  }

  // Calculate historical gap
  const historicalGap: number[] = [];
  const historicalDates: string[] = [];
  
  historicalSeries.forEach((point) => {
    const gap = point.termA - point.termB;
    historicalGap.push(gap);
    historicalDates.push(point.date);
  });

  // Generate forecast dates
  const lastHistoricalDate = new Date(historicalDates[historicalDates.length - 1]);
  const forecastDates: string[] = [];
  for (let i = 1; i <= horizon; i++) {
    const date = new Date(lastHistoricalDate);
    date.setDate(date.getDate() + i);
    forecastDates.push(date.toISOString().split('T')[0]);
  }

  // Combine historical and forecast data
  const allDates = [...historicalDates, ...forecastDates];
  const allGap: (number | null)[] = [...historicalGap, ...gapForecast.gapForecast.forecast];
  const allLower: (number | null)[] = [...Array(historicalDates.length).fill(null), ...gapForecast.gapForecast.lower];
  const allUpper: (number | null)[] = [...Array(historicalDates.length).fill(null), ...gapForecast.gapForecast.upper];

  const splitIndex = historicalDates.length;

  const chartData = {
    labels: allDates,
    datasets: [
      // Confidence band (upper)
      {
        label: 'Upper Confidence (90th percentile)',
        data: allUpper,
        borderColor: 'rgba(59, 130, 246, 0.3)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 1,
        borderDash: [5, 5],
        fill: '+1',
        pointRadius: 0,
        pointHoverRadius: 0,
        order: 0,
      },
      // Confidence band (lower)
      {
        label: 'Lower Confidence (10th percentile)',
        data: allLower,
        borderColor: 'rgba(59, 130, 246, 0.3)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 1,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0,
        order: 0,
      },
      // Forecast line
      {
        label: 'Forecast (Future)',
        data: allGap.map((val, idx) => idx >= splitIndex ? val : null),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        borderDash: [10, 5],
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBorderWidth: 2,
        order: 1,
      },
      // Historical gap line
      {
        label: 'Past Performance',
        data: allGap.map((val, idx) => idx < splitIndex ? val : null),
        borderColor: 'rgb(51, 65, 85)',
        backgroundColor: 'rgba(51, 65, 85, 0.1)',
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBorderWidth: 2,
        order: 2,
      },
      // Zero line (tie line)
      {
        label: 'Tie (Equal Popularity)',
        data: allDates.map(() => 0),
        borderColor: 'rgba(148, 163, 184, 0.6)',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [5, 5],
        pointRadius: 0,
        order: 3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (value === null) return null;
            return `${label}: ${value.toFixed(1)} points`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 10,
          },
        },
      },
      y: {
        title: {
          display: true,
          text: 'Difference (points)',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        ticks: {
          callback: function(value: any) {
            const val = Number(value);
            if (val === 0) return 'Tied';
            return val > 0 ? `+${val}` : val.toString();
          },
        },
      },
    },
  };

  // Determine trend direction
  const currentGap = gapForecast.currentGap;
  const expectedGap = gapForecast.expectedGap;
  const trendDirection = expectedGap > currentGap ? 'increasing' : expectedGap < currentGap ? 'decreasing' : 'stable';

  // Determine which term is currently leading and expected to lead
  const currentLeader = currentGap > 0 ? termA : currentGap < 0 ? termB : 'tie';
  const expectedLeader = expectedGap > 0 ? termA : expectedGap < 0 ? termB : 'tie';
  const leaderWillChange = currentLeader !== expectedLeader && currentLeader !== 'tie' && expectedLeader !== 'tie';
  
  // Calculate how the gap is changing
  const gapChange = expectedGap - currentGap;
  const gapNarrowing = Math.abs(expectedGap) < Math.abs(currentGap);
  const gapWidening = Math.abs(expectedGap) > Math.abs(currentGap);

  return (
    <div className="bg-white rounded-xl border-2 border-blue-200 shadow-lg p-4 sm:p-6">
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Forecast: Who Will Lead?
            </h3>
            <p className="text-xs text-slate-600">
              How the difference between {prettyTerm(termA)} and {prettyTerm(termB)} is expected to change
            </p>
          </div>
        </div>
      </div>

      {/* Key Insight Box */}
      <div className={`mb-4 p-4 rounded-lg border-2 ${
        leaderWillChange 
          ? 'bg-amber-50 border-amber-300' 
          : currentLeader === termA || currentLeader === termB
          ? gapNarrowing 
            ? 'bg-blue-50 border-blue-300'
            : 'bg-green-50 border-green-300'
          : 'bg-slate-50 border-slate-300'
      }`}>
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900 mb-1">
              {leaderWillChange ? (
                <>⚠️ Forecast suggests {prettyTerm(expectedLeader)} may overtake {prettyTerm(currentLeader === termA ? termB : termA)}</>
              ) : currentLeader === 'tie' ? (
                <>📊 Currently tied - Forecast shows {prettyTerm(expectedLeader)} may pull ahead</>
              ) : gapNarrowing ? (
                <>📉 The lead is narrowing - {prettyTerm(currentLeader)}'s advantage is shrinking</>
              ) : gapWidening ? (
                <>📈 The lead is widening - {prettyTerm(currentLeader)} is extending its advantage</>
              ) : (
                <>✅ {prettyTerm(currentLeader)} is expected to maintain the lead</>
              )}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Current leader: <strong>{prettyTerm(currentLeader === 'tie' ? 'Tied' : currentLeader)}</strong> 
              {currentLeader !== 'tie' && ` (${Math.abs(currentGap).toFixed(1)} point lead)`}
              {gapChange !== 0 && (
                <> • Forecast: {Math.abs(gapChange).toFixed(1)} point {gapChange > 0 ? 'increase' : 'decrease'} in gap</>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="h-80 mb-4">
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Simplified Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-600 mb-1 font-medium">Current Situation</p>
          <p className={`text-xl font-bold mb-1 ${
            currentGap > 0 ? 'text-blue-600' : currentGap < 0 ? 'text-purple-600' : 'text-slate-600'
          }`}>
            {currentLeader === 'tie' ? 'Tied' : prettyTerm(currentLeader)} Leads
          </p>
          <p className="text-xs text-slate-500">
            {currentLeader !== 'tie' && `${Math.abs(currentGap).toFixed(1)} point advantage`}
          </p>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-slate-600 mb-1 font-medium">Forecast</p>
          <p className={`text-xl font-bold mb-1 ${
            expectedGap > 0 ? 'text-blue-600' : expectedGap < 0 ? 'text-purple-600' : 'text-slate-600'
          }`}>
            {expectedLeader === 'tie' ? 'May Tie' : prettyTerm(expectedLeader)} Expected
          </p>
          <p className="text-xs text-slate-500">
            {expectedLeader !== 'tie' && `${Math.abs(expectedGap).toFixed(1)} point lead expected`}
          </p>
        </div>
        <div className="text-center p-3 bg-amber-50 rounded-lg">
          <p className="text-xs text-slate-600 mb-1 font-medium">Lead Change Risk</p>
          <p className="text-xl font-bold mb-1 text-amber-700">
            {gapForecast.leadChangeRisk.toFixed(0)}%
          </p>
          <p className="text-xs text-slate-500">
            {gapForecast.leadChangeRisk < 20 ? 'Low risk' : 
             gapForecast.leadChangeRisk < 50 ? 'Moderate risk' : 
             'High risk'} of leader change
          </p>
        </div>
      </div>

      {/* User-Friendly Explanation */}
      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <p className="text-xs font-semibold text-slate-900 mb-2">💡 What This Forecast Means:</p>
        <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
          <li>
            <strong>Above the zero line:</strong> {prettyTerm(termA)} is leading (more popular)
          </li>
          <li>
            <strong>Below the zero line:</strong> {prettyTerm(termB)} is leading (more popular)
          </li>
          <li>
            <strong>The shaded area:</strong> Shows the likely range of outcomes (90% confidence)
          </li>
          <li>
            <strong>Lead change risk:</strong> Probability that the current leader will change within the forecast period
          </li>
        </ul>
      </div>
    </div>
  );
}

