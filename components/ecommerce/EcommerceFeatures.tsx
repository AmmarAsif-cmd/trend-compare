import { TrendingUp, DollarSign, BarChart3, Brain, Calendar, Zap } from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "Search Trend Analysis",
    description: "See if products are gaining or losing popularity with real Google Trends data.",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: DollarSign,
    title: "Price History",
    description: "Track historical pricing to identify the best time to source and sell.",
    color: "from-green-500 to-green-600",
  },
  {
    icon: BarChart3,
    title: "Competition Analysis",
    description: "Understand how many sellers are competing in your niche.",
    color: "from-purple-500 to-purple-600",
  },
  {
    icon: Brain,
    title: "AI Recommendations",
    description: "Get instant GO/NO-GO verdicts powered by artificial intelligence.",
    color: "from-pink-500 to-pink-600",
  },
  {
    icon: Calendar,
    title: "Seasonal Planning",
    description: "Discover the best months to launch and promote your products.",
    color: "from-orange-500 to-orange-600",
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "No waiting around. Get comprehensive analysis in under 30 seconds.",
    color: "from-yellow-500 to-yellow-600",
  },
];

export default function EcommerceFeatures() {
  return (
    <section className="relative bg-white py-20 sm:py-24 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Everything You Need to Find
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Winning Products
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto">
            Stop paying $49-$99/month for product research tools. Get the same insights for free.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative bg-white p-8 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300"
              >
                {/* Icon */}
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-5`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
              </div>
            );
          })}
        </div>

        {/* Comparison */}
        <div className="mt-16 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-3xl p-8 sm:p-12 border border-slate-200">
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 text-center">
            Why TrendArc vs. Paid Tools?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-red-500 mb-2">$49-99</div>
              <div className="text-slate-600 font-medium mb-1">Jungle Scout / Helium 10</div>
              <div className="text-sm text-slate-500">per month</div>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-4xl font-bold text-slate-400">vs</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">$0</div>
              <div className="text-slate-600 font-medium mb-1">TrendArc</div>
              <div className="text-sm text-slate-500">forever free</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
