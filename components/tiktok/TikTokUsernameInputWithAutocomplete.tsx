"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

// Popular TikTok usernames for autocomplete
const POPULAR_TIKTOK_USERS = [
  "charlidamelio",
  "addisonre",
  "zachking",
  "lorengray",
  "spencerx",
  "babyariel",
  "riyaz.14",
  "tiktok",
  "willsmith",
  "therock",
  "justinbieber",
  "selenagomez",
  "kyliejenner",
  "kimkardashian",
  "cristiano",
  "khloekardashian",
  "natgeo",
  "nike",
  "nba",
  "nfl",
];

/**
 * TikTok Username Input Component with Autocomplete
 * Handles username input with real-time validation, autocomplete, and profile preview
 */
export default function TikTokUsernameInputWithAutocomplete({
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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input with real-time API verification
  useEffect(() => {
    const updateSuggestions = async () => {
      if (!inputValue.trim()) {
        setSuggestions(POPULAR_TIKTOK_USERS.slice(0, 5));
        setShowSuggestions(true);
        return;
      }

      const query = inputValue.toLowerCase().replace(/^@/, '').trim();
      
      // If query is too short, show popular users
      if (query.length < 2) {
        const filtered = POPULAR_TIKTOK_USERS.filter((user) =>
          user.toLowerCase().startsWith(query)
        );
        setSuggestions(filtered.slice(0, 8));
        setShowSuggestions(filtered.length > 0);
        return;
      }

      // Check if the current input is a valid username format
      const normalized = normalizeTikTokUsername(inputValue);
      const suggestionsList: string[] = [];

      // If normalized input is valid and has at least 2 characters, check if it exists
      if (normalized && isValidTikTokUsername(normalized) && normalized.length >= 2) {
        try {
          const response = await fetch(`/api/tiktok/user/${normalized}`, {
            method: 'GET',
            cache: 'no-store', // Always fetch fresh data
          });
          
          if (response.ok) {
            const userData = await response.json();
            if (userData.username) {
              // User exists - add to top of suggestions
              suggestionsList.push(normalized);
            }
          }
        } catch (err) {
          // Silently fail - don't block suggestions
          console.debug(`[Autocomplete] Failed to verify ${normalized}:`, err);
        }
      }

      // Add popular users that match the query
      const filtered = POPULAR_TIKTOK_USERS.filter(
        (user) =>
          user.toLowerCase().includes(query) ||
          user.toLowerCase().startsWith(query)
      );

      // Combine and deduplicate
      const combined = [...suggestionsList, ...filtered].filter(
        (value, index, self) => self.indexOf(value) === index
      );

      setSuggestions(combined.slice(0, 8));
      setShowSuggestions(combined.length > 0 && inputValue.trim().length > 0);
    };

    // Debounce suggestion updates
    const timeoutId = setTimeout(updateSuggestions, 200);
    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Validate and normalize username
  const validateUsername = useCallback(async (input: string) => {
    // Clear previous state
    setPreview(null);
    
    if (!input.trim()) {
      setIsValid(null);
      setError(null);
      setNormalizedUsername(null);
      onValidationChange?.(false);
      return;
    }

    // Step 1: Immediate format validation (no API call)
    const normalized = normalizeTikTokUsername(input);
    setNormalizedUsername(normalized);

    if (!normalized) {
      setIsValid(false);
      setError("Invalid username format. Must be 1-24 characters, alphanumeric with underscores and periods only");
      onValidationChange?.(false, "Invalid username format");
      return;
    }

    if (!isValidTikTokUsername(normalized)) {
      setIsValid(false);
      const errorMsg = normalized.startsWith('_') || normalized.startsWith('.')
        ? "Cannot start with underscore or period"
        : normalized.endsWith('.')
        ? "Cannot end with period"
        : normalized.includes('..')
        ? "Cannot have consecutive periods"
        : "Invalid username format";
      setError(errorMsg);
      onValidationChange?.(false, "Invalid username format");
      return;
    }

    // Step 2: Format is valid, now check if user exists (only if autoValidate is enabled)
    if (showPreview && autoValidate) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/tiktok/user/${normalized}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const responseData = await response.json().catch(() => ({}));

        if (response.ok && responseData.username) {
          // User exists - mark as valid
          setIsValid(true);
          setError(null);
          onValidationChange?.(true);
          setPreview({
            username: responseData.username,
            displayName: responseData.displayName,
            avatarUrl: responseData.avatarUrl,
            verified: responseData.verified,
          });
        } else if (response.status === 404 || responseData.error?.includes('not found')) {
          // User not found - mark as invalid
          setError("Username not found on TikTok. Please check the spelling.");
          setIsValid(false);
          onValidationChange?.(false, "Username not found");
        } else if (response.status === 503 || responseData.error?.includes('not configured')) {
          // API not configured
          setIsValid(null);
          setError("TikTok API is not configured. Please contact support.");
          onValidationChange?.(false, "API not configured");
        } else {
          // Other API error - format is valid but can't verify existence
          setIsValid(null);
          setError("Unable to verify username. Please try again later.");
          onValidationChange?.(false, "Verification failed");
          console.warn(`[TikTok Validation] API error for ${normalized}:`, response.status, responseData);
        }
      } catch (err) {
        // Network error - format is valid but can't verify
        setIsValid(null);
        setError("Network error. Please check your connection.");
        onValidationChange?.(false, "Network error");
        console.error("[TikTok Validation] Error fetching user preview:", err);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Format is valid but not checking existence
      setIsValid(true);
      setError(null);
      onValidationChange?.(true);
    }
  }, [showPreview, autoValidate, onValidationChange]);

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Immediate format validation (no debounce)
    const normalized = normalizeTikTokUsername(newValue);
    onChange?.(newValue, normalized);
    setSelectedIndex(-1);
    
    // Immediate format check
    if (!newValue.trim()) {
      setIsValid(null);
      setError(null);
      setNormalizedUsername(null);
      setPreview(null);
      onValidationChange?.(false);
      return;
    }
    
    // Check format immediately
    if (!normalized || !isValidTikTokUsername(normalized)) {
      setIsValid(false);
      setError("Invalid username format. Must be 1-24 characters, alphanumeric with underscores only");
      onValidationChange?.(false, "Invalid username format");
      setPreview(null);
      return;
    }
    
    // Format is valid - debounce API call
    if (autoValidate) {
      setIsLoading(true);
      debounceTimerRef.current = setTimeout(() => {
        validateUsername(newValue);
      }, 500); // Slightly longer debounce for API calls
    } else {
      // Format valid but not checking existence
      setIsValid(true);
      setError(null);
      setNormalizedUsername(normalized);
      onValidationChange?.(true);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  // Select a suggestion
  const selectSuggestion = (username: string) => {
    setInputValue(username);
    onChange?.(username, normalizeTikTokUsername(username));
    setShowSuggestions(false);
    setSelectedIndex(-1);
    validateUsername(username);
    inputRef.current?.blur();
  };

  // Sync with external value changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
      if (autoValidate && value) {
        validateUsername(value);
      } else if (value) {
        // Just normalize without API call
        const normalized = normalizeTikTokUsername(value);
        setNormalizedUsername(normalized);
        if (normalized && isValidTikTokUsername(normalized)) {
          setIsValid(true);
          setError(null);
          onValidationChange?.(true);
        } else {
          setIsValid(false);
          setError("Invalid username format");
          onValidationChange?.(false, "Invalid username format");
        }
      }
    }
  }, [value, autoValidate, validateUsername, onValidationChange]);

  // Initial validation
  useEffect(() => {
    if (autoValidate && value) {
      validateUsername(value);
    } else if (value) {
      const normalized = normalizeTikTokUsername(value);
      setNormalizedUsername(normalized);
      if (normalized && isValidTikTokUsername(normalized)) {
        setIsValid(true);
        setError(null);
        onValidationChange?.(true);
      }
    }
  }, []);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const displayValue = inputValue || "";
  const hasValue = displayValue.trim().length > 0;

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(suggestions.length > 0)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full px-4 py-3 pr-10
            border-2 rounded-lg
            text-base text-slate-900
            bg-white
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

      {/* Autocomplete Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border-2 border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((suggestion, index) => {
            // Check if this suggestion matches the current input (verified user)
            const isVerified = suggestion === normalizedUsername && isValid === true;
            return (
              <button
                key={suggestion}
                type="button"
                onClick={() => selectSuggestion(suggestion)}
                className={`
                  w-full px-4 py-2 text-left text-sm hover:bg-indigo-50 transition-colors
                  flex items-center gap-2
                  ${selectedIndex === index ? "bg-indigo-50" : ""}
                  ${isVerified ? "bg-green-50 hover:bg-green-100" : ""}
                `}
              >
                <span className="text-slate-400">@</span>
                <span className="text-slate-900 font-medium flex-1">{suggestion}</span>
                {isVerified && (
                  <span className="text-green-600 text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

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

