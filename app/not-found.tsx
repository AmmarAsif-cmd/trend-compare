export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4">
      <h1 className="text-3xl font-semibold text-slate-900 mb-3">Page not found</h1>
      <p className="text-slate-600 mb-6">The page you are looking for does not exist or is not available right now.</p>
       {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 transition">
        Go back home
      </a>
    </main>
  );
}