"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Error({ 
  error, 
  reset 
}: { 
  error: Error & { digest?: string }; 
  reset: () => void;
}) {
  const [errorDetails, setErrorDetails] = useState<string>("");
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Log error for debugging
    console.error("Error boundary caught:", error);
    
    // Extract error message
    const message = error?.message || "Unknown error";
    const stack = error?.stack || "";
    setErrorDetails(`${message}\n\n${stack}`);
  }, [error]);

  // Determine error type for better messaging
  const getErrorType = () => {
    const message = error?.message?.toLowerCase() || "";
    if (message.includes("network") || message.includes("fetch")) {
      return "network";
    }
    if (message.includes("timeout")) {
      return "timeout";
    }
    if (message.includes("quota") || message.includes("rate limit")) {
      return "quota";
    }
    if (message.includes("not found") || message.includes("404")) {
      return "notfound";
    }
    return "unknown";
  };

  const errorType = getErrorType();

  const getErrorMessage = () => {
    switch (errorType) {
      case "network":
        return "We couldn't connect to our servers. Please check your internet connection and try again.";
      case "timeout":
        return "The request took too long. This might be due to high traffic. Please try again in a moment.";
      case "quota":
        return "We've reached our API limit temporarily. Please try again in a few minutes.";
      case "notfound":
        return "The page or comparison you're looking for doesn't exist. It may have been removed or the URL is incorrect.";
      default:
        return "Something unexpected happened. Our team has been notified and we're working on it.";
    }
  };

  const getSuggestions = () => {
    switch (errorType) {
      case "network":
        return [
          "Check your internet connection",
          "Try refreshing the page",
          "Check if you're behind a firewall or VPN",
        ];
      case "timeout":
        return [
          "Wait a moment and try again",
          "Try a simpler comparison",
          "Check if the site is experiencing high traffic",
        ];
      case "quota":
        return [
          "Wait a few minutes before trying again",
          "Try a different comparison",
          "Check back later",
        ];
      case "notfound":
        return [
          "Double-check the URL",
          "Go back to the homepage and search again",
          "The comparison may have been removed",
        ];
      default:
        return [
          "Try refreshing the page",
          "Go back to the homepage",
          "Clear your browser cache and try again",
        ];
    }
  };

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Error Icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Something went wrong</h1>
        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
          {getErrorMessage()}
        </p>

        {/* Suggestions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
          <h3 className="font-semibold text-blue-900 mb-3">What you can try:</h3>
          <ul className="list-disc list-inside space-y-2 text-blue-800">
            {getSuggestions().map((suggestion, idx) => (
              <li key={idx}>{suggestion}</li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <button 
            onClick={() => reset()} 
            className="rounded-lg bg-slate-900 text-white px-6 py-3 text-base font-medium hover:bg-slate-800 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="rounded-lg bg-white text-slate-700 border-2 border-slate-300 px-6 py-3 text-base font-medium hover:bg-slate-50 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>

        {/* Error Details (Collapsible) */}
        {errorDetails && (
          <details className="mt-8 text-left">
            <summary 
              className="cursor-pointer text-sm text-slate-500 hover:text-slate-700 mb-2"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? "Hide" : "Show"} technical details
            </summary>
            <div className="mt-2 bg-slate-100 rounded-lg p-4 overflow-auto">
              <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono">
                {errorDetails}
              </pre>
            </div>
          </details>
        )}

        {/* Help Text */}
        <p className="text-sm text-slate-500 mt-8">
          If this problem persists, please{" "}
          <Link href="/contact" className="text-blue-600 hover:text-blue-700 underline">
            contact us
          </Link>
          {" "}and include the error details above.
        </p>
      </div>
    </main>
  );
}
     