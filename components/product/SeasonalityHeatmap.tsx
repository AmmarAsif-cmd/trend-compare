
import { Calendar, TrendingUp, Info } from "lucide-react";
import type { SeriesPoint } from "@/lib/trends";

interface Props {
    series: SeriesPoint[];
}

export default function SeasonalityHeatmap({ series }: Props) {
    // 1. Process data to get monthly averages
    // We assume series is 12 months of weekly/daily data
    const monthlyData: { [key: number]: number[] } = {};

    // Initialize buckets
    for (let i = 0; i < 12; i++) {
        monthlyData[i] = [];
    }

    series.forEach((point) => {
        let dateObj: Date;
        if ('date' in point) {
            dateObj = new Date(point.date);
        } else if ('unix' in point) {
            dateObj = new Date(point.unix * 1000); // unix is often seconds
        } else {
            return;
        }

        // Check for valid date
        if (isNaN(dateObj.getTime())) return;

        const month = dateObj.getMonth(); // 0-11
        // Extract value
        let val = 0;
        if ('value' in point && typeof point.value === 'number') {
            val = point.value;
        } else {
            // fallback for different shapes, assume first number prop is value
            const keys = Object.keys(point);
            for (const k of keys) {
                if (k !== 'date' && k !== 'unix' && typeof (point as any)[k] === 'number') {
                    val = (point as any)[k];
                    break;
                }
            }
        }

        monthlyData[month].push(val);
    });

    // Calculate scores (0-100) per month
    const monthScores = new Array(12).fill(0);
    let maxScore = 0;

    for (let i = 0; i < 12; i++) {
        const vals = monthlyData[i];
        if (vals.length > 0) {
            const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
            monthScores[i] = avg;
            if (avg > maxScore) maxScore = avg;
        }
    }

    // Normalize relative to peak
    const normalizedScores = monthScores.map(s => maxScore > 0 ? (s / maxScore) * 100 : 0);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm h-full">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-lg">Best Time to Launch</h3>
                </div>
                <Info className="w-4 h-4 text-slate-400" />
            </div>

            <div className="p-6">
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    {months.map((monthName, i) => {
                        const score = normalizedScores[i];

                        // Color Logic
                        let colorClass = "bg-slate-50 border-slate-200 text-slate-400"; // Low (Dead)
                        let textColor = "text-slate-500";

                        if (score > 80) {
                            colorClass = "bg-emerald-500 border-emerald-600 text-white shadow-md transform scale-105"; // Peak
                            textColor = "text-white font-black";
                        } else if (score > 60) {
                            colorClass = "bg-emerald-100 border-emerald-300 text-emerald-800"; // Good
                            textColor = "text-emerald-900 font-bold";
                        } else if (score > 40) {
                            colorClass = "bg-yellow-50 border-yellow-200 text-yellow-800"; // Moderate
                            textColor = "text-yellow-900 font-medium";
                        }

                        return (
                            <div
                                key={monthName}
                                className={`relative rounded-xl border p-3 flex flex-col items-center justify-center aspect-square transition-all ${colorClass}`}
                            >
                                <span className="text-xs uppercase tracking-wider mb-1 opacity-80">{monthName}</span>
                                <span className={`text-lg ${textColor}`}>
                                    {Math.round(score)}%
                                </span>
                                {score > 80 && (
                                    <div className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 border-2 border-white shadow-sm">
                                        <TrendingUp className="w-3 h-3 text-white" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600 leading-relaxed italic">
                    Tip: Launch your product 4-6 weeks *before* the green months to capture the full trend wave.
                </div>
            </div>
        </div>
    );
}
