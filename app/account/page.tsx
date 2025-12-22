"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";

type UserData = {
  email: string;
  name: string | null;
  subscriptionTier: string;
  subscription: {
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
};

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const success = searchParams.get("success");

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/user/me");
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login?redirect=/account");
          return;
        }
        throw new Error(data.error || "Failed to fetch user data");
      }

      setUserData(data.user);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);

    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to open portal");
      }

      // Redirect to Stripe customer portal
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error opening portal:", error);
      alert("Failed to open subscription management. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-gray-500">Loading account...</div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to view your account</p>
          <Link
            href="/login?redirect=/account"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  const isPremium = userData.subscriptionTier === "premium";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              TrendArc
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">
              Welcome to Premium! Your subscription is now active.
            </p>
          </div>
        )}

        {/* Account Overview */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Account Settings
              </h1>
              <p className="text-gray-600">Manage your subscription and account details</p>
            </div>
            <div
              className={`px-4 py-2 rounded-full font-semibold text-sm ${
                isPremium
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {isPremium ? "Premium" : "Free"}
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <p className="text-gray-900">{userData.email}</p>
            </div>
            {userData.name && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <p className="text-gray-900">{userData.name}</p>
              </div>
            )}
          </div>

          {/* Subscription Details */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Subscription
            </h2>

            {isPremium && userData.subscription ? (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Premium Plan
                    </h3>
                    <p className="text-sm text-gray-600">
                      Status:{" "}
                      <span className="font-medium capitalize">
                        {userData.subscription.status}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">$4.99</p>
                    <p className="text-sm text-gray-600">/month</p>
                  </div>
                </div>

                {userData.subscription.currentPeriodEnd && (
                  <div className="text-sm text-gray-600 mb-4">
                    {userData.subscription.cancelAtPeriodEnd ? (
                      <p className="text-amber-700">
                        Your subscription will end on{" "}
                        {new Date(
                          userData.subscription.currentPeriodEnd
                        ).toLocaleDateString()}
                      </p>
                    ) : (
                      <p>
                        Next billing date:{" "}
                        {new Date(
                          userData.subscription.currentPeriodEnd
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                <div className="bg-white/60 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Premium Features
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Rich AI insights with category analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Trend predictions and forecasts
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      All timeframes and geographic breakdowns
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Ad-free experience
                    </li>
                  </ul>
                </div>

                <button
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="w-full px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {portalLoading ? "Loading..." : "Manage Subscription"}
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Free Plan</h3>
                <p className="text-sm text-gray-600 mb-4">
                  You're currently on the free plan. Upgrade to Premium to unlock
                  advanced AI insights and features.
                </p>

                <Link
                  href="/pricing"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Upgrade to Premium
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
