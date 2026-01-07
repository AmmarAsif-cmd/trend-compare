"use client";

/**
 * Default Avatar Component
 * Used as fallback when profile image is missing or fails to load
 */

interface DefaultAvatarProps {
  username: string;
  size?: "small" | "medium" | "large";
  className?: string;
}

const SIZE_MAP = {
  small: "w-20 h-20", // 80px (5rem)
  medium: "w-[120px] h-[120px]", // 120px (7.5rem)
  large: "w-60 h-60", // 240px (15rem)
};

const TEXT_SIZE_MAP = {
  small: "text-2xl",
  medium: "text-3xl",
  large: "text-5xl",
};

/**
 * Default Avatar - Shows user's first initial in a gradient circle
 */
export default function DefaultAvatar({
  username,
  size = "medium",
  className = "",
}: DefaultAvatarProps) {
  const initial = username.charAt(0).toUpperCase();
  const sizeClasses = SIZE_MAP[size];
  const textSize = TEXT_SIZE_MAP[size];

  return (
    <div
      className={`${sizeClasses} ${className} rounded-full bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white font-bold ${textSize} shadow-lg`}
      role="img"
      aria-label={`${username} avatar`}
    >
      {initial}
    </div>
  );
}

