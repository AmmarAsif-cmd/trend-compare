/**
 * AI Prediction Component
 * Shows AI forecast for future trends
 * Designed as a standout card
 */

import { Lightbulb } from "lucide-react";

type AIPredictionProps = {
  prediction: string;
};

export default function AIPrediction({ prediction }: AIPredictionProps) {
  if (!prediction) return null;

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-700">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
        </div>
        <h3 className="font-bold text-base sm:text-lg text-white">🔮 AI Forecast</h3>
      </div>
      <p className="text-sm sm:text-base text-slate-100 leading-relaxed">
        {prediction}
      </p>
      <div className="mt-4 pt-4 border-t border-slate-700">
        <p className="text-xs text-slate-400">
          Based on historical patterns and current trajectory
        </p>
      </div>
    </div>
  );
}
