"use client";
import { Line, getElementAtEvent } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler
} from "chart.js";
import type { SeriesPoint } from "@/lib/trends";
import { useEffect, useState, useRef } from "react";
import { calculateTrendArcScore, CATEGORY_WEIGHTS } from "@/lib/trendarc-score";
import type { ComparisonCategory } from "@/lib/category-resolver";
import { Download, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const chartColors = [
  {
    border: "rgb(139, 92, 246)", // violet-500
    background: "rgba(139, 92, 246, 0.1)",
    point: "rgb(124, 58, 237)", // violet-600
  },
  {
    border: "rgb(168, 85, 247)", // purple-500
    background: "rgba(168, 85, 247, 0.1)",
    point: "rgb(147, 51, 234)", // purple-600
  },
];

interface TrendArcScoreChartProps {
  series: SeriesPoint[];
  termA: string;
  termB: string;
  category?: ComparisonCategory;
}

/**
 * Calculate TrendArc Score for each data point in the series
 * Since we only have Google Trends time-series data, we calculate
 * a simplified TrendArc Score based on search interest over time
 */
function calculateScoresOverTime(
  series: SeriesPoint[],
  termA: string,
  termB: string,
  category: ComparisonCategory = 'general'
): { dates: string[]; scoresA: number[]; scoresB: number[] } {
  // Validate series is an array
  if (!series || !Array.isArray(series) || series.length === 0) {
    console.warn('[TrendArcScoreChart] Invalid series data:', { series, type: typeof series, isArray: Array.isArray(series) });
    return { dates: [], scoresA: [], scoresB: [] };
  }

  const weights = CATEGORY_WEIGHTS[category] || CATEGORY_WEIGHTS.general;
  
  // Find matching keys in the series (handle normalized/slugified variations)
  const firstPoint = series[0];
  if (!firstPoint || typeof firstPoint !== 'object') {
    console.warn('[TrendArcScoreChart] Invalid first point in series:', firstPoint);
    return { dates: [], scoresA: [], scoresB: [] };
  }
  
  const availableKeys = Object.keys(firstPoint).filter(k => k !== 'date');
  
  // Normalize keys for matching
  const normalizeKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Find matching key for termA
  const termAKey = availableKeys.find(k => 
    k === termA ||
    k.toLowerCase() === termA.toLowerCase() ||
    normalizeKey(k) === normalizeKey(termA) ||
    k.toLowerCase().replace(/\s+/g, '-') === termA.toLowerCase() ||
    k.toLowerCase().replace(/-/g, ' ') === termA.toLowerCase()
  ) || availableKeys[0];
  
  // Find matching key for termB
  const termBKey = availableKeys.find(k => 
    (k === termB ||
    k.toLowerCase() === termB.toLowerCase() ||
    normalizeKey(k) === normalizeKey(termB) ||
    k.toLowerCase().replace(/\s+/g, '-') === termB.toLowerCase() ||
    k.toLowerCase().replace(/-/g, ' ') === termB.toLowerCase()) &&
    k !== termAKey // Make sure it's different from termA
  ) || availableKeys[1] || availableKeys[0];
  
  return series.reduce((acc, point, index) => {
    const date = point.date;
    const valueA = Number(point[termAKey] || 0);
    const valueB = Number(point[termBKey] || 0);
    
    // Validate values are finite
    if (!isFinite(valueA) || !isFinite(valueB)) {
      console.warn(`[TrendArcScoreChart] Invalid values at index ${index}:`, { valueA, valueB, termAKey, termBKey });
    }
    
    // Calculate momentum (trend direction) from recent data
    let momentumA = 50;
    let momentumB = 50;
    
    if (index > 0) {
      const prevValueA = Number(series[index - 1][termAKey] || 0);
      const prevValueB = Number(series[index - 1][termBKey] || 0);
      
      // Calculate momentum as change from previous point
      const changeA = isFinite(valueA) && isFinite(prevValueA) ? valueA - prevValueA : 0;
      const changeB = isFinite(valueB) && isFinite(prevValueB) ? valueB - prevValueB : 0;
      
      // Convert to 0-100 scale (momentum component)
      // ±1 point change = ±2 momentum points (max ±50)
      momentumA = Math.max(0, Math.min(100, 50 + (changeA * 2)));
      momentumB = Math.max(0, Math.min(100, 50 + (changeB * 2)));
    }
    
    // Calculate simplified TrendArc Score
    // Since we only have Google Trends data over time, we use:
    // - Search Interest: actual Google Trends value (40-45% weight)
    // - Social Buzz: default to 50 (no time-series data available)
    // - Authority: default to 50 (no time-series data available)
    // - Momentum: calculated from trend direction (10-15% weight)
    
    const scoreA = Math.round(
      valueA * weights.searchInterest +
      50 * weights.socialBuzz +
      50 * weights.authority +
      momentumA * weights.momentum
    );
    
    const scoreB = Math.round(
      valueB * weights.searchInterest +
      50 * weights.socialBuzz +
      50 * weights.authority +
      momentumB * weights.momentum
    );
    
    acc.dates.push(date);
    acc.scoresA.push(scoreA);
    acc.scoresB.push(scoreB);
    
    return acc;
  }, { dates: [] as string[], scoresA: [] as number[], scoresB: [] as number[] });
}

export default function TrendArcScoreChart({ series, termA, termB, category = 'general' }: TrendArcScoreChartProps) {
  const [isMobile, setIsMobile] = useState(false);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDownload = () => {
    const chart = chartRef.current;
    if (!chart) return;

    const url = chart.toBase64Image('image/png', 1);
    const link = document.createElement('a');
    link.download = `${termA}-vs-${termB}-trendarc-score.png`;
    link.href = url;
    link.click();
  };

  if (!series?.length) return null;

  const { dates, scoresA, scoresB } = calculateScoresOverTime(series, termA, termB, category);
  
  const prettyTerm = (term: string) => term.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const datasets = [
    {
      label: prettyTerm(termA),
      data: scoresA,
      borderColor: chartColors[0].border,
      backgroundColor: chartColors[0].background,
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: chartColors[0].point,
      pointHoverBorderColor: "#ffffff",
      pointHoverBorderWidth: 2,
    },
    {
      label: prettyTerm(termB),
      data: scoresB,
      borderColor: chartColors[1].border,
      backgroundColor: chartColors[1].background,
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: chartColors[1].point,
      pointHoverBorderColor: "#ffffff",
      pointHoverBorderWidth: 2,
    },
  ];

  return (
    <div className="relative w-full">
      {/* Chart Controls */}
      <div className="flex items-center justify-end gap-2 mb-2">
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors"
          title="Download chart as PNG"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Download</span>
        </button>
      </div>

      <div style={{ minHeight: isMobile ? '250px' : '300px', height: isMobile ? '250px' : '400px' }}>
        <Line
          ref={chartRef}
          data={{ labels: dates, datasets }}
          options={{
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: isMobile ? 1.5 : 2,
          interaction: {
            mode: "index",
            intersect: false,
          },
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                padding: isMobile ? 8 : 12,
                font: {
                  size: isMobile ? 11 : 13,
                  weight: 600,
                  family: "system-ui, -apple-system, sans-serif",
                },
                color: "#334155",
                usePointStyle: true,
                pointStyle: "circle",
                boxWidth: isMobile ? 8 : 12,
              },
            },
            tooltip: {
              enabled: true,
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              titleColor: "#f1f5f9",
              bodyColor: "#e2e8f0",
              padding: 12,
              borderColor: "rgba(148, 163, 184, 0.3)",
              borderWidth: 1,
              cornerRadius: 8,
              titleFont: {
                size: 13,
                weight: 600,
              },
              bodyFont: {
                size: 12,
                weight: 500,
              },
              displayColors: true,
              boxPadding: 6,
              usePointStyle: true,
              callbacks: {
                label: (context) => {
                  return `${context.dataset.label}: ${context.parsed.y} (TrendArc Score)`;
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
                color: "#64748b",
                font: {
                  size: isMobile ? 9 : 11,
                  weight: 500,
                },
                maxRotation: isMobile ? 90 : 45,
                minRotation: isMobile ? 90 : 0,
              },
            },
            y: {
              beginAtZero: true,
              max: 100,
              border: {
                display: false,
              },
              grid: {
                color: "rgba(226, 232, 240, 0.5)",
              },
              ticks: {
                color: "#64748b",
                font: {
                  size: isMobile ? 9 : 11,
                  weight: 500,
                },
                padding: isMobile ? 4 : 8,
                callback: (value) => {
                  return `${value}%`;
                },
              },
            },
          },
          animation: {
            duration: 1000,
            easing: "easeInOutCubic",
          },
          }}
          height={isMobile ? 250 : 300}
        />
      </div>
    </div>
  );
}

