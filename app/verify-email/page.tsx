"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error" | "pending">(
    token ? "loading" : "pending"
  );
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  // Auto-verify if token is present
  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${verificationToken}`);
      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/login?verified=true");
        }, 2000);
      } else {
        setStatus("error");
        setError(data.error || "Verification failed");
      }
    } catch (err: any) {
      setStatus("error");
      setError("Failed to verify email. Please try again.");
    }
  };

  const resendVerificationEmail = async () => {
    if (!email) {
      setError("Email address is required");
      return;
    }

    setResending(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setError(null);
        alert("Verification email sent! Please check your inbox.");
      } else {
        setError(data.error || "Failed to resend verification email");
      }
    } catch (err: any) {
      setError("Failed to resend verification email. Please try again.");
    } finally {
      setResending(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email</h1>
          <p className="text-gray-600">Please wait while we verify your email address...</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
          <p className="text-gray-600 mb-6">
            Your email address has been successfully verified. You can now log in to your account.
          </p>
          <Link
            href="/login?verified=true"
            className="block w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-center"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
          <p className="text-gray-600 mb-6">
            {error || "The verification link is invalid or has expired."}
          </p>
          {email && (
            <button
              onClick={resendVerificationEmail}
              disabled={resending}
              className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3"
            >
              {resending ? "Sending..." : "Resend Verification Email"}
            </button>
          )}
          <Link
            href="/login"
            className="block w-full py-2 px-4 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors text-center"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  // Pending verification
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
        <p className="text-gray-600 mb-4">
          We've sent a verification email to <strong>{email || "your email address"}</strong>.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Please click the link in the email to verify your account. The link will expire in 24 hours.
        </p>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        <div className="space-y-3">
          {email && (
            <button
              onClick={resendVerificationEmail}
              disabled={resending}
              className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Sending...
                </>
              ) : (
                "Resend Verification Email"
              )}
            </button>
          )}
          <Link
            href="/login"
            className="block w-full py-2 px-4 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

