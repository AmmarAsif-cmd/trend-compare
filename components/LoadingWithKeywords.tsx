"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Sparkles, Zap, Brain, Globe } from "lucide-react";

// Large pool of interesting, diverse comparisons
const interestingComparisons = [
  // Tech & AI
  "ChatGPT vs Gemini", "Claude vs GPT-4", "Midjourney vs DALL-E", "Sora vs Runway",
  "Python vs JavaScript", "React vs Vue", "TypeScript vs JavaScript", "Next.js vs Remix",
  "GitHub vs GitLab", "VSCode vs WebStorm", "Figma vs Sketch", "Notion vs Obsidian",
  
  // Phones & Devices
  "iPhone vs Samsung", "Pixel vs iPhone", "MacBook vs Surface", "iPad vs Galaxy Tab",
  "AirPods vs Galaxy Buds", "Apple Watch vs Galaxy Watch", "Oculus vs Quest",
  
  // Streaming & Entertainment
  "Netflix vs Disney+", "Spotify vs Apple Music", "YouTube vs Twitch", "TikTok vs Instagram",
  "HBO Max vs Netflix", "Prime Video vs Netflix", "Pandora vs Spotify",
  
  // Gaming
  "PlayStation vs Xbox", "Fortnite vs Minecraft", "Valorant vs CS2", "GTA vs Red Dead",
  "Nintendo Switch vs Steam Deck", "Roblox vs Minecraft", "Call of Duty vs Battlefield",
  
  // Social & Communication
  "Twitter vs Threads", "Discord vs Slack", "Zoom vs Teams", "WhatsApp vs Telegram",
  "LinkedIn vs Indeed", "Reddit vs Twitter", "Snapchat vs Instagram",
  
  // E-commerce & Services
  "Amazon vs Walmart", "Uber vs Lyft", "DoorDash vs Uber Eats", "Airbnb vs Booking",
  "Stripe vs PayPal", "Shopify vs WooCommerce", "Etsy vs Amazon Handmade",
  
  // Brands & Products
  "Coca-Cola vs Pepsi", "Nike vs Adidas", "Starbucks vs Dunkin'", "McDonald's vs Burger King",
  "Tesla vs BMW", "Apple vs Microsoft", "Google vs Microsoft", "Meta vs Twitter",
  
  // Entertainment & Media
  "Marvel vs DC", "Star Wars vs Star Trek", "Harry Potter vs Lord of the Rings",
  "Taylor Swift vs Beyoncé", "Drake vs Kendrick", "The Weeknd vs Post Malone",
  
  // Finance & Crypto
  "Bitcoin vs Ethereum", "Visa vs Mastercard", "PayPal vs Venmo", "Robinhood vs Fidelity",
  
  // Food & Beverages
  "Pepsi vs Coca-Cola", "McDonald's vs KFC", "Pizza Hut vs Domino's", "Subway vs Quiznos",
  
  // Sports & Fitness
  "Nike vs Adidas", "Peloton vs Echelon", "Strava vs Nike Run Club",
  
  // Travel
  "Booking.com vs Expedia", "Uber vs Taxi", "Airbnb vs Hotels",
  
  // Education
  "Coursera vs Udemy", "Khan Academy vs Duolingo", "Google vs Bing",
];

// Fun, engaging messages that rotate
const engagingMessages = [
  "Discovering hidden trends...",
  "Crunching the numbers...",
  "Connecting the dots...",
  "Unveiling insights...",
  "Mining data gold...",
  "Plotting the course...",
  "Assembling the puzzle...",
  "Lighting up the charts...",
  "Brewing fresh data...",
  "Spinning the web of trends...",
];

