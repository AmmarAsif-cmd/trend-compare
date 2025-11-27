"use client";

import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

export default function BackButton({ label = "Back to Home" }: { label?: string }) {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 font-semibold transition-all duration-300 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 px-5 py-2.5 rounded-lg shadow-sm hover:shadow-md hover:-translate-x-1"
      aria-label={label}
    >
      <Home className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
      {label}
    </Link>
  );
}
