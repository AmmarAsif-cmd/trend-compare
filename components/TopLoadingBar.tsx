"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Top Loading Bar - Shows a progress bar at the top during navigation
 * Similar to NProgress but built with pure CSS
 */
export default function TopLoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Show loading bar on route change
    const loadingBar = document.getElementById("top-loading-bar");
    if (!loadingBar) return;

    // Start loading animation
    loadingBar.style.width = "0%";
    loadingBar.style.opacity = "1";

    // Animate to 70% quickly (simulating loading)
    setTimeout(() => {
      loadingBar.style.width = "70%";
    }, 100);

    // Complete on page load
    const timer = setTimeout(() => {
      loadingBar.style.width = "100%";
      setTimeout(() => {
        loadingBar.style.opacity = "0";
        setTimeout(() => {
          loadingBar.style.width = "0%";
        }, 400);
      }, 200);
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return (
    <>
      {/* Fixed loading bar at top of screen */}
      <div
        id="top-loading-bar"
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 z-50 transition-all duration-300 ease-out"
        style={{ width: "0%", opacity: 0 }}
      />

      {/* Add shimmer effect */}
      <style jsx>{`
        #top-loading-bar::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent
          );
          animation: shimmer 1s infinite;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </>
  );
}
