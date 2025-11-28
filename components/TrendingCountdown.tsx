"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface Props {
  expiresIn: number; // Milliseconds until refresh
}

export default function TrendingCountdown({ expiresIn }: Props) {
  const [timeLeft, setTimeLeft] = useState(expiresIn);

  useEffect(() => {
    setTimeLeft(expiresIn);

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresIn]);

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  if (timeLeft <= 0) {
    return (
      <div className="flex items-center justify-center gap-2 mt-3 text-xs text-emerald-600 font-medium">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        <span>Updating with fresh data...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-3 text-xs text-slate-600">
      <Clock className="w-3.5 h-3.5 text-purple-500" />
      <span>
        Next update in{" "}
        <span className="font-mono font-semibold text-purple-600">
          {hours > 0 && `${hours}h `}
          {minutes}m {seconds}s
        </span>
      </span>
    </div>
  );
}
