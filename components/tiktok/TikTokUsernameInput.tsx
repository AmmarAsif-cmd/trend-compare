"use client";

import { useState, useEffect, useCallback } from "react";
import { normalizeTikTokUsername, formatTikTokUsernameForDisplay, isValidTikTokUsername } from "@/lib/tiktok-username-normalizer";
import TikTokProfileImage from "./TikTokProfileImage";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";

interface TikTokUsernameInputProps {
  value?: string;
  onChange?: (value: string, normalized: string | null) => void;
  onValidationChange?: (isValid: boolean, error?: string) => void;
  placeholder?: string;
  className?: string;
  showPreview?: boolean;
  autoValidate?: boolean;
  disabled?: boolean;
}

interface UserPreview {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  verified?: boolean;
}

/**
 * TikTok Username Input Component
 * Handles username input with real-time validation and profile preview
 */
export default function TikTokUsernameInput({
  value = "",
  onChange,
  onValidationChange,
  placeholder = "@username",
  className = "",
  showPreview = true,
  autoValidate = true,
  disabled = false,
}: TikTokUsernameInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [normalizedUsername, setNormalizedUsername] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<UserPreview | null>(null);

  // Validate and normalize username
  const validateUsername = useCallback(async (input: string) => {
    if (!input.trim()) {
      setIsValid(null);
      setError(null);
      setNormalizedUsername(null);
      setPreview(null);
      onValidationChange?.(false);
      return;
    }

    const normalized = normalizeTikTokUsername(input);
    setNormalizedUsername(normalized);

    if (!normalized) {
      setIsValid(false);
      setError("Invalid username format. Use @username or username");
      onValidationChange?.(false, "Invalid username format");
      setPreview(null);
      return;
    }

    if (!isValidTikTokUsername(normalized)) {
      setIsValid(false);
      setError("Invalid username format");
      onValidationChange?.(false, "Invalid username format");
      setPreview(null);
      return;
    }

    // Username format is valid
    setIsValid(true);
    setError(null);
    onValidationChange?.(true);

    // If showPreview is enabled, fetch user data
    if (showPreview && autoValidate) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/tiktok/user/${normalized}`);
        if (response.ok) {
          const userData = await response.json();
          setPreview({
            username: userData.username,
            displayName: userData.displayName,
            avatarUrl: userData.avatarUrl,
            verified: userData.verified,
          });
        } else if (response.status === 404) {
          setError("Username not found on TikTok");
          setIsValid(false);
          onValidationChange?.(false, "Username not found");
          setPreview(null);
        } else {
          // API error but username format is valid
          setPreview(null);
        }
      } catch (err) {
        // Network error - username format is still valid
        console.error("Error fetching user preview:", err);
        setPreview(null);
      } finally {
        setIsLoading(false);
      }
    }
  }, [showPreview, autoValidate, onValidationChange]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue, normalizeTikTokUsername(newValue));
    
    if (autoValidate) {
      // Debounce validation
      const timeoutId = setTimeout(() => {
        validateUsername(newValue);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  };

  // Sync with external value changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
      if (autoValidate && value) {
        validateUsername(value);
      }
    }
  }, [value, autoValidate]);

  // Initial validation
  useEffect(() => {
    if (autoValidate && value) {
      validateUsername(value);
    }
  }, []);

  const displayValue = inputValue || "";
  const hasValue = displayValue.trim().length > 0;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`
              w-full px-4 py-3 pr-10
              border-2 rounded-lg
              text-base
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2
              disabled:bg-slate-100 disabled:cursor-not-allowed
              ${
                isValid === true
                  ? "border-green-500 focus:ring-green-500"
                  : isValid === false
                  ? "border-red-500 focus:ring-red-500"
                  : "border-slate-300 focus:ring-indigo-500"
              }
            `}
          />
          {/* Status Icon */}
          {hasValue && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
              ) : isValid === true ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : isValid === false ? (
                <XCircle className="w-5 h-5 text-red-500" />
              ) : null}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {isValid === true && normalizedUsername && !error && (
          <div className="mt-2 text-sm text-green-600">
            Valid: {formatTikTokUsernameForDisplay(normalizedUsername)}
          </div>
        )}
      </div>

      {/* Profile Preview */}
      {showPreview && preview && (
        <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-4">
            <TikTokProfileImage
              avatarUrl={preview.avatarUrl}
              username={preview.username}
              displayName={preview.displayName}
              size="medium"
              showVerified
              verified={preview.verified}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">
                  {formatTikTokUsernameForDisplay(preview.username)}
                </span>
                {preview.verified && (
                  <span className="text-blue-500" title="Verified">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </div>
              {preview.displayName && (
                <div className="text-sm text-slate-600 mt-1">
                  {preview.displayName}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

