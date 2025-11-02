// components/HomeCompareForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toCanonicalSlug } from "@/lib/slug";

export default function HomeCompareForm() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const terms = [a.trim(), b.trim()].filter(Boolean);
    if (terms.length !== 2) return;
    const slug = toCanonicalSlug(terms);
    if (!slug) return;
    setLoading(true);
    router.push(`/compare/${slug}`);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Keyword 1</label>
          <input
            value={a}
            onChange={(e) => setA(e.target.value)}
            placeholder="e.g. chatgpt"
            autoComplete="off"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none ring-0 transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Keyword 2</label>
          <input
            value={b}
            onChange={(e) => setB(e.target.value)}
            placeholder="e.g. gemini"
            autoComplete="off"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none ring-0 transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </div>

      <button
  type="submit"
  disabled={!a.trim() || !b.trim() || loading}
  className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:translate-y-[1px] hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
>
  {loading ? "Comparing…" : "Compare"}
</button>

    </form>
  );
}
