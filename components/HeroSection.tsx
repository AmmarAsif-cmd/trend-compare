import HomeCompareForm from "@/components/HomeCompareForm";
import { TrendingUp, ArrowRight } from "lucide-react";
import Image from "next/image";
import { BRAND, TAGLINE } from "@/lib/brand";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-b from-slate-50 to-white py-10 sm:py-16 lg:py-5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center">
          {/* Badge */}
          <div className="inline-block mb-4 sm:mb-6">
            <span className="bg-blue-50 text-blue-600 px-3 sm:px-4 py-2 sm:py-2.0 rounded-full text-xs sm:text-xm font-semibold border border-blue-200">
              ✨ Free • No signup • Instant results
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[2.5rem] xl:text-[2.5rem] font-bold text-slate-900 mb-3 sm:mb-4 leading-tight">
            <span className="block">Compare Trends.</span>
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Make Smarter Decisions.
            </span>
          </h1>

          {/* Subhead */}
          <p className="text-base sm:text-lg md:text-xl text-slate-600 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
            Instantly visualize which topics are winning the conversation.
            Beautiful charts, real-time data, zero complexity.
          </p>


          {/* Form card - your existing HomeCompareForm inside the new shell */}
          <div className="max-w-4xl mx-auto mb-8 sm:mb-12 px-2">
            <div className="max-w-4xl bg-white p-2 sm:p-4 rounded-lg sm:rounded-2xl shadow-xl sm:shadow-2xl border border-slate-200 sm:border-2">
              <HomeCompareForm />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-3 sm:mt-4 px-2">
              Try:{" "}
              <Link
                href="/compare/chatgpt-vs-gemini"
                className="underline underline-offset-2"
              >
                chatgpt vs gemini
              </Link>{" "}
              or{" "}
              <Link
                href="/compare/iphone-vs-android"
                className="underline underline-offset-2"
              >
                iphone vs android
              </Link>
            </p>
          </div>

          {/* Sample chart preview */}
          <div className="max-w-5xl mx-auto bg-white rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl p-4 sm:p-6 lg:p-10 border border-slate-200 sm:border-2">
            {/* Chart header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-6 sm:mb-8">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center sm:justify-start">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800">
                  ChatGPT vs Gemini
                </h3>
                <span className="bg-green-100 text-green-700 px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                  LIVE DATA
                </span>
              </div>
              <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm justify-center sm:justify-end">
                <span className="text-slate-500 font-medium">
                  Last 12 months
                </span>
                <Link
                  href="/compare/chatgpt-vs-gemini"
                  className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                >
                  View full <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </Link>
              </div>
            </div>

            {/* Mock chart */}
            <div className="relative h-48 sm:h-64 lg:h-80 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-lg sm:rounded-xl overflow-hidden mb-6 sm:mb-8">
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
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center items-start sm:items-center mb-6 sm:mb-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 rounded-full shadow-lg" />
                <span className="text-sm sm:text-base font-bold text-slate-800">
                  ChatGPT
                </span>
                <span className="text-xs text-green-700 bg-green-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-semibold whitespace-nowrap">
                  Leading +28%
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-4 h-4 sm:w-5 sm:h-5 bg-purple-500 rounded-full shadow-lg" />
                <span className="text-sm sm:text-base font-bold text-slate-800">
                  Gemini
                </span>
                <span className="text-xs text-blue-700 bg-blue-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-semibold whitespace-nowrap">
                  Growing +45%
                </span>
              </div>
            </div>

            <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-200">
              <div className="grid grid-cols-3 gap-3 sm:gap-6 text-center">
                <div className="bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 mb-1">
                    2.4M
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600">
                    Total searches
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 mb-1">
                    62%
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600">
                    ChatGPT share
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 mb-1">
                    38%
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600">
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
