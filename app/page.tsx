"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toCanonicalSlug } from "@/lib/slug";

export default function Home() {
  const [k1, setK1] = useState("");
  const [k2, setK2] = useState("");
  const [k3, setK3] = useState("");
  const router = useRouter();

  function go() {
    const slug = toCanonicalSlug([k1, k2, k3].filter(Boolean));
    if (!slug) return alert("Enter at least two keywords");
    router.push(`/compare/${slug}`);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Compare keyword popularity</h1>
        <input className="border p-2 w-full rounded" placeholder="Keyword 1" value={k1} onChange={e=>setK1(e.target.value)} />
        <input className="border p-2 w-full rounded" placeholder="Keyword 2" value={k2} onChange={e=>setK2(e.target.value)} />
        <input className="border p-2 w-full rounded" placeholder="Keyword 3 (optional)" value={k3} onChange={e=>setK3(e.target.value)} />
        <button onClick={go} className="bg-black text-white px-4 py-2 rounded">Compare</button>
      </div>
    </main>
  );
}
