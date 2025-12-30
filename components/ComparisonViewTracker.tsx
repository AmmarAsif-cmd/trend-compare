"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function ComparisonViewTracker() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const hasTracked = useRef(false);
  const lastPathname = useRef<string | null>(null);

  // Reset tracking when pathname changes (new comparison page)
  useEffect(() => {
    if (lastPathname.current !== null && lastPathname.current !== pathname) {
      console.log('[ComparisonViewTracker] Route changed, resetting tracking flag');
      hasTracked.current = false;
    }
    lastPathname.current = pathname;
  }, [pathname]);

  useEffect(() => {
    // Only track if user is not signed in and we haven't tracked this view yet
    if (status === "unauthenticated" && !hasTracked.current) {
      // Wait a bit to ensure the tracking function is set up
      const timeoutId = setTimeout(() => {
        if (typeof window !== "undefined") {
          const trackFunction = (window as any).trackAnonymousComparison;
          if (trackFunction && typeof trackFunction === "function") {
            console.log('[ComparisonViewTracker] Tracking comparison view for:', pathname);
            trackFunction();
            hasTracked.current = true;
          } else {
            console.warn('[ComparisonViewTracker] Tracking function not available yet');
            // Retry after a short delay
            setTimeout(() => {
              const retryFunction = (window as any).trackAnonymousComparison;
              if (retryFunction && typeof retryFunction === "function") {
                console.log('[ComparisonViewTracker] Tracking comparison view (retry)');
                retryFunction();
                hasTracked.current = true;
              }
            }, 500);
          }
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [status, pathname]);

  return null;
}

