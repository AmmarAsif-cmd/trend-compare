// components/UseCasesSection.tsx
import { Target, FileText, Users, Search } from "lucide-react";
import Link from "next/link";

const useCases = [
  {
    icon: Target,
    role: "Marketers",
    benefit: "Track brand sentiment in real-time",
    example: "coca cola vs pepsi",
    color: "blue",
  },
  {
    icon: FileText,
    role: "Content Creators",
    benefit: "Find trending topics",
    example: "tiktok vs instagram",
    color: "purple",
  },
  {
    icon: Users,
    role: "Product Managers",
    benefit: "Validate product ideas",
    example: "slack vs teams",
    color: "green",
  },
  {
    icon: Search,
    role: "Researchers",
    benefit: "Analyze public interest",
    example: "remote work vs office",
    color: "orange",
  },
];

const colorMap: Record<string, string> = {
  blue: "bg-blue-100 text-blue-600",
  purple: "bg-purple-100 text-purple-600",
  green: "bg-green-100 text-green-600",
  orange: "bg-orange-100 text-orange-600",
};

export default function UseCasesSection() {
  return (
    <section className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Built for Professionals
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Across Every Industry
            </span>
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {useCases.map((useCase) => {
            const Icon = useCase.icon;
            return (
              <div
                key={useCase.role}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-slate-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group"
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 ${colorMap[useCase.color]} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-3 text-slate-900">{useCase.role}</h3>
                <p className="text-slate-600 mb-4 text-sm leading-relaxed">{useCase.benefit}</p>
                <Link
                  href={`/compare/${useCase.example.replace(/ /g, '-')}`}
                  className={`text-xs ${colorMap[useCase.color]} px-3 py-1.5 rounded-full font-medium inline-block hover:scale-105 transition-transform`}
                >
                  Try: {useCase.example}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
