/**
 * Top Actions Bar
 * Two-row toolbar with clean grouping
 * Row 1: Primary actions (Export, Save, Alert)
 * Row 2: Filters and secondary actions (Share, View count, Timeframe, Region)
 */

'use client';

import { useState } from 'react';
import { Download, FileText, FileJson, Share2, Eye, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import TimeframeSelect from './TimeframeSelect';
import RegionSelect from './RegionSelect';
import SaveComparisonButton from './SaveComparisonButton';
import CreateAlertButton from './CreateAlertButton';
import SocialShareButtons from './SocialShareButtons';
import ViewCounter from './ViewCounter';
import Link from 'next/link';

interface TopActionsBarProps {
  slug: string;
  termA: string;
  termB: string;
  isLoggedIn: boolean;
  viewCount?: number;
  lastUpdatedAt?: string;
}

export default function TopActionsBar({
  slug,
  termA,
  termB,
  isLoggedIn,
  viewCount = 0,
  lastUpdatedAt,
}: TopActionsBarProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const router = useRouter();

  const handleExport = async (format: 'pdf' | 'csv' | 'json') => {
    if (format === 'pdf') {
      window.open(`/api/pdf/download?slug=${slug}`, '_blank');
    } else if (format === 'csv') {
      window.open(`/api/comparisons/export?slug=${slug}&format=csv`, '_blank');
    } else {
      window.open(`/api/comparisons/export?slug=${slug}&format=json`, '_blank');
    }
  };

  return (
    <div className="w-full border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Row 1: Primary Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-3 border-b border-slate-100">
          <div className="flex-1 min-w-0" />
          
          {/* Right: Export + Save + Alert */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Export buttons */}
            <button
              onClick={() => handleExport('pdf')}
              className="h-9 px-3 flex items-center gap-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              title="Download PDF"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="h-9 px-3 flex items-center gap-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              title="Download CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={() => handleExport('json')}
              className="h-9 px-3 flex items-center gap-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              title="Download JSON"
            >
              <FileJson className="w-4 h-4" />
              <span className="hidden sm:inline">JSON</span>
            </button>
            
            <div className="h-9 w-px bg-slate-300" />
            
            {/* Save / Sign in */}
            {isLoggedIn ? (
              <>
                <SaveComparisonButton slug={slug} termA={termA} termB={termB} />
                <CreateAlertButton slug={slug} termA={termA} termB={termB} />
              </>
            ) : (
              <Link
                href={`/login?callbackUrl=/compare/${slug}`}
                  className="h-9 px-3 flex items-center gap-2 text-sm font-medium text-blue-600 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Sign in
                </Link>
            )}
          </div>
        </div>

        {/* Row 2: Filters and Secondary Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-3">
          {/* Left: Share + View count */}
          <div className="flex items-center gap-3 flex-wrap min-w-0 flex-1">
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="h-9 px-3 flex items-center gap-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
              {showShareMenu && (
                <div 
                  className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[200px] p-3"
                  onMouseLeave={() => setShowShareMenu(false)}
                >
                  <SocialShareButtons
                    url={`https://trendarc.net/compare/${slug}`}
                    title={`${termA} vs ${termB} - Which is more popular?`}
                    description={`See which is trending more: ${termA} or ${termB}?`}
                    termA={termA}
                    termB={termB}
                    winner={termA}
                    winnerScore={50}
                    loserScore={50}
                  />
                </div>
              )}
            </div>
            {viewCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Eye className="w-3.5 h-3.5" />
                <span>{viewCount.toLocaleString()} views</span>
              </div>
            )}
            {lastUpdatedAt && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                <span>Updated {new Date(lastUpdatedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Right: Filters */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <TimeframeSelect />
            <RegionSelect />
          </div>
        </div>
      </div>
    </div>
  );
}

