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

  const isOut = limitStatus.remaining === 0;

  // Show banner after they've used their 1 free comparison
  if (isOut) {
    return (
      <div className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 shadow-lg">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="text-center sm:text-left">
              <p className="font-bold">Want to see more comparisons?</p>
              <p className="text-sm text-white/90">Sign up for free to get unlimited access</p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-blue-600 rounded-lg hover:bg-gray-100 font-semibold text-sm transition-all shadow-md hover:shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              Sign Up Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Don't show banner until they've used their free comparison
  return null;
}
