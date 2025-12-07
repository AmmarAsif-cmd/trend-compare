// components/FeaturesSection.tsx
import { Zap, RefreshCw, BarChart3, Brain, Globe, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant Results",
    description: "Compare trending topics in seconds. No waiting, no clutter, just quick insights.",
    color: "blue",
  },
  {
    icon: RefreshCw,
    title: "Always Fresh",
    description: "Updates every 4 hours with the latest data, so you're always current.",
    color: "green",
  },
  {
    icon: BarChart3,
    title: "Crystal Clear",
    description: "Beautiful, interactive charts make it effortless to spot trends.",
    color: "purple",
  },
  {
    icon: Brain,
    title: "AI-Powered",
    description: "Our AI explains WHY trends happen with contextual analysis.",
    color: "pink",
  },
  {
    icon: Globe,
    title: "Multi-Source",
    description: "Aggregates data from 6+ sources for comprehensive views.",
    color: "orange",
  },
  {
    icon: TrendingUp,
    title: "Predictive",
    description: "ML-powered forecasts show where trends are heading.",
    color: "indigo",
  },
];

const colorMap: Record<string, string> = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
  purple: "bg-purple-100 text-purple-600",
  pink: "bg-pink-100 text-pink-600",
  orange: "bg-orange-100 text-orange-600",
  indigo: "bg-indigo-100 text-indigo-600",
};

export default function FeaturesSection() {
  return (
    <section id="features" className="bg-gradient-to-b from-white to-slate-50 py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Everything You Need to
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Understand Trends
            </span>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-slate-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group"
              >
                <div className={`w-14 h-14 sm:w-16 sm:h-16 ${colorMap[feature.color]} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-4 text-slate-900">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
