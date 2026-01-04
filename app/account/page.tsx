"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { User, LogOut, Settings, ArrowLeft, Edit2, Trash2, Save, X } from "lucide-react";

type UserData = {
  email: string;
  name: string | null;
};

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setNameValue(data.user.name || "");
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!userData) return;
    
    setUpdating(true);
    setError(null);
    
    try {
      const response = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameValue.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update name");
      }

      setUserData({ ...userData, name: data.user.name });
      setIsEditingName(false);
    } catch (error: any) {
      console.error("Error updating name:", error);
      setError(error.message || "Failed to update name");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete account");
      }

      // Sign out and redirect to home
      await signOut({ callbackUrl: "/" });
    } catch (error: any) {
      console.error("Error deleting account:", error);
      setError(error.message || "Failed to delete account");
      setDeleteConfirm(false);
    } finally {
      setDeleting(false);
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


        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2">
                Account Settings
              </h1>
              <p className="text-slate-600">Manage your account details</p>
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
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-slate-900 font-medium">{userData.email}</p>
              </div>
              <p className="mt-1 text-xs text-slate-500">Email cannot be changed</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">
                  Display Name
                </label>
                {!isEditingName && (
                  <button
                    onClick={() => {
                      setIsEditingName(true);
                      setNameValue(userData.name || "");
                      setError(null);
                    }}
                    className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                )}
              </div>
              
              {isEditingName ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    placeholder="Enter your name"
                    maxLength={100}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={updating}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateName}
                      disabled={updating}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      {updating ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingName(false);
                        setNameValue(userData.name || "");
                        setError(null);
                      }}
                      disabled={updating}
                      className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-slate-900 font-medium">
                    {userData.name || "No name set"}
                  </p>
                </div>
              )}
            </div>
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

              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all group ${
                  deleteConfirm
                    ? "border-red-500 bg-red-50 hover:bg-red-100"
                    : "border-red-200 hover:border-red-300 hover:bg-red-50/50"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {deleteConfirm ? "Confirm Delete Account" : "Delete Account"}
                    </p>
                    <p className="text-sm text-slate-600">
                      {deleteConfirm
                        ? "This action cannot be undone. Click again to confirm."
                        : "Permanently delete your account and all data"}
                    </p>
                  </div>
                </div>
                <Trash2 className="w-5 h-5 text-slate-400 group-hover:text-red-600 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
