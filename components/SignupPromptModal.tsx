"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, Sparkles, TrendingUp, BarChart3 } from "lucide-react";

interface SignupPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignup: () => void;
  dismissible?: boolean; // Allow modal to be dismissed (default: true)
}

export default function SignupPromptModal({
  isOpen,
  onClose,
  onSignup,
  dismissible = true,
}: SignupPromptModalProps) {
  const router = useRouter();
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const handleSignup = () => {
    // Close modal first
    onClose(); // Always close modal when navigating
    // Call onSignup callback (clears tracking)
    onSignup();
    // Navigate to signup
    router.push("/signup");
  };

  const handleLogin = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Close modal first
    onClose(); // Always close modal when navigating
    // Link will handle navigation automatically
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
      onClick={dismissible ? handleClose : undefined}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-transform ${
          isClosing ? "scale-95" : "scale-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button - only show if dismissible */}
        {dismissible && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Content */}
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Sign Up for Unlimited Comparisons
          </h2>

          {/* Description */}
          <p className="text-gray-600 mb-6">
            {dismissible 
              ? "You've viewed your free comparison! Sign up for a free account to get unlimited comparisons and access to all features."
              : "You've reached your free comparison limit. Please sign up to continue viewing comparisons."}
          </p>

          {/* Benefits */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-gray-900 mb-3">
              With a free account, you get:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start text-sm text-gray-700">
                <TrendingUp className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Unlimited trend comparisons</span>
              </li>
              <li className="flex items-start text-sm text-gray-700">
                <BarChart3 className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Save your favorite comparisons</span>
              </li>
              <li className="flex items-start text-sm text-gray-700">
                <Sparkles className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Access to all AI insights and predictions</span>
              </li>
              <li className="flex items-start text-sm text-gray-700">
                <TrendingUp className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Email alerts for trend changes</span>
              </li>
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSignup}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Create Free Account
            </button>
            <Link
              href="/login"
              className="flex-1 border-2 border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all text-center"
              onClick={(e) => {
                handleLogin(e);
                // Link will handle navigation
              }}
            >
              Already have an account?
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

