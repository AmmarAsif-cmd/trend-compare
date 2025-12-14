"use client";

import { useEffect } from "react";
import Script from "next/script";

interface AdSenseProps {
  adSlot?: string;
  adFormat?: "auto" | "rectangle" | "vertical" | "horizontal";
  fullWidthResponsive?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Google AdSense Component
 * 
 * Usage:
 * <AdSense adSlot="1234567890" />
 * 
 * To get your ad slot:
 * 1. Go to https://www.google.com/adsense
 * 2. Create an ad unit
 * 3. Copy the ad slot ID
 */
export default function AdSense({
  adSlot,
  adFormat = "auto",
  fullWidthResponsive = true,
  style,
  className = "",
}: AdSenseProps) {
  const adClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  useEffect(() => {
    try {
      // @ts-ignore - Google AdSense script
      if (window.adsbygoogle && window.adsbygoogle.loaded) {
        // Already loaded
        return;
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  if (!adClient) {
    // Don't render if AdSense client ID is not configured
    return null;
  }

  if (!adSlot) {
    // Don't render if ad slot is not provided
    return null;
  }

  return (
    <>
      {/* AdSense Script */}
      <Script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />

      {/* Ad Container */}
      <ins
        className={`adsbygoogle ${className}`}
        style={{
          display: "block",
          ...style,
        }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
      />
    </>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    adsbygoogle?: any;
  }
}

