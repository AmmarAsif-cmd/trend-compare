'use client';

import { TrendingUp, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';

type Props = {
  slug: string;
  termA: string;
  termB: string;
};

export default function PredictionAccuracyBadge({ slug, termA, termB }: Props) {
  const [stats, setStats] = useState<{
    totalPredictions: number;
    verifiedPredictions: number;
    averageAccuracy: number;
    accuracyByMethod: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    // Fetch prediction stats
    fetch(`/api/predictions/stats`)
      .then(res => res.json())
      .then(data => {
        if (data.totalPredictions > 0) {
          setStats(data);
        }
      })
      .catch(err => console.warn('Failed to load prediction stats:', err));
  }, []);

  if (!stats || stats.verifiedPredictions < 10) {
    // Need at least 10 verified predictions to show accuracy
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-green-500 rounded-lg flex-shrink-0">
          <CheckCircle2 className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-green-900 mb-1">
            Prediction Model Accuracy
          </h3>
          <p className="text-xs sm:text-sm text-green-800 mb-2">
            Our predictions have been verified against actual data: <strong>{stats.averageAccuracy.toFixed(1)}% accurate</strong> on average
            ({stats.verifiedPredictions} predictions verified)
          </p>
          {stats.averageAccuracy >= 75 && (
            <div className="flex items-center gap-1.5 text-xs text-green-700">
              <TrendingUp className="w-4 h-4" />
              <span>High accuracy - our statistical models are performing well!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


