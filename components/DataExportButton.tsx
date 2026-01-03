'use client';

import { Download, FileText, FileJson, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  slug: string;
  termA: string;
  termB: string;
  timeframe?: string;
  geo?: string;
};

export default function DataExportButton({
  slug,
  termA,
  termB,
  timeframe = '12m',
  geo = '',
}: Props) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const formatTerm = (term: string) => {
    return term.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        slug,
        format,
        timeframe,
        ...(geo && { geo }),
      });

      const response = await fetch(`/api/comparisons/export?${params.toString()}`);

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
          return;
        }
        const errorData = await response.json().catch(() => ({ error: 'Failed to export data' }));
        throw new Error(errorData.error || 'Failed to export data');
      }

      // Get blob
      const blob = await response.blob();
      
      // Get filename from Content-Disposition header or generate default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${formatTerm(termA)}-vs-${formatTerm(termB)}-Trend-Data.${format}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Export error:', err);
      setError(err.message || 'Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative group">
          <button
            onClick={() => handleExport('csv')}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
            aria-label="Export as CSV"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>

        <div className="relative group">
          <button
            onClick={() => handleExport('json')}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
            aria-label="Export as JSON"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileJson className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">JSON</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="absolute top-full left-0 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg shadow-lg z-10 max-w-xs">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}


