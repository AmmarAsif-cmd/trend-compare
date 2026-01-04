'use client';

import { Download, FileText, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  slug: string;
  timeframe?: string;
  geo?: string;
  termA: string;
  termB: string;
};

export default function PDFDownloadButton({
  slug,
  timeframe = '12m',
  geo = '',
  termA,
  termB,
}: Props) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const router = useRouter();

  // Check if user is logged in
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/user/me');
        setIsLoggedIn(response.ok);
      } catch {
        setIsLoggedIn(false);
      }
    }
    checkAuth();
  }, []);

  const formatTerm = (term: string) => {
    return term.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const handleDownload = async () => {
    // Check authentication first
    if (isLoggedIn === false) {
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    // If auth status is still loading, wait a bit
    if (isLoggedIn === null) {
      setError('Checking authentication...');
      // Wait for auth check to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      if (isLoggedIn === false) {
        const currentPath = window.location.pathname + window.location.search;
        router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
        return;
      }
    }

    setIsDownloading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        slug,
        timeframe,
        ...(geo && { geo }),
      });

      const response = await fetch(`/api/pdf/download?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate PDF' }));
        
        // Handle authentication error specifically
        if (response.status === 401) {
          const currentPath = window.location.pathname + window.location.search;
          router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
          return;
        }
        
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      // Get PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formatTerm(termA)}-vs-${formatTerm(termB)}-Trend-Report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('PDF download error:', err);
      setError(err.message || 'Failed to download PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium text-sm transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        aria-label="Download PDF Report"
      >
        {isDownloading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Generating PDF...</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>Download PDF Report</span>
          </>
        )}
      </button>

      {error && (
        <div className="absolute top-full left-0 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg shadow-lg z-10 max-w-xs">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}


