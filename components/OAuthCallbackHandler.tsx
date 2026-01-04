"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

/**
 * Component to handle OAuth callbacks and refresh auth state
 * This ensures the UI updates immediately after Google OAuth sign-in
 */
export default function OAuthCallbackHandler() {
  const { data: session, status } = useSession();
  const previousStatus = useRef(status);
  const previousSessionId = useRef(session?.user?.id);

  useEffect(() => {
    // Check if session status changed from unauthenticated to authenticated
    const wasUnauthenticated = previousStatus.current === "unauthenticated";
    const isNowAuthenticated = status === "authenticated";
    const sessionChanged = previousSessionId.current !== session?.user?.id;

    if ((wasUnauthenticated && isNowAuthenticated) || (isNowAuthenticated && sessionChanged)) {
      console.log("[OAuth Callback] ✅ Session established, refreshing UI", {
        email: session?.user?.email,
        id: session?.user?.id,
      });

      // Trigger auth state change event for components to refresh
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth-state-change"));
      }
    }

    // Update refs
    previousStatus.current = status;
    previousSessionId.current = session?.user?.id;
  }, [status, session]);

  return null; // This component doesn't render anything
}

