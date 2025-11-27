"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton({ label = "Back" }: { label?: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="group inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 font-semibold transition-all duration-300 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 px-5 py-2.5 rounded-lg shadow-sm hover:shadow-md hover:-translate-x-1"
      aria-label={label}
    >
      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
      {label}
    </button>
  );
}
