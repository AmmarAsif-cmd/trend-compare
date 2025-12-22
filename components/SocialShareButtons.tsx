"use client";

import { useState, useRef, useEffect } from "react";
import { Share2, Check, Link2, X, Eye, Copy } from "lucide-react";

type SocialShareButtonsProps = {
  url: string;
  title: string;
  description?: string;
  termA: string;
  termB: string;
  winner?: string;
  winnerScore?: number;
  loserScore?: number;
};

export default function SocialShareButtons({
  url,
  title,
  description,
  termA,
  termB,
  winner,
  winnerScore,
  loserScore,
}: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);

  // Close preview when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (previewRef.current && !previewRef.current.contains(event.target as Node)) {
        setShowPreview(false);
      }
    };

    if (showPreview) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showPreview]);

  const prettyTerm = (term: string) => term.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const defaultMessage = winner
    ? `${prettyTerm(winner)} is more popular than ${prettyTerm(winner === termA ? termB : termA)}! See the full comparison:`
    : `Compare ${prettyTerm(termA)} vs ${prettyTerm(termB)} search trends:`;

  const shareMessage = customMessage || defaultMessage;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedMessage = encodeURIComponent(shareMessage);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareMessage} ${url}`)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMessage}`,
    reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedMessage}`,
  };

  const copyToClipboard = async (text?: string) => {
    try {
      await navigator.clipboard.writeText(text || url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const copyShareText = async () => {
    const text = `${shareMessage}\n\n${url}`;
    await copyToClipboard(text);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: shareMessage,
          url: url,
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="relative flex flex-wrap items-center gap-2">
      <span className="text-xs sm:text-sm text-slate-500 font-medium mr-1">Share:</span>
      
      {/* Preview Button */}
      <button
        onClick={() => setShowPreview(!showPreview)}
        className="flex items-center gap-1.5 px-2.5 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all duration-200 hover:scale-105 min-h-[44px] sm:min-h-[36px]"
        aria-label="Preview share"
      >
        <Eye className="w-4 h-4" />
        <span className="hidden sm:inline text-xs">Preview</span>
      </button>

      {/* Share Buttons */}
      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 hover:bg-[#1DA1F2] text-slate-600 hover:text-white transition-all duration-200 hover:scale-105 min-h-[44px] sm:min-h-[36px]"
        aria-label="Share on Twitter"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>

      <a
        href={shareLinks.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 hover:bg-[#0A66C2] text-slate-600 hover:text-white transition-all duration-200 hover:scale-105 min-h-[44px] sm:min-h-[36px]"
        aria-label="Share on LinkedIn"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      </a>

      <a
        href={shareLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 hover:bg-[#1877F2] text-slate-600 hover:text-white transition-all duration-200 hover:scale-105 min-h-[44px] sm:min-h-[36px]"
        aria-label="Share on Facebook"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </a>

      <a
        href={shareLinks.reddit}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 hover:bg-[#FF4500] text-slate-600 hover:text-white transition-all duration-200 hover:scale-105 min-h-[44px] sm:min-h-[36px]"
        aria-label="Share on Reddit"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
        </svg>
      </a>

      <button
        onClick={copyToClipboard}
        className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all duration-200 hover:scale-105 min-h-[44px] sm:min-h-[36px]"
        aria-label="Copy link"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Link2 className="w-4 h-4" />
        )}
      </button>

      <button
        onClick={handleNativeShare}
        className="flex items-center gap-1.5 px-3 h-9 rounded-lg bg-violet-100 hover:bg-violet-200 text-violet-700 font-medium text-xs sm:text-sm transition-all duration-200 hover:scale-105 min-h-[44px] sm:min-h-[36px]"
        aria-label="More sharing options"
      >
        <Share2 className="w-4 h-4" />
        <span className="hidden sm:inline">More</span>
        <span className="sm:hidden">Share</span>
      </button>

      {/* Share Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 sm:p-8" onClick={() => setShowPreview(false)}>
          <div
            ref={previewRef}
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-lg font-semibold text-slate-900">Share Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close preview"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Preview Content */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* Custom Message Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Customize your message (optional)
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder={defaultMessage}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                  rows={3}
                  maxLength={280}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {customMessage.length}/280 characters
                </p>
              </div>

              {/* Preview Card */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <p className="text-sm font-semibold text-slate-900 mb-2">Preview:</p>
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  {/* Social Media Preview */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">TA</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-slate-900">TrendArc</span>
                          <span className="text-xs text-slate-500">@trendarc</span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-500">Now</span>
                        </div>
                        <p className="text-sm text-slate-800 mb-2 whitespace-pre-wrap break-words">
                          {shareMessage}
                        </p>
                        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                          <div className="p-3 bg-gradient-to-br from-violet-50 to-purple-50">
                            <h4 className="font-semibold text-sm text-slate-900 mb-1">{title}</h4>
                            <p className="text-xs text-slate-600 mb-2">
                              {description || `Compare ${prettyTerm(termA)} vs ${prettyTerm(termB)}`}
                            </p>
                            {winner && winnerScore && loserScore && (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="font-medium text-slate-700">
                                  Winner: {prettyTerm(winner)}
                                </span>
                                <span className="text-slate-400">·</span>
                                <span className="text-slate-600">
                                  {winnerScore}% vs {loserScore}%
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="px-3 py-2 bg-slate-50 border-t border-slate-200">
                            <p className="text-xs text-slate-500 truncate">{url}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  onClick={copyShareText}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-sm transition-colors min-h-[44px]"
                >
                  <Copy className="w-4 h-4" />
                  Copy Text
                </button>
                <button
                  onClick={copyToClipboard}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium text-sm transition-colors min-h-[44px]"
                >
                  <Link2 className="w-4 h-4" />
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
