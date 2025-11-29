"use client";

import { useState } from "react";
import { Download, Share2, Check, Copy } from "lucide-react";

type ReportActionsProps = {
  title: string;
  url: string;
};

export default function ReportActions({ title, url }: ReportActionsProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);

    // Use Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Check out this trend comparison: ${title}`,
          url: url,
        });
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
          // Fallback to copy
          copyToClipboard();
        }
      }
    } else {
      // Fallback to copying URL
      copyToClipboard();
    }

    setIsSharing(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownloadPDF = () => {
    // Use browser's print dialog which allows saving as PDF
    window.print();
  };

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* PDF Download Button */}
      <button
        onClick={handleDownloadPDF}
        className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg font-medium transition-all hover:shadow-md"
        aria-label="Download as PDF"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Download PDF</span>
        <span className="sm:hidden">PDF</span>
      </button>

      {/* Share Button */}
      <button
        onClick={handleShare}
        disabled={isSharing}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all hover:shadow-md disabled:opacity-50"
        aria-label="Share this report"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            <span className="hidden sm:inline">Link Copied!</span>
            <span className="sm:hidden">Copied!</span>
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share Report</span>
            <span className="sm:hidden">Share</span>
          </>
        )}
      </button>

      {/* Copy Link Button (always visible on desktop) */}
      <button
        onClick={copyToClipboard}
        className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-300 hover:border-purple-500 hover:bg-purple-50 text-slate-700 hover:text-purple-700 rounded-lg font-medium transition-all hover:shadow-md"
        aria-label="Copy link to clipboard"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            Copy Link
          </>
        )}
      </button>
    </div>
  );
}
