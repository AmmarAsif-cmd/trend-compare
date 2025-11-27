// components/TrendIndicator.tsx
"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type TrendDirection = "up" | "down" | "stable";

interface TrendIndicatorProps {
  direction: TrendDirection;
  value?: string | number;
  label?: string;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export default function TrendIndicator({
  direction,
  value,
  label,
  size = "md",
  animated = true,
}: TrendIndicatorProps) {
  const sizeClasses = {
    sm: {
      icon: "w-4 h-4",
      text: "text-xs",
      badge: "px-2 py-1",
    },
    md: {
      icon: "w-5 h-5",
      text: "text-sm",
      badge: "px-3 py-1.5",
    },
    lg: {
      icon: "w-6 h-6",
      text: "text-base",
      badge: "px-4 py-2",
    },
  };

  const directionConfig = {
    up: {
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-gradient-to-r from-green-50 to-emerald-50",
      border: "border-green-200",
      label: "Trending Up",
    },
    down: {
      icon: TrendingDown,
      color: "text-red-600",
      bg: "bg-gradient-to-r from-red-50 to-rose-50",
      border: "border-red-200",
      label: "Trending Down",
    },
    stable: {
      icon: Minus,
      color: "text-slate-600",
      bg: "bg-gradient-to-r from-slate-50 to-slate-100",
      border: "border-slate-200",
      label: "Stable",
    },
  };

  const config = directionConfig[direction];
  const Icon = config.icon;
  const classes = sizeClasses[size];

  return (
    <div
      className={`inline-flex items-center gap-2 ${classes.badge} ${config.bg} ${config.border} border rounded-full font-semibold ${config.color} shadow-sm hover:shadow-md transition-all duration-200 ${animated ? "hover:scale-105" : ""}`}
    >
      <Icon className={`${classes.icon} ${animated ? "animate-pulse" : ""}`} />
      <span className={classes.text}>
        {label || config.label}
        {value && <span className="ml-1 font-bold">{value}</span>}
      </span>
    </div>
  );
}

// Simple version for inline use
export function TrendIcon({
  direction,
  className = "",
}: {
  direction: TrendDirection;
  className?: string;
}) {
  const directionConfig = {
    up: {
      icon: TrendingUp,
      color: "text-green-600",
    },
    down: {
      icon: TrendingDown,
      color: "text-red-600",
    },
    stable: {
      icon: Minus,
      color: "text-slate-600",
    },
  };

  const config = directionConfig[direction];
  const Icon = config.icon;

  return <Icon className={`${config.color} ${className}`} />;
}
