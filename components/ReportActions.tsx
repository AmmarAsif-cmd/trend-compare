"use client";

import { useState } from "react";
import { Download, Share2, Check } from "lucide-react";

type ReportActionsProps = {
  title: string;
  url: string;
  termA: string;
  termB: string;
};

export default function ReportActions({ title, url, termA, termB }: ReportActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // Use Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Check out this trend comparison: ${title}`,
          url: url,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
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
    // Add print-specific class to body
    document.body.classList.add('generating-pdf');

    // Trigger print dialog
    window.print();

    // Remove class after print dialog closes
    setTimeout(() => {
      document.body.classList.remove('generating-pdf');
    }, 1000);
  };

  return (
    <div className="flex flex-wrap gap-2 items-center print:hidden">
      {/* PDF Download Button - Smaller and prettier */}
      <button
        onClick={handleDownloadPDF}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-lg text-sm font-medium transition-all hover:shadow-sm"
        aria-label="Download as PDF"
      >
        <Download className="w-3.5 h-3.5" />
        <span>PDF</span>
      </button>

      {/* Share Button - Smaller and prettier */}
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg text-sm font-medium transition-all hover:shadow-sm"
        aria-label="Share this report"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </>
        )}
      </button>
    </div>
  );
}
