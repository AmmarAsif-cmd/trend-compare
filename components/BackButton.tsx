"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton({ label = "Back" }: { label?: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-2 text-gray-700 hover:text-black font-medium transition-all bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl shadow-sm"
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
}
