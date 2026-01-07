"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TikTokUsernameInputWithAutocomplete from "./TikTokUsernameInputWithAutocomplete";
import { normalizeTikTokUsername } from "@/lib/tiktok-username-normalizer";
import { ArrowRight, Loader2 } from "lucide-react";

export default function TikTokCompareForm() {
  const router = useRouter();
  const [usernameA, setUsernameA] = useState("");
  const [usernameB, setUsernameB] = useState("");
  const [normalizedA, setNormalizedA] = useState<string | null>(null);
  const [normalizedB, setNormalizedB] = useState<string | null>(null);
  const [isValidA, setIsValidA] = useState(false);
  const [isValidB, setIsValidB] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Strict validation - must have normalized usernames AND they must be valid
    if (!normalizedA || !normalizedB) {
      setError("Please enter two valid TikTok usernames");
      return;
    }

    if (normalizedA === normalizedB) {
      setError("Please enter two different usernames");
      return;
    }

    // Both must be validated as existing users
    if (!isValidA || !isValidB) {
      if (!isValidA && !isValidB) {
        setError("Both usernames must be valid and exist on TikTok");
      } else if (!isValidA) {
        setError("First username is invalid or not found on TikTok");
      } else {
        setError("Second username is invalid or not found on TikTok");
      }
      return;
    }

    // Double-check normalization
    const finalA = normalizeTikTokUsername(normalizedA);
    const finalB = normalizeTikTokUsername(normalizedB);
    
    if (!finalA || !finalB) {
      setError("Invalid username format. Please check your input");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create comparison slug
      const slug = [finalA, finalB].sort().join("-vs-");
      
      // Navigate to comparison page
      router.push(`/tiktok/compare/${slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create comparison");
      setIsSubmitting(false);
    }
  };

  const canCompare = isValidA && isValidB && normalizedA && normalizedB && normalizedA !== normalizedB;

  return (
    <form
      onSubmit={handleCompare}
      className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/30"
    >
      <div className="space-y-6">
        {/* Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User A */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              First Creator
            </label>
            <TikTokUsernameInputWithAutocomplete
              value={usernameA}
              onChange={(value, normalized) => {
                setUsernameA(value);
                setNormalizedA(normalized);
              }}
              onValidationChange={(isValid) => setIsValidA(isValid)}
              placeholder="@username"
              showPreview={true}
              autoValidate={true}
              className="bg-white"
            />
          </div>

          {/* User B */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              Second Creator
            </label>
            <TikTokUsernameInputWithAutocomplete
              value={usernameB}
              onChange={(value, normalized) => {
                setUsernameB(value);
                setNormalizedB(normalized);
              }}
              onValidationChange={(isValid) => setIsValidB(isValid)}
              placeholder="@username"
              showPreview={true}
              autoValidate={true}
              className="bg-white"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!canCompare || isSubmitting}
          className="w-full bg-white text-indigo-600 font-bold py-4 px-6 rounded-xl hover:bg-indigo-50 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Comparing...</span>
            </>
          ) : (
            <>
              <span>Compare Creators</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

