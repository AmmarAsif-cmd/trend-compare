"use client";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler
} from "chart.js";
import type { SeriesPoint } from "@/lib/trends";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const chartColors = [
  {
    border: "rgb(59, 130, 246)", // blue-500
    background: "rgba(59, 130, 246, 0.1)",
    point: "rgb(37, 99, 235)", // blue-600
  },
  {
    border: "rgb(168, 85, 247)", // purple-500
    background: "rgba(168, 85, 247, 0.1)",
    point: "rgb(147, 51, 234)", // purple-600
  },
];

export default function TrendChart({ series }: { series: SeriesPoint[] }) {
  if (!series?.length) return null;

  const labels = series.map(p => p.date);
  const terms = Object.keys(series[0]).filter(k => k !== "date");

  const datasets = terms.map((t, idx) => {
    const colors = chartColors[idx % chartColors.length];
    return {
      label: t,
      data: series.map(p => Number(p[t] as number)),
      borderColor: colors.border,
      backgroundColor: colors.background,
      borderWidth: 3,
      fill: true,
      tension: 0.4, // smooth curves
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: colors.point,
      pointHoverBorderColor: "#ffffff",
      pointHoverBorderWidth: 2,
    };
  });

  return (
    <div className="relative w-full">
      <Line
        data={{ labels, datasets }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: "index",
            intersect: false,
          },
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                padding: 16,
                font: {
                  size: 13,
                  weight: 600,
                  family: "system-ui, -apple-system, sans-serif",
                },
                color: "#334155", // slate-700
                usePointStyle: true,
                pointStyle: "circle",
              },
            },
            tooltip: {
              enabled: true,
              backgroundColor: "rgba(15, 23, 42, 0.95)", // slate-900 with opacity
              titleColor: "#f1f5f9", // slate-100
              bodyColor: "#e2e8f0", // slate-200
              padding: 12,
              borderColor: "rgba(148, 163, 184, 0.3)", // slate-400
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
            },
          },
          scales: {
            x: {
              grid: {
                display: false,
              },
              ticks: {
                color: "#64748b", // slate-500
                font: {
                  size: 11,
                  weight: 500,
                },
                maxRotation: 45,
                minRotation: 0,
              },
            },
            y: {
              beginAtZero: true,
              max: 100,
              border: {
                display: false,
              },
              grid: {
                color: "rgba(226, 232, 240, 0.5)", // slate-200
              },
              ticks: {
                color: "#64748b", // slate-500
                font: {
                  size: 11,
                  weight: 500,
                },
                padding: 8,
              },
            },
          },
          animation: {
            duration: 1000,
            easing: "easeInOutCubic",
          },
        }}
        height={300}
      />
    </div>
  );
}
