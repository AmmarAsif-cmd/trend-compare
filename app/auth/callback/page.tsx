"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

/**
 * Callback page to handle OAuth redirects
 * This page ensures the session is established and UI is updated
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Wait for session to be loaded
    if (status === "loading") {
      return; // Still loading
    }

    // Get callback URL from query params or default to home
    const callbackUrl = searchParams.get("callbackUrl") || "/";

    if (status === "authenticated" && session) {
      console.log("[Auth Callback] ✅ User authenticated:", session.user?.email);
      
      // Trigger auth state change event for components to refresh
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth-state-change"));
      }

      // Small delay to ensure session is fully established
      setTimeout(() => {
        router.push(callbackUrl);
        router.refresh();
      }, 100);
    } else if (status === "unauthenticated") {
      console.log("[Auth Callback] ❌ User not authenticated, redirecting to login");
      router.push("/login");
    }
  }, [status, session, router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600">Completing sign in...</p>
      </div>
    </div>
  );
}

