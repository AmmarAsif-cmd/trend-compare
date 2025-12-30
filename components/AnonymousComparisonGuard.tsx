"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import SignupPromptModal from "./SignupPromptModal";

const ANONYMOUS_COMPARISON_KEY = "trendarc_anonymous_comparisons";
const ANONYMOUS_LIMIT = 1;

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
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(ANONYMOUS_COMPARISON_KEY);
        const count = stored ? parseInt(stored, 10) : 0;

        console.log('[AnonymousGuard] Checking access for comparison page. Count:', count);

        // Block if count >= 2 (they've already viewed 2 comparisons)
        // ANONYMOUS_LIMIT is 1, so after viewing 2, they must sign up
        if (count >= 2) {
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

