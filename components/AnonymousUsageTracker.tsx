"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import SignupPromptModal from "./SignupPromptModal";

const ANONYMOUS_COMPARISON_KEY = "trendarc_anonymous_comparisons";
const ANONYMOUS_LIMIT = 1;

export default function AnonymousUsageTracker() {
  const { data: session, status } = useSession();
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [comparisonCount, setComparisonCount] = useState(0);

  useEffect(() => {
    // Only track if user is not signed in
    if (status === "authenticated" || status === "loading") {
      // User is signed in or we're checking, clear any tracking
      if (typeof window !== "undefined") {
        localStorage.removeItem(ANONYMOUS_COMPARISON_KEY);
        sessionStorage.removeItem("signup_modal_shown");
      }
      return;
    }

    if (status === "unauthenticated") {
      // User is anonymous, check their usage
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(ANONYMOUS_COMPARISON_KEY);
        const count = stored ? parseInt(stored, 10) : 0;
        setComparisonCount(count);
        // Don't show modal here - only show when a new comparison is viewed
      }
    }
  }, [status]);

  // Expose function to parent components - use useCallback to ensure stable reference
  useEffect(() => {
    const handleComparisonViewed = () => {
      // Check status directly from cookie/localStorage to avoid stale closures
      if (typeof window === "undefined") return;
      
      // Get current count from cookie (server-side truth) or localStorage
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };
      
      const cookieCount = getCookie('trendarc_anonymous_comparisons_client');
      const stored = localStorage.getItem(ANONYMOUS_COMPARISON_KEY);
      const current = cookieCount ? parseInt(cookieCount, 10) : (stored ? parseInt(stored, 10) : 0);
      
      // Note: Server-side already incremented, so we should sync with server
      // But if client-side is ahead, use that (shouldn't happen, but defensive)
      const newCount = current + 1;
      localStorage.setItem(ANONYMOUS_COMPARISON_KEY, newCount.toString());
      setComparisonCount(newCount);

      console.log('[AnonymousTracker] Comparison viewed. Count:', newCount);

      // Show modal immediately after viewing the 2nd comparison (when count = 2)
      // The guard will block future access, but we show the modal here as well
      if (newCount >= 2) {
        console.log('[AnonymousTracker] Limit exceeded (count:', newCount, '), showing modal immediately');
        // Check if modal was already shown in this session
        const modalShown = sessionStorage.getItem("signup_modal_shown");
        if (!modalShown) {
          console.log('[AnonymousTracker] Displaying signup modal immediately');
          // Show modal immediately - user must sign up to continue
          setShowSignupModal(true);
          sessionStorage.setItem("signup_modal_shown", "true");
          // Prevent body scroll
          if (typeof window !== "undefined") {
            document.body.style.overflow = "hidden";
          }
        } else {
          console.log('[AnonymousTracker] Modal already shown this session');
        }
      }
    };

    if (typeof window !== "undefined") {
      (window as any).trackAnonymousComparison = handleComparisonViewed;
      console.log('[AnonymousTracker] Tracking function exposed to window');
    }

    // Cleanup
    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).trackAnonymousComparison;
      }
    };
  }, [status]); // Re-create when status changes

  // Determine if modal should be dismissible based on current count
  const getDismissible = () => {
    if (typeof window === "undefined") return true;
    const count = parseInt(
      localStorage.getItem(ANONYMOUS_COMPARISON_KEY) || "0",
      10
    );
    // Non-dismissible if count >= 2 (they've exceeded the limit)
    return count < 2;
  };

  return (
    <>
      <SignupPromptModal
        isOpen={showSignupModal}
        onClose={() => {
          // Don't allow closing if they've exceeded limit
          const dismissible = getDismissible();
          if (!dismissible) {
            // Keep modal open, they must sign up
            console.log('[AnonymousTracker] Modal cannot be dismissed - user must sign up');
            return;
          }
          setShowSignupModal(false);
          if (typeof window !== "undefined") {
            document.body.style.overflow = "unset";
          }
        }}
        onSignup={() => {
          // Close modal
          setShowSignupModal(false);
          // Clear tracking when user signs up
          if (typeof window !== "undefined") {
            localStorage.removeItem(ANONYMOUS_COMPARISON_KEY);
            sessionStorage.removeItem("signup_modal_shown");
            document.body.style.overflow = "unset";
          }
          // Navigation happens in SignupPromptModal
        }}
        dismissible={getDismissible()}
      />
    </>
  );
}

