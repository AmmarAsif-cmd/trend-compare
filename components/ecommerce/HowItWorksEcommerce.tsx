export default function HowItWorksEcommerce() {
  const steps = [
    {
      number: "1",
      title: "Enter Product Name",
      description: "Type in any product you're considering selling on Amazon or Shopify.",
      icon: "🔍",
    },
    {
      number: "2",
      title: "Get AI Analysis",
      description: "Our AI analyzes search trends, pricing, competition, and seasonality in seconds.",
      icon: "🤖",
    },
    {
      number: "3",
      title: "Make Smart Decisions",
      description: "Get a clear GO/NO-GO verdict with actionable recommendations.",
      icon: "✅",
    },
  ];

  return (
    <section className="relative bg-gradient-to-br from-slate-50 to-white py-20 sm:py-24 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
            Get product insights in three simple steps
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
          {/* Connecting lines (desktop) */}
          <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 -z-10" />

          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Step Number Circle */}
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    {step.number}
                  </div>
                  <div className="absolute -bottom-2 -right-2 text-4xl">
                    {step.icon}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="text-center">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Arrow (mobile) */}
              {index < steps.length - 1 && (
                <div className="md:hidden flex justify-center my-6">
                  <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-lg text-slate-600 mb-6">
            Ready to find your next winning product?
          </p>
          <a
            href="#search"
            className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl text-lg"
          >
            Start Researching Now →
          </a>
        </div>
      </div>
    </section>
  );
}
