"use client";

import { useEffect, useRef } from "react";
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
 * 
 * Note: For UK/EEA compliance, ensure CMP (Consent Management Platform) is configured
 * before displaying ads to users in these regions.
 */
export default function AdSense({
  adSlot,
  adFormat = "auto",
  fullWidthResponsive = true,
  style,
  className = "",
}: AdSenseProps) {
  const adClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const adInitialized = useRef(false);

  useEffect(() => {
    // Initialize AdSense ads after component mounts
    if (adClient && adSlot && !adInitialized.current) {
      try {
        // @ts-ignore - Google AdSense script
        if (window.adsbygoogle && !window.adsbygoogle.loaded) {
          window.adsbygoogle.loaded = true;
        }
        
        // Push ad configuration
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        adInitialized.current = true;
      } catch (e) {
        console.warn('AdSense initialization error:', e);
      }
    }
  }, [adClient, adSlot]);

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
      {/* AdSense Script - Load once globally */}
      <Script
        id="adsbygoogle-init"
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
        onLoad={() => {
          // Mark as loaded
          try {
            // @ts-ignore
            if (window.adsbygoogle) {
              // @ts-ignore
              window.adsbygoogle.loaded = true;
            }
          } catch (e) {
            // Ignore
          }
        }}
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
    adsbygoogle?: {
      loaded?: boolean;
      push?: (config: any) => void;
    } | any[];
  }
}

