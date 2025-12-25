"use client";

import { useState, useEffect } from "react";
import { X, Settings, Cookie } from "lucide-react";
import Link from "next/link";

/**
 * Cookie Consent Banner Component
 * 
 * UK/EEA GDPR Compliant Cookie Consent Banner
 * 
 * Requirements:
 * - Clear Accept/Reject buttons
 * - Link to privacy policy
 * - Option to manage preferences
 * - Must appear before ads load
 * 
 * Usage:
 * Add <CookieConsent /> to your root layout
 */
export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // Always true, cannot be disabled
    analytics: false,
    advertising: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      // Show banner after a short delay for better UX
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // Load saved preferences
      try {
        const saved = JSON.parse(consent);
        setPreferences(saved);
      } catch (e) {
        // Invalid saved data, show banner again
        setShowBanner(true);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      advertising: true,
    };
    setPreferences(allAccepted);
    localStorage.setItem("cookieConsent", JSON.stringify(allAccepted));
    setShowBanner(false);
    // Trigger consent event for CMP
    if (typeof window !== "undefined") {
      // Update Google Analytics consent
      if ((window as any).gtag) {
        (window as any).gtag("consent", "update", {
          analytics_storage: "granted",
          ad_storage: "granted",
        });
      }
      // Trigger custom event for CMP
      window.dispatchEvent(new CustomEvent("cookieConsentUpdated"));
    }
  };

  const handleRejectAll = () => {
    const onlyEssential = {
      essential: true,
      analytics: false,
      advertising: false,
    };
    setPreferences(onlyEssential);
    localStorage.setItem("cookieConsent", JSON.stringify(onlyEssential));
    setShowBanner(false);
    // Trigger consent event for CMP
    if (typeof window !== "undefined") {
      // Update Google Analytics consent
      if ((window as any).gtag) {
        (window as any).gtag("consent", "update", {
          analytics_storage: "denied",
          ad_storage: "denied",
        });
      }
      // Trigger custom event for CMP
      window.dispatchEvent(new CustomEvent("cookieConsentUpdated"));
    }
  };

  const handleSavePreferences = () => {
    localStorage.setItem("cookieConsent", JSON.stringify(preferences));
    setShowBanner(false);
    setShowSettings(false);
    // Trigger consent event for CMP
    if (typeof window !== "undefined") {
      // Update Google Analytics consent
      if ((window as any).gtag) {
        (window as any).gtag("consent", "update", {
          analytics_storage: preferences.analytics ? "granted" : "denied",
          ad_storage: preferences.advertising ? "granted" : "denied",
        });
      }
      // Trigger custom event for CMP
      window.dispatchEvent(new CustomEvent("cookieConsentUpdated"));
    }
  };

  if (!showBanner) {
    // Show small "Manage Cookies" button in corner
    return (
      <button
        onClick={() => {
          setShowBanner(true);
          setShowSettings(true);
        }}
        className="fixed bottom-4 right-4 z-50 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-slate-700 transition-colors flex items-center gap-2 text-sm"
        aria-label="Manage cookie preferences"
      >
        <Cookie className="w-4 h-4" />
        Manage Cookies
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t-2 border-slate-200 shadow-2xl">
      <div className="max-w-6xl mx-auto">
        {!showSettings ? (
          // Main Banner
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Cookie className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">We Use Cookies</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
                By clicking "Accept All", you consent to our use of cookies. You can manage your preferences at any time.{" "}
                <Link href="/privacy" className="text-blue-600 hover:text-blue-700 underline">
                  Learn more in our Privacy Policy
                </Link>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold text-sm"
              >
                Reject All
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="px-4 py-2 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold text-sm flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Customize
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
              >
                Accept All
              </button>
            </div>
          </div>
        ) : (
          // Settings Panel
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                Cookie Preferences
              </h3>
              <button
                onClick={() => {
                  setShowSettings(false);
                  if (!localStorage.getItem("cookieConsent")) {
                    setShowBanner(false);
                  }
                }}
                className="text-slate-500 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Essential Cookies */}
              <div className="flex items-start justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">Essential Cookies</h4>
                  <p className="text-sm text-slate-600">
                    Required for the website to function. These cannot be disabled.
                  </p>
                </div>
                <div className="ml-4">
                  <input
                    type="checkbox"
                    checked={preferences.essential}
                    disabled
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-start justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">Analytics Cookies</h4>
                  <p className="text-sm text-slate-600">
                    Help us understand how visitors use our website (e.g., Google Analytics).
                  </p>
                </div>
                <div className="ml-4">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) =>
                      setPreferences({ ...preferences, analytics: e.target.checked })
                    }
                    className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Advertising Cookies */}
              <div className="flex items-start justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">Advertising Cookies</h4>
                  <p className="text-sm text-slate-600">
                    Used to serve relevant ads and measure ad performance (e.g., Google AdSense).
                  </p>
                </div>
                <div className="ml-4">
                  <input
                    type="checkbox"
                    checked={preferences.advertising}
                    onChange={(e) =>
                      setPreferences({ ...preferences, advertising: e.target.checked })
                    }
                    className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-slate-200">
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold text-sm"
              >
                Reject All
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold text-sm"
              >
                Accept All
              </button>
              <button
                onClick={handleSavePreferences}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm flex-1 sm:flex-none"
              >
                Save Preferences
              </button>
            </div>

            <p className="text-xs text-slate-500 text-center">
              You can change these preferences at any time.{" "}
              <Link href="/privacy" className="text-blue-600 hover:text-blue-700 underline">
                Read our Privacy Policy
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

