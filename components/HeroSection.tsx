import HomeCompareForm from "@/components/HomeCompareForm";
import { TrendingUp, ArrowRight } from "lucide-react";
import Image from "next/image";
import { BRAND, TAGLINE } from "@/lib/brand";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-b from-slate-50 to-white py-12 sm:py-16 lg:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-block mb-6 sm:mb-8">
            <span className="bg-blue-50 text-blue-600 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold border border-blue-200">
              ✨ Free • No signup • Instant results
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 sm:mb-6 leading-tight px-4">
            <span className="block">Compare Trends.</span>
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Make Smarter Decisions.
            </span>
          </h1>

          {/* Subhead */}
          <p className="text-lg sm:text-xl text-slate-600 mb-10 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-4">
            Instantly visualize which topics are winning the conversation.
            Beautiful charts, real-time data, zero complexity.
          </p>


          {/* Form card */}
          <div className="max-w-4xl mx-auto mb-12 sm:mb-16 px-4">
            <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-xl border-2 border-slate-200">
              <HomeCompareForm />
            </div>
            <p className="text-sm text-slate-500 mt-4 sm:mt-5">
              Try:{" "}
              <Link
                href="/compare/chatgpt-vs-gemini"
                className="text-blue-600 hover:text-blue-700 underline underline-offset-2 font-medium"
              >
                chatgpt vs gemini
              </Link>{" "}
              or{" "}
              <Link
                href="/compare/iphone-vs-android"
                className="text-blue-600 hover:text-blue-700 underline underline-offset-2 font-medium"
              >
                iphone vs android
              </Link>
            </p>
          </div>

          {/* Sample chart preview */}
          <div className="max-w-5xl mx-auto bg-white rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10 border-2 border-slate-200">
            {/* Chart header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-800">
                  ChatGPT vs Gemini
                </h3>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                  LIVE DATA
                </span>
              </div>
              <div className="flex items-center gap-4 sm:gap-6 text-sm justify-center sm:justify-end">
                <span className="text-slate-500 font-medium">
                  Last 12 months
                </span>
                <Link
                  href="/compare/chatgpt-vs-gemini"
                  className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1.5 transition-colors"
                >
                  View full <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Mock chart */}
            <div className="relative h-56 sm:h-72 lg:h-80 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl overflow-hidden mb-8">
              {/* Grid */}
              <div className="absolute inset-0">
                <div className="h-full flex flex-col justify-between py-4 sm:py-8 px-4 sm:px-12">
                  {[...Array(5)].map((_, index) => (
                    <div
                      key={index}
                      className="w-full border-t border-slate-200"
                    />
                  ))}
                </div>
              </div>

              <svg
                className="absolute inset-0 w-full h-full p-4 sm:p-12"
                viewBox="0 0 1000 400"
                preserveAspectRatio="none"
              >
                {/* Blue line */}
                <path
                  d="M 0 300 L 100 280 L 200 250 L 300 220 L 400 200 L 500 180 L 600 160 L 700 140 L 800 120 L 900 100 L 1000 80"
                  stroke="#3B82F6"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  className="drop-shadow-lg"
                />
                <path
                  d="M 0 300 L 100 280 L 200 250 L 300 220 L 400 200 L 500 180 L 600 160 L 700 140 L 800 120 L 900 100 L 1000 80 L 1000 400 L 0 400 Z"
                  fill="url(#blueGradient)"
                  opacity="0.1"
                />

                {/* Purple line */}
                <path
                  d="M 0 350 L 100 345 L 200 340 L 300 330 L 400 310 L 500 280 L 600 240 L 700 200 L 800 170 L 900 150 L 1000 140"
                  stroke="#A855F7"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  className="drop-shadow-lg"
                />
                <path
                  d="M 0 350 L 100 345 L 200 340 L 300 330 L 400 310 L 500 280 L 600 240 L 700 200 L 800 170 L 900 150 L 1000 140 L 1000 400 L 0 400 Z"
                  fill="url(#purpleGradient)"
                  opacity="0.1"
                />

                <defs>
                  <linearGradient
                    id="blueGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#3B82F6"
                      stopOpacity="0.3"
                    />
                    <stop
                      offset="100%"
                      stopColor="#3B82F6"
                      stopOpacity="0"
                    />
                  </linearGradient>
                  <linearGradient
                    id="purpleGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#A855F7"
                      stopOpacity="0.3"
                    />
                    <stop
                      offset="100%"
                      stopColor="#A855F7"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Legend + stats */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center items-center">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-blue-500 rounded-full shadow-md" />
                <span className="text-base font-bold text-slate-800">
                  ChatGPT
                </span>
                <span className="text-xs text-green-700 bg-green-100 px-3 py-1.5 rounded-full font-semibold">
                  Leading +28%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-purple-500 rounded-full shadow-md" />
                <span className="text-base font-bold text-slate-800">
                  Gemini
                </span>
                <span className="text-xs text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full font-semibold">
                  Growing +45%
                </span>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-200">
              <div className="grid grid-cols-3 gap-4 sm:gap-6 text-center">
                <div className="bg-slate-50 rounded-xl p-4 sm:p-5">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-1">
                    2.4M
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600 font-medium">
                    Total searches
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 sm:p-5">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-1">
                    62%
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600 font-medium">
                    ChatGPT share
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 sm:p-5">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-1">
                    38%
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600 font-medium">
                    Gemini share
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Small FAQ anchor if you ever want to scroll link to here */}
          <div id="faq" className="mt-10" />
        </div>
      </div>
    </section>
  );
}
