"use client";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend
} from "chart.js";
import type { SeriesPoint } from "@/lib/trends";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function TrendChart({ series }: { series: SeriesPoint[] }) {
  if (!series?.length) return null;

  const labels = series.map(p => p.date);
  const terms = Object.keys(series[0]).filter(k => k !== "date");

  const datasets = terms.map((t) => ({
    label: t,
    data: series.map(p => Number(p[t] as number)), // ensure numbers for chart.js
    borderWidth: 2,
    fill: false,
  }));

  return (
    <Line
      data={{ labels, datasets }}
      options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }}
      height={300}
    />
  );
}
