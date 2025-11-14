"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4">
      <h1 className="text-3xl font-semibold text-slate-900 mb-3">Something went wrong</h1>
      <p className="text-slate-600 mb-6">Please try again. If it keeps happening, come back later.</p>
      <button onClick={() => reset()} className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 transition">
        Try again
      </button>
    </main>
  );
}
     