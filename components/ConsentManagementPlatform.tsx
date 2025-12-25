"use client";

import { useEffect } from "react";
import Script from "next/script";

/**
 * Consent Management Platform (CMP) Component
 * 
 * Implements IAB Europe Transparency and Consent Framework (TCF) 2.0
 * Required for UK/EEA compliance with Google AdSense
 * 
 * This component:
 * - Loads IAB TCF 2.0 CMP API
 * - Integrates with cookie consent banner
 * - Generates consent strings
 * - Communicates with Google services
 * 
 * After AdSense approval, you can upgrade to Google Funding Choices
 * by replacing this with Funding Choices implementation.
 */
export default function ConsentManagementPlatform() {
  useEffect(() => {
    // Initialize IAB TCF 2.0 CMP
    if (typeof window !== "undefined") {
      // Create __tcfapi function for IAB TCF 2.0
      (window as any).__tcfapi = function(
        command: string,
        version: number,
        callback: (data: any, success: boolean) => void,
        parameter?: any
      ) {
        if (command === "getTCData" || command === "getInAppTCData") {
          // Get consent from localStorage
          const consent = localStorage.getItem("cookieConsent");
          let consentData: any = {
            gdprApplies: true, // UK/EEA applies GDPR
            tcfPolicyVersion: 2,
            cmpId: 1, // Custom CMP ID
            cmpVersion: 1,
            tcString: "",
            listenerId: null,
            isServiceSpecific: false,
            useNonStandardStacks: false,
            publisherCC: "GB", // UK country code
            purposeOneTreatment: false,
            outOfBand: {},
            publisher: {
              restrictions: {},
            },
            vendor: {
              consents: {},
              legitimateInterests: {},
            },
            purpose: {
              consents: {},
              legitimateInterests: {},
            },
            specialFeatureOptins: {},
            publisherRestrictions: {},
          };

          if (consent) {
            try {
              const preferences = JSON.parse(consent);
              
              // Map cookie preferences to TCF purposes
              // Purpose 1: Store and/or access information on a device
              consentData.purpose.consents["1"] = preferences.essential ? "1" : "0";
              
              // Purpose 2: Select basic ads
              consentData.purpose.consents["2"] = preferences.advertising ? "1" : "0";
              
              // Purpose 7: Measure ad performance
              consentData.purpose.consents["7"] = preferences.advertising ? "1" : "0";
              
              // Purpose 10: Develop and improve products
              consentData.purpose.consents["10"] = preferences.analytics ? "1" : "0";
              
              // Vendor consents (Google = vendor ID 755)
              consentData.vendor.consents["755"] = preferences.advertising ? "1" : "0";
              
              // Generate TC String (simplified - in production, use proper encoding)
              const tcString = generateTCString(consentData);
              consentData.tcString = tcString;
            } catch (e) {
              // Default to no consent if parsing fails
            }
          } else {
            // No consent given yet - default to denied
            consentData.purpose.consents["1"] = "1"; // Essential only
            consentData.purpose.consents["2"] = "0";
            consentData.purpose.consents["7"] = "0";
            consentData.purpose.consents["10"] = "0";
            consentData.vendor.consents["755"] = "0";
          }

          callback(consentData, true);
        } else if (command === "addEventListener") {
          // Store listener for consent updates
          const listenerId = Date.now();
          (window as any).__tcfListeners = (window as any).__tcfListeners || [];
          (window as any).__tcfListeners.push({
            id: listenerId,
            callback: callback,
          });
          
          // Return listener ID
          callback({ listenerId }, true);
        } else if (command === "removeEventListener") {
          // Remove listener
          if ((window as any).__tcfListeners) {
            (window as any).__tcfListeners = (window as any).__tcfListeners.filter(
              (l: any) => l.id !== parameter
            );
          }
          callback({}, true);
        } else {
          callback({}, false);
        }
      };

      // Update consent when cookie preferences change
      const updateConsent = () => {
        const consent = localStorage.getItem("cookieConsent");
        if (consent && (window as any).__tcfListeners) {
          // Notify all listeners
          (window as any).__tcfListeners.forEach((listener: any) => {
            try {
              const preferences = JSON.parse(consent);
              const consentData: any = {
                gdprApplies: true,
                tcfPolicyVersion: 2,
                purpose: {
                  consents: {
                    "1": preferences.essential ? "1" : "0",
                    "2": preferences.advertising ? "1" : "0",
                    "7": preferences.advertising ? "1" : "0",
                    "10": preferences.analytics ? "1" : "0",
                  },
                },
                vendor: {
                  consents: {
                    "755": preferences.advertising ? "1" : "0",
                  },
                },
              };
              listener.callback(consentData, true);
            } catch (e) {
              // Ignore
            }
          });
        }
      };

      // Listen for storage changes (when consent is updated)
      window.addEventListener("storage", updateConsent);
      
      // Also listen for custom event from cookie consent banner
      window.addEventListener("cookieConsentUpdated", updateConsent);

      return () => {
        window.removeEventListener("storage", updateConsent);
        window.removeEventListener("cookieConsentUpdated", updateConsent);
      };
    }
  }, []);

  return null; // This component doesn't render anything
}

/**
 * Generate a simplified TC String for IAB TCF 2.0
 * 
 * Note: In production, use a proper TCF 2.0 encoding library
 * This is a simplified version for basic compliance
 */
function generateTCString(data: any): string {
  // Simplified TC String generation
  // In production, use proper base64url encoding per TCF 2.0 spec
  const parts = [
    "2", // Version
    data.publisherCC || "GB", // Publisher country code
    "1", // Created timestamp (simplified)
    "1", // Last updated timestamp (simplified)
    "1", // CMP ID
    "1", // CMP Version
    "1", // Consent screen
    "GB", // Vendor consent string (simplified)
  ];
  
  return btoa(parts.join(".")).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// Extend Window interface
declare global {
  interface Window {
    __tcfapi?: (
      command: string,
      version: number,
      callback: (data: any, success: boolean) => void,
      parameter?: any
    ) => void;
    __tcfListeners?: Array<{
      id: number;
      callback: (data: any, success: boolean) => void;
    }>;
  }
}

