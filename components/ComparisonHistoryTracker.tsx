'use client';

import { useEffect } from 'react';

type Props = {
  slug: string;
  termA: string;
  termB: string;
  timeframe?: string;
  geo?: string;
};

/**
 * Client component to track comparison views in user's history
 * Runs on mount to record the view
 */
export default function ComparisonHistoryTracker({ slug, termA, termB, timeframe = '12m', geo = '' }: Props) {
  useEffect(() => {
    // Record view asynchronously (don't block page load)
    console.log('[HistoryTracker] Recording view:', { slug, termA, termB, timeframe, geo });
    
    fetch('/api/comparisons/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, termA, termB, timeframe, geo }),
    })
      .then(async (response) => {
        if (response.ok) {
          const data = await response.json();
          console.log('[HistoryTracker] ✅ View recorded:', data);
        } else {
          const error = await response.json().catch(() => ({ message: 'Unknown error' }));
          console.warn('[HistoryTracker] Failed to record view:', response.status, error);
        }
      })
      .catch((error) => {
        // Silently fail - history tracking is non-critical
        console.warn('[HistoryTracker] Network error recording view:', error);
      });
  }, [slug, termA, termB, timeframe, geo]);

  return null; // This component doesn't render anything
}


