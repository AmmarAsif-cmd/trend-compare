"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import type { ParsedKeepaData } from "@/lib/services/keepa/types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Props {
  data: ParsedKeepaData;
}

export default function PriceHistoryChart({ data }: Props) {
  if (!data.priceHistory || data.priceHistory.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No price history available
      </div>
    );
  }

  // Prepare chart data
  const labels = data.priceHistory.map((point) =>
    point.date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
  );

  const prices = data.priceHistory.map((point) => point.price);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Price ($)",
        data: prices,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += "$" + context.parsed.y.toFixed(2);
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function (value: any) {
            return "$" + value;
          },
        },
      },
    },
  };

  return (
    <div className="h-80">
      <Line data={chartData} options={options} />
    </div>
  );
}
