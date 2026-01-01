/**
 * Snapshot Saver Component
 * Client-side component that saves snapshots after comparison data is loaded
 */

'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface SnapshotSaverProps {
  slug: string;
  termA: string;
  termB: string;
  timeframe?: string;
  geo?: string;
  winner: string;
  marginPoints: number;
  confidence: number;
  volatility?: number;
  agreementIndex?: number;
  trendDirection?: string;
  winnerScore?: number;
  loserScore?: number;
  category?: string | null;
  computedAt?: string;
}

export default function SnapshotSaver({
  slug,
  termA,
  termB,
  timeframe = '12m',
  geo = '',
  winner,
  marginPoints,
  confidence,
  volatility,
  agreementIndex,
  trendDirection,
  winnerScore,
  loserScore,
  category,
  computedAt,
}: SnapshotSaverProps) {
  const { data: session, status } = useSession();
  const hasSavedRef = useRef(false);
  const saveKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // Only save if user is authenticated and we haven't saved yet
    if (status !== 'authenticated' || !session?.user || hasSavedRef.current) {
      return;
    }

    // Create stable key to prevent duplicate calls
    const stableKey = `${session.user.id || 'unknown'}-${slug}-${computedAt || Date.now()}`;
    
    // If we've already saved with this key, skip
    if (saveKeyRef.current === stableKey) {
      return;
    }

    // Mark as attempting to save
    saveKeyRef.current = stableKey;

    // Small delay to ensure page is fully loaded
    const timeoutId = setTimeout(async () => {
      try {
        const isDev = process.env.NODE_ENV === 'development';
        
        console.log('[SnapshotSaver] 📸 Attempting to save snapshot:', {
          slug,
          termA,
          termB,
          winner,
          marginPoints,
          confidence,
          userId: session.user.id || 'unknown',
          status,
        });

        const response = await fetch('/api/snapshots/upsert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            comparisonSlug: slug,
            termA,
            termB,
            timeframe,
            region: geo,
            computedAt: computedAt || new Date().toISOString(),
            winner,
            marginPoints,
            confidence,
            volatility,
            agreementIndex,
            trendDirection,
            winnerScore,
            loserScore,
            category,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('[SnapshotSaver] ❌ Failed to save snapshot:', {
            status: response.status,
            error: errorData.error || errorData,
            slug,
          });
          return;
        }

        const data = await response.json();
        hasSavedRef.current = true;

        console.log('[SnapshotSaver] ✅ Snapshot saved successfully:', {
          snapshotId: data.snapshot?.id,
          slug: data.snapshot?.slug,
        });
      } catch (error: any) {
        console.error('[SnapshotSaver] ❌ Error saving snapshot:', {
          error: error?.message || error,
          slug,
          stack: error?.stack,
        });
        // Reset save key on error so it can retry
        saveKeyRef.current = null;
      }
    }, 500); // Wait 500ms after component mount

    return () => {
      clearTimeout(timeoutId);
    };
  }, [status, session, slug, termA, termB, timeframe, geo, winner, marginPoints, confidence, volatility, agreementIndex, trendDirection, winnerScore, loserScore, category, computedAt]);

  // This component doesn't render anything
  return null;
}

