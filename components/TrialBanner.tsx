'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TrialStatus {
  isInTrial: boolean;
  daysRemaining: number;
  isPremium: boolean;
}

export function TrialBanner() {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/user/trial-status')
      .then(res => res.json())
      .then(data => setTrialStatus(data))
      .catch(() => setTrialStatus(null));
  }, []);

  if (!trialStatus || trialStatus.isPremium || !trialStatus.isInTrial) {
    return null;
  }

  const { daysRemaining } = trialStatus;
  const isLastDay = daysRemaining <= 1;
  const isLastThreeDays = daysRemaining <= 3;

  return (
    <div
      className={`
        sticky top-0 z-50 px-4 py-3 text-center text-sm font-medium
        ${isLastDay ? 'bg-red-500 text-white' : isLastThreeDays ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'}
      `}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
        <div className="flex-1 text-left">
          {isLastDay ? (
            <span className="font-bold">🎉 Last day of trial - Premium access continues automatically!</span>
          ) : (
            <span>
              ✨ Premium trial active: <strong>{daysRemaining} days</strong> to explore all features - Premium access continues after trial
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => router.push('/account')}
            className="px-4 py-1.5 bg-white text-gray-900 rounded-md hover:bg-gray-100 font-semibold text-sm transition-colors"
          >
            View Account
          </button>
          {!isLastDay && (
            <button
              onClick={() => setTrialStatus(null)}
              className="px-2 text-white/80 hover:text-white"
              aria-label="Dismiss"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