// Shuffle array function
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function LoadingWithKeywords({
  message = "Analyzing Trends...",
  showProgress = true,
}: {
  message?: string;
  showProgress?: boolean;
}) {
  const [currentComparison, setCurrentComparison] = useState("");
  const [nextComparison, setNextComparison] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState("");
  const [shuffledComparisons, setShuffledComparisons] = useState<string[]>([]);
  const [comparisonIndex, setComparisonIndex] = useState(0);

  // Initialize shuffled comparisons on mount
  useEffect(() => {
    const shuffled = shuffleArray(interestingComparisons);
    setShuffledComparisons(shuffled);
    setCurrentComparison(shuffled[0] || interestingComparisons[0]);
    setNextComparison(shuffled[1] || interestingComparisons[1]);
    setCurrentMessage(engagingMessages[Math.floor(Math.random() * engagingMessages.length)]);
  }, []);

  useEffect(() => {
    // Rotate through comparisons with smooth transitions
    const interval = setInterval(() => {
      setIsTransitioning(true);
      
      setTimeout(() => {
        const nextIndex = (comparisonIndex + 1) % shuffledComparisons.length;
        setComparisonIndex(nextIndex);
        setCurrentComparison(shuffledComparisons[nextIndex] || interestingComparisons[0]);
        setNextComparison(shuffledComparisons[(nextIndex + 1) % shuffledComparisons.length] || interestingComparisons[1]);
        setCurrentMessage(engagingMessages[Math.floor(Math.random() * engagingMessages.length)]);
        setIsTransitioning(false);
      }, 300); // Half of transition duration
    }, 2500); // Change every 2.5 seconds

    return () => clearInterval(interval);
  }, [comparisonIndex, shuffledComparisons]);

  useEffect(() => {
    if (showProgress) {
      // Simulate progress (0-90%, never reaches 100% until actually loaded)
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 4 + 0.5; // Slower, more realistic progress
        });
      }, 400);

      return () => clearInterval(progressInterval);
    }
  }, [showProgress]);

  const [termA, termB] = currentComparison.split(" vs ");

  // Get random colors for variety
  const colorVariants = [
    { from: "from-blue-500", via: "via-purple-500", to: "to-pink-500", borderA: "border-blue-200", borderB: "border-purple-200", textA: "text-blue-600", textB: "text-purple-600", bg: "from-blue-50 via-purple-50 to-pink-50" },
    { from: "from-emerald-500", via: "via-teal-500", to: "to-cyan-500", borderA: "border-emerald-200", borderB: "border-teal-200", textA: "text-emerald-600", textB: "text-teal-600", bg: "from-emerald-50 via-teal-50 to-cyan-50" },
    { from: "from-orange-500", via: "via-red-500", to: "to-pink-500", borderA: "border-orange-200", borderB: "border-red-200", textA: "text-orange-600", textB: "text-red-600", bg: "from-orange-50 via-red-50 to-pink-50" },
    { from: "from-indigo-500", via: "via-blue-500", to: "to-purple-500", borderA: "border-indigo-200", borderB: "border-blue-200", textA: "text-indigo-600", textB: "text-blue-600", bg: "from-indigo-50 via-blue-50 to-purple-50" },
  ];
  
  const currentColors = colorVariants[comparisonIndex % colorVariants.length];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Loading Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl border-2 border-slate-200 shadow-2xl p-8 sm:p-12 transform transition-all duration-500 hover:scale-[1.02]">
          {/* Animated Icon with variety */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className={`w-20 h-20 bg-gradient-to-br ${currentColors.from} ${currentColors.via} ${currentColors.to} rounded-2xl flex items-center justify-center shadow-lg animate-pulse transition-all duration-500`}>
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 animate-bounce" style={{ animationDuration: '2s' }}>
                <Sparkles className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="absolute -bottom-1 -left-1">
                <Zap className="w-5 h-5 text-purple-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
              </div>
            </div>
          </div>

          {/* Dynamic Main Message */}
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-2 text-slate-900 transition-all duration-300">
            {message}
          </h2>
          <p className="text-sm text-slate-500 text-center mb-6 font-medium animate-pulse">
            {currentMessage}
          </p>

          {/* Rotating Comparison Display with smooth transitions */}
          <div className="mb-8 mt-8">
            <p className="text-xs sm:text-sm text-slate-500 text-center mb-4 font-medium flex items-center justify-center gap-2">
              <Brain className="w-4 h-4 text-purple-500" />
              <span>Discover interesting comparisons:</span>
            </p>
            <div className={`bg-gradient-to-r ${currentColors.bg} rounded-2xl p-6 border-2 border-slate-200 transition-all duration-500 ${isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
              <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
                {/* Term A with animation */}
                <div className="text-center group transform transition-all duration-300 hover:scale-105">
                  <div className={`bg-white rounded-xl px-6 py-3 shadow-lg border-2 ${currentColors.borderA} group-hover:shadow-xl transition-all duration-300`}>
                    <p className={`text-lg sm:text-xl font-bold ${currentColors.textA} transition-all duration-300`}>
                      {termA}
                    </p>
                  </div>
                </div>

                {/* VS Badge with pulse */}
                <div className="flex-shrink-0 transform transition-all duration-300 hover:scale-110">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${currentColors.from} ${currentColors.to} rounded-full flex items-center justify-center shadow-lg animate-pulse`}>
                    <span className="text-white font-bold text-sm sm:text-base">VS</span>
                  </div>
                </div>

                {/* Term B with animation */}
                <div className="text-center group transform transition-all duration-300 hover:scale-105">
                  <div className={`bg-white rounded-xl px-6 py-3 shadow-lg border-2 ${currentColors.borderB} group-hover:shadow-xl transition-all duration-300`}>
                    <p className={`text-lg sm:text-xl font-bold ${currentColors.textB} transition-all duration-300`}>
                      {termB}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar with gradient */}
          {showProgress && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600 flex items-center gap-2">
                  <Globe className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
                  Loading data from multiple sources...
                </span>
                <span className="text-sm font-semibold text-slate-700">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className={`h-full bg-gradient-to-r ${currentColors.from} ${currentColors.via} ${currentColors.to} rounded-full transition-all duration-500 ease-out shadow-lg`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Loading Steps with staggered animation */}
          <div className="space-y-3 mt-8">
            <div className="flex items-center gap-3 text-sm opacity-0 animate-[fadeIn_0.6s_ease-out_0s_forwards]">
              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${currentColors.from} ${currentColors.to} animate-pulse`}></div>
              <span className="text-slate-600">Fetching multi-source data...</span>
            </div>
            <div className="flex items-center gap-3 text-sm opacity-0 animate-[fadeIn_0.6s_ease-out_0.3s_forwards]">
              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${currentColors.from} ${currentColors.to} animate-pulse`} style={{ animationDelay: '0.3s' }}></div>
              <span className="text-slate-600">Analyzing trends and patterns...</span>
            </div>
            <div className="flex items-center gap-3 text-sm opacity-0 animate-[fadeIn_0.6s_ease-out_0.6s_forwards]">
              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${currentColors.from} ${currentColors.to} animate-pulse`} style={{ animationDelay: '0.6s' }}></div>
              <span className="text-slate-600">Generating AI-powered insights...</span>
            </div>
          </div>

          {/* Next comparison hint */}
          <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-center text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-yellow-500" />
                <span>Next up:</span>
              </span>
              <span className="font-semibold text-slate-700 ml-2">{nextComparison}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

