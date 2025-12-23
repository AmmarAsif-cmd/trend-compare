"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { User, Crown, Check, LogOut, Settings, ArrowLeft, Sparkles } from "lucide-react";

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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth-state-change'));
    }
    await signOut({ callbackUrl: "/" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading account...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">Please log in to view your account</p>
          <Link
            href="/login?redirect=/account"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  const isPremium = userData.subscriptionTier === "premium";

  return (
    <div>
      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-white" />
              </div>
              <p className="text-emerald-900 font-medium">
                Welcome to Premium! Your subscription is now active.
              </p>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2">
                Account Settings
              </h1>
              <p className="text-slate-600">Manage your subscription and account details</p>
            </div>
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm ${
                isPremium
                  ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {isPremium ? (
                <>
                  <Crown className="w-4 h-4" />
                  Premium
                </>
              ) : (
                <>
                  <User className="w-4 h-4" />
                  Free
                </>
              )}
            </div>
          </div>
        </div>

        {/* Account Overview Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-pink-50/80 px-6 py-5 border-b border-slate-200/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Account Information</h2>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-slate-900 font-medium">{userData.email}</p>
              </div>
            </div>
            {userData.name && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Display Name
                </label>
                <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-slate-900 font-medium">{userData.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Subscription Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-pink-50/80 px-6 py-5 border-b border-slate-200/60">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${isPremium ? 'bg-gradient-to-br from-indigo-600 to-purple-600' : 'bg-slate-400'} rounded-lg flex items-center justify-center`}>
                {isPremium ? (
                  <Crown className="w-5 h-5 text-white" />
                ) : (
                  <Settings className="w-5 h-5 text-white" />
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-900">Subscription</h2>
            </div>
          </div>

          <div className="p-6">
            {isPremium && userData.subscription ? (
              <div className="space-y-6">
                {/* Premium Plan Info */}
                <div className="bg-gradient-to-br from-indigo-50 via-purple-50/50 to-pink-50/50 rounded-xl p-6 border border-indigo-200/50">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-lg font-bold text-slate-900">Premium Plan</h3>
                      </div>
                      <p className="text-sm text-slate-600">
                        Status:{" "}
                        <span className="font-semibold capitalize text-slate-900">
                          {userData.subscription.status}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        $4.99
                      </p>
                      <p className="text-sm text-slate-600">/month</p>
                    </div>
                  </div>

                  {userData.subscription.currentPeriodEnd && (
                    <div className="mb-6 p-4 bg-white/60 rounded-lg border border-slate-200">
                      {userData.subscription.cancelAtPeriodEnd ? (
                        <p className="text-sm text-amber-700 font-medium">
                          ⚠️ Your subscription will end on{" "}
                          {new Date(
                            userData.subscription.currentPeriodEnd
                          ).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-700">
                          Next billing date:{" "}
                          <span className="font-semibold">
                            {new Date(
                              userData.subscription.currentPeriodEnd
                            ).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Premium Features */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      Premium Features
                    </h4>
                    <ul className="space-y-2.5">
                      {[
                        "Rich AI insights with category analysis",
                        "Trend predictions and forecasts",
                        "All timeframes (7d, 30d, 12m, 5y, all-time)",
                        "Geographic breakdowns by country",
                        "CSV/JSON data export",
                        "PDF report downloads",
                        "Ad-free experience",
                        "Priority support",
                      ].map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-3">
                          <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-emerald-600" />
                          </div>
                          <span className="text-sm text-slate-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className="w-full px-6 py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {portalLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <Settings className="w-4 h-4" />
                        Manage Subscription
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center gap-3 mb-4">
                    <User className="w-6 h-6 text-slate-400" />
                    <h3 className="text-lg font-semibold text-slate-900">Free Plan</h3>
                  </div>
                  <p className="text-sm text-slate-600 mb-6">
                    You're currently on the free plan. Upgrade to Premium to unlock advanced AI insights, 
                    unlimited comparisons, and professional features.
                  </p>

                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    <Crown className="w-4 h-4" />
                    Upgrade to Premium
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Account Actions</h2>
            <div className="space-y-3">
              <Link
                href="/dashboard"
                className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                    <Settings className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">View Dashboard</p>
                    <p className="text-sm text-slate-600">Manage your saved comparisons</p>
                  </div>
                </div>
                <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors rotate-180" />
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-4 rounded-lg border border-red-200 hover:border-red-300 hover:bg-red-50/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                    <LogOut className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Sign Out</p>
                    <p className="text-sm text-slate-600">Log out of your account</p>
                  </div>
                </div>
                <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-600 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
