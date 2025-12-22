"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_ROUTES } from "@/lib/admin-config";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(ADMIN_ROUTES.api.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success) {
        router.push(ADMIN_ROUTES.dashboard);
        router.refresh();
      } else {
        // Show specific error message from server
        setError(data.error || "Invalid password");
        
        // If rate limited, show remaining time
        if (data.locked && data.remainingMinutes) {
          setError(`Too many failed attempts. Please try again in ${data.remainingMinutes} minutes.`);
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);
      // More specific error messages
      if (err.message?.includes("fetch")) {
        setError("Cannot connect to server. Make sure the server is running.");
      } else {
        setError(err.message || "Failed to login. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Login</h1>
          <p className="text-gray-600">Enter your password to access the blog admin</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Admin Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter admin password"
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>

        {/* Back to Site */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← Back to site
          </a>
        </div>
      </div>
    </div>
  );
}
