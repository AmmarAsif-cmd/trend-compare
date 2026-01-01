/**
 * Comparison Toolbar
 * Unified toolbar with actions on left, filters/export on right
 * Prevents wrapping and layout shift
 */

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import TimeframeSelect from './TimeframeSelect';
import RegionSelect from './RegionSelect';
import PDFDownloadButton from './PDFDownloadButton';
import DataExportButton from './DataExportButton';
import SaveComparisonButton from './SaveComparisonButton';
import CreateAlertButton from './CreateAlertButton';
import SocialShareButtons from './SocialShareButtons';
import ViewCounter from './ViewCounter';

interface ComparisonToolbarProps {
  slug: string;
  termA: string;
  termB: string;
  winner: string;
  winnerScore: number;
  loserScore: number;
  isLoggedIn: boolean;
  viewCount?: number;
}

export default function ComparisonToolbar({
  slug,
  termA,
  termB,
  winner,
  winnerScore,
  loserScore,
  isLoggedIn,
  viewCount = 0,
}: ComparisonToolbarProps) {
  return (
    <div className="w-full border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
          {/* Left: Actions */}
          <div className="flex items-center gap-3 flex-wrap min-w-0 flex-1">
            <SocialShareButtons
              url={`https://trendarc.net/compare/${slug}`}
              title={`${termA} vs ${termB} - Which is more popular?`}
              description={`See which is trending more: ${termA} or ${termB}? Compare search trends, social buzz, and more.`}
              termA={termA}
              termB={termB}
              winner={winner}
              winnerScore={winnerScore}
              loserScore={loserScore}
            />
            {isLoggedIn && (
              <>
                <SaveComparisonButton
                  slug={slug}
                  termA={termA}
                  termB={termB}
                />
                <CreateAlertButton
                  slug={slug}
                  termA={termA}
                  termB={termB}
                />
              </>
            )}
          </div>

          {/* Right: Filters + Export */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <TimeframeSelect />
              <RegionSelect />
            </div>
            <div className="h-9 w-px bg-slate-300" />
            <div className="flex items-center gap-2">
              <PDFDownloadButton slug={slug} termA={termA} termB={termB} />
              <DataExportButton slug={slug} termA={termA} termB={termB} />
            </div>
            {viewCount > 0 && (
              <>
                <div className="h-9 w-px bg-slate-300" />
                <ViewCounter slug={slug} initialCount={viewCount} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

