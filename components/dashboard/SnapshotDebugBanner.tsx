/**
 * Snapshot Debug Banner
 * Dev-only component showing snapshot debugging information
 */

'use client';

import { useEffect, useState } from 'react';

interface DebugInfo {
  snapshotsFound: number;
  trackedSlugs: string[];
  missingSnapshots: string[];
}

interface SnapshotDebugBannerProps {
  comparisons: Array<{
    slug: string;
    termA: string;
    termB: string;
    currentLeader?: string;
    margin?: number;
    confidence?: number;
  }>;
}

export default function SnapshotDebugBanner({ comparisons }: SnapshotDebugBannerProps) {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    setIsVisible(true);

    // Calculate debug info
    const trackedSlugs = comparisons.map(c => c.slug);
    const snapshotsFound = comparisons.filter(c => 
      c.currentLeader !== undefined && 
      c.margin !== undefined && 
      c.confidence !== undefined
    ).length;
    const missingSnapshots = comparisons
      .filter(c => 
        c.currentLeader === undefined || 
        c.margin === undefined || 
        c.confidence === undefined
      )
      .map(c => c.slug);

    setDebugInfo({
      snapshotsFound,
      trackedSlugs,
      missingSnapshots,
    });
  }, [comparisons]);

  if (!isVisible || !debugInfo || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-yellow-900">🐛 Snapshot Debug Info (Dev Only)</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-yellow-700 hover:text-yellow-900"
        >
          ×
        </button>
      </div>
      <div className="space-y-1 text-yellow-800">
        <div>
          <strong>Snapshots found:</strong> {debugInfo.snapshotsFound} / {comparisons.length}
        </div>
        <div>
          <strong>Tracked slugs ({debugInfo.trackedSlugs.length}):</strong>{' '}
          {debugInfo.trackedSlugs.length > 0 ? (
            <span className="font-mono text-xs">
              {debugInfo.trackedSlugs.slice(0, 5).join(', ')}
              {debugInfo.trackedSlugs.length > 5 ? ` ... (+${debugInfo.trackedSlugs.length - 5} more)` : ''}
            </span>
          ) : (
            'None'
          )}
        </div>
        {debugInfo.missingSnapshots.length > 0 && (
          <div>
            <strong>Missing snapshots ({debugInfo.missingSnapshots.length}):</strong>{' '}
            <span className="font-mono text-xs text-red-700">
              {debugInfo.missingSnapshots.slice(0, 5).join(', ')}
              {debugInfo.missingSnapshots.length > 5 ? ` ... (+${debugInfo.missingSnapshots.length - 5} more)` : ''}
            </span>
          </div>
        )}
        <div className="mt-3 pt-3 border-t border-yellow-200">
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/snapshots/bulk-generate', { method: 'POST' });
                const data = await response.json();
                if (data.success) {
                  alert(`Generated ${data.results.generated} snapshots. Skipped ${data.results.skipped}. Errors: ${data.results.errors}`);
                  window.location.reload();
                } else {
                  alert('Failed to generate snapshots: ' + (data.error || 'Unknown error'));
                }
              } catch (error: any) {
                alert('Error: ' + (error?.message || 'Unknown error'));
              }
            }}
            className="px-3 py-1.5 bg-yellow-600 text-white text-xs font-medium rounded hover:bg-yellow-700 transition-colors"
          >
            Generate Missing Snapshots
          </button>
        </div>
      </div>
    </div>
  );
}

