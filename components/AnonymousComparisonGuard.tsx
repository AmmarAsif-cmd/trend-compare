"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import SignupPromptModal from "./SignupPromptModal";

const ANONYMOUS_COMPARISON_KEY = "trendarc_anonymous_comparisons";
const ANONYMOUS_LIMIT = 3; // Allow 3 comparisons, block on 4th

/**
 * Component that blocks comparison pages for anonymous users who have exceeded their limit
 * This ensures users must sign up before viewing more comparisons
 */
export default function AnonymousComparisonGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check if we're on a comparison page
  const isComparisonPage = pathname?.startsWith("/compare/");

  useEffect(() => {
    // Only check for anonymous users on comparison pages
    if (status === "loading" || !isComparisonPage) {
      setIsChecking(false);
      return;
    }

    if (status === "authenticated") {
      // User is signed in, allow access
      setIsChecking(false);
      return;
    }

    if (status === "unauthenticated" && isComparisonPage) {
      // Check if user has exceeded limit
      // First check cookie (server-side source of truth), then fallback to localStorage
      if (typeof window !== "undefined") {
        // Try to read from cookie first (synced from server)
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return null;
        };
        
        const cookieCount = getCookie('trendarc_anonymous_comparisons_client');
        const stored = localStorage.getItem(ANONYMOUS_COMPARISON_KEY);
        
        // Use cookie if available (server-side truth), otherwise use localStorage
        const count = cookieCount ? parseInt(cookieCount, 10) : (stored ? parseInt(stored, 10) : 0);
        
        // Sync localStorage with cookie value
        if (cookieCount && cookieCount !== stored) {
          localStorage.setItem(ANONYMOUS_COMPARISON_KEY, cookieCount);
        }

        console.log('[AnonymousGuard] Checking access for comparison page. Count:', count, '(from cookie:', cookieCount, ', localStorage:', stored, ')');

        // Block if count >= ANONYMOUS_LIMIT (they've already viewed ANONYMOUS_LIMIT comparisons)
        // After viewing ANONYMOUS_LIMIT, they must sign up for more
        if (count >= ANONYMOUS_LIMIT) {
          // User has exceeded limit, show modal immediately and block access
          console.log('[AnonymousGuard] Limit exceeded (count:', count, '), blocking access and showing modal');
          setShowModal(true);
          setIsChecking(false);
          // Prevent body scroll
          if (typeof window !== "undefined") {
            document.body.style.overflow = "hidden";
          }
        } else {
          // User hasn't exceeded limit yet, allow access
          console.log('[AnonymousGuard] Within limit (count:', count, '), allowing access');
          setIsChecking(false);
        }
      }
    }
  }, [status, pathname, isComparisonPage]);

  const handleSignup = () => {
    // Close modal first
    setShowModal(false);
    // Clear tracking when user signs up
    if (typeof window !== "undefined") {
      localStorage.removeItem(ANONYMOUS_COMPARISON_KEY);
      sessionStorage.removeItem("signup_modal_shown");
      document.body.style.overflow = "unset";
    }
    // Navigate to signup
    router.push("/signup");
  };

  const handleLogin = () => {
    // Close modal first
    setShowModal(false);
    // Clear tracking
    if (typeof window !== "undefined") {
      localStorage.removeItem(ANONYMOUS_COMPARISON_KEY);
      sessionStorage.removeItem("signup_modal_shown");
      document.body.style.overflow = "unset";
    }
    // Navigate to login
    router.push("/login");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && !showModal) {
        document.body.style.overflow = "unset";
      }
    };
  }, [showModal]);

  // If checking, show loading state (only on comparison pages)
  if (isChecking && isComparisonPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If modal should be shown, show it and block the page
  if (showModal && isComparisonPage) {
    return (
      <>
        <SignupPromptModal
          isOpen={true}
          onClose={() => {
            // Close modal
            setShowModal(false);
            if (typeof window !== "undefined") {
              document.body.style.overflow = "unset";
            }
          }}
          onSignup={() => {
            // Close modal and navigate
            handleSignup();
          }}
          dismissible={false}
        />
        {/* Show a blocked page behind the modal */}
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center pointer-events-none">
          <div className="text-center opacity-30">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign Up Required</h1>
            <p className="text-gray-600">Please sign up to view more comparisons.</p>
          </div>
        </div>
      </>
    );
  }

  // Allow access (either not a comparison page, or within limit)
  return <>{children}</>;
}

