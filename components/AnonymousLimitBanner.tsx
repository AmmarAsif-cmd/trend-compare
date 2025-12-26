'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { TrendingUp, Sparkles, ArrowRight } from 'lucide-react';

interface LimitStatus {
  allowed: boolean;
  remaining: number;
  total: number;
  limit: number;
}

export function AnonymousLimitBanner() {
  const { data: session, status } = useSession();
  const [limitStatus, setLimitStatus] = useState<LimitStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only show for anonymous users
    if (status === 'authenticated') {
      return;
    }

    // Check if already dismissed
    const isDismissed = sessionStorage.getItem('anonymous-banner-dismissed');
    if (isDismissed) {
      setDismissed(true);
      return;
    }

    // Fetch limit status
    fetch('/api/anonymous/status')
      .then(res => res.json())
      .then(data => setLimitStatus(data))
      .catch(() => setLimitStatus(null));
  }, [status]);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('anonymous-banner-dismissed', 'true');
  };

  // Don't show if authenticated, dismissed, or no data
  if (status === 'authenticated' || dismissed || !limitStatus) {
    return null;
  }

  // Don't show if user hasn't made any comparisons yet
  if (limitStatus.total === 0) {
    return null;
  }

  const percentage = (limitStatus.remaining / limitStatus.limit) * 100;
  const isLow = limitStatus.remaining <= 2;
  const isVeryLow = limitStatus.remaining === 1;
  const isOut = limitStatus.remaining === 0;

  if (isOut) {
    return (
      <div className="sticky top-0 z-50 bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-3 shadow-lg">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="text-center sm:text-left">
              <p className="font-bold">Daily limit reached!</p>
              <p className="text-sm text-white/90">Sign up for a free 7-day trial to continue comparing</p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-red-600 rounded-lg hover:bg-gray-100 font-semibold text-sm transition-all shadow-md hover:shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      sticky top-0 z-50 px-4 py-3 text-white shadow-md
      ${isVeryLow ? 'bg-gradient-to-r from-orange-500 to-red-500' : isLow ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gradient-to-r from-slate-700 to-slate-800'}
    `}>
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold">
                {isVeryLow ? (
                  <span>Last comparison left today!</span>
                ) : (
                  <span>{limitStatus.remaining} of {limitStatus.limit} free comparisons remaining</span>
                )}
              </p>
            </div>
            <div className="w-full sm:w-64 bg-white/20 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-5 py-2 bg-white text-slate-900 rounded-lg hover:bg-gray-100 font-semibold text-sm transition-colors shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Get Free Trial
          </Link>
          <button
            onClick={handleDismiss}
            className="px-2 text-white/80 hover:text-white"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
