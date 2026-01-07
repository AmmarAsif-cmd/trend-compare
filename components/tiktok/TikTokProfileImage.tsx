"use client";

import { useState, useEffect } from "react";
import { formatTikTokUsernameForDisplay } from "../../lib/tiktok-username-normalizer";

interface TikTokProfileImageProps {
  avatarUrl?: string | null;
  username: string;
  displayName?: string | null;
  size?: "small" | "medium" | "large";
  className?: string;
  showVerified?: boolean;
  verified?: boolean;
}

const SIZE_MAP = {
  small: "w-20 h-20", // 80px
  medium: "w-30 h-30", // 120px
  large: "w-60 h-60", // 240px
};

const TEXT_SIZE_MAP = {
  small: "text-2xl", // For initial
  medium: "text-3xl",
  large: "text-5xl",
};

/**
 * Default avatar component - shows user initial or TikTok icon
 */
function DefaultAvatar({
  username,
  size,
}: {
  username: string;
  size: "small" | "medium" | "large";
}) {
  const initial = username.charAt(0).toUpperCase();
  const textSize = TEXT_SIZE_MAP[size];

  return (
    <div
      className={`${SIZE_MAP[size]} rounded-full bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white font-bold ${textSize} shadow-lg`}
    >
      {initial}
    </div>
  );
}

/**
 * TikTok Profile Image Component
 * Displays user avatar with lazy loading, fallback, and error handling
 */
export default function TikTokProfileImage({
  avatarUrl,
  username,
  displayName,
  size = "medium",
  className = "",
  showVerified = false,
  verified = false,
}: TikTokProfileImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Reset error state when avatarUrl changes
  useEffect(() => {
    if (avatarUrl) {
      setImageError(false);
      setImageLoading(true);
    }
  }, [avatarUrl]);

  // If no avatar URL or error occurred, show default avatar
  if (!avatarUrl || imageError) {
    return (
      <div className={`relative ${className}`}>
        <DefaultAvatar username={username} size={size} />
        {showVerified && verified && (
          <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
            <svg
              className="w-4 h-4 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
    );
  }

  const sizeClasses = SIZE_MAP[size];
  const altText = displayName || formatTikTokUsernameForDisplay(username);

  return (
    <div className={`relative ${className}`}>
      {imageLoading && (
        <div
          className={`${sizeClasses} rounded-full bg-slate-200 animate-pulse absolute inset-0`}
        />
      )}
      <img
        src={avatarUrl}
        alt={altText}
        className={`${sizeClasses} rounded-full object-cover shadow-lg ${
          imageLoading ? "opacity-0" : "opacity-100"
        } transition-opacity duration-300`}
        loading="lazy"
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true);
          setImageLoading(false);
        }}
      />
      {showVerified && verified && (
        <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 shadow-lg">
          <svg
            className="w-4 h-4 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

