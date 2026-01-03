'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Infinity as InfinityIcon } from 'lucide-react';

type LimitStatus = {
  allowed: boolean;
  remaining: number;
  limit: number;
  count: number;
  message: string;
  showUpgrade: boolean;
};

export default function DailyLimitStatus() {
  const [status, setStatus] = useState<LimitStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLimit() {
      try {
        const response = await fetch('/api/comparisons/limit');
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        }
      } catch (error) {
        console.error('Error fetching limit:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLimit();
  }, []);

  if (loading || !status) {
    return null; // Don't show anything while loading
  }

  // Premium users - show nothing or a subtle badge
  if (status.remaining === Infinity) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <InfinityIcon className="w-4 h-4" />
        <span>Unlimited</span>
      </div>
    );
  }

  // Free users - show status
  const isLow = status.remaining <= 10;
  const isExhausted = status.remaining === 0;

  if (isExhausted) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-900">
            Daily limit reached ({status.limit} comparisons/day)
          </p>
          <p className="text-xs text-red-700 mt-1">
            Sign up for unlimited access
          </p>
        </div>
      </div>
    );
  }

  if (isLow) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-900">
            {status.remaining} comparisons remaining today
          </p>
        </div>
      </div>
    );
  }

  // Normal status - subtle display
  return (
    <div className="flex items-center gap-2 text-xs text-slate-600">
      <span>{status.remaining} remaining today</span>
    </div>
  );
}

