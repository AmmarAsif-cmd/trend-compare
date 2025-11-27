// components/HowItWorksSection.tsx
import { Search, Database, LineChart, Lightbulb } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: Search,
    title: "Enter Keywords",
    description: "Type any two topics you want to compare",
    color: "blue",
  },
  {
    number: 2,
    icon: Database,
    title: "We Aggregate",
    description: "Fetch data from 6+ trusted sources",
    color: "purple",
  },
  {
    number: 3,
    icon: LineChart,
    title: "Visualizations",
    description: "View beautiful, interactive charts",
    color: "green",
  },
  {
    number: 4,
    icon: Lightbulb,
    title: "AI Insights",
    description: "Understand WHY trends exist",
    color: "orange",
  },
];

const colorMap: Record<string, { bg: string; gradient: string; icon: string }> = {
  blue: {
    bg: "bg-blue-100 text-blue-600",
    gradient: "from-blue-500 to-blue-600",
    icon: "bg-blue-100 text-blue-600",
  },
  purple: {
    bg: "bg-purple-100 text-purple-600",
    gradient: "from-purple-500 to-purple-600",
    icon: "bg-purple-100 text-purple-600",
  },
  green: {
    bg: "bg-green-100 text-green-600",
    gradient: "from-green-500 to-green-600",
    icon: "bg-green-100 text-green-600",
  },
  orange: {
    bg: "bg-orange-100 text-orange-600",
    gradient: "from-orange-500 to-orange-600",
    icon: "bg-orange-100 text-orange-600",
  },
};

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-white py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 sm:mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-lg sm:text-xl text-slate-600">Four simple steps to powerful insights</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="text-center group">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br ${colorMap[step.color].gradient} rounded-2xl flex items-center justify-center text-white font-bold text-2xl sm:text-3xl mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  {step.number}
                </div>
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${colorMap[step.color].icon} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-3 text-slate-900">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
