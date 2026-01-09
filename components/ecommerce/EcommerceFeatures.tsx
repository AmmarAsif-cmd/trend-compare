
import { Check, X, TrendingUp, Zap, DollarSign } from "lucide-react";

export default function EcommerceFeatures() {
  return (
    <section className="relative bg-slate-50 py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Sassy Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6 tracking-tight">
            Stop Paying for <span className="text-slate-400 decoration-4 decoration-red-500 line-through">Bloatware</span>.
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            You don't need 50 features you'll never use. You need to find a winning product before your coffee gets cold.
          </p>
        </div>

        {/* The Comparison Table */}
        <div className="max-w-5xl mx-auto bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200">
            <div className="p-6 text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center">Feature</div>
            <div className="p-6 text-center border-l border-slate-200 bg-white relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
              <span className="text-lg font-black text-slate-900 flex items-center justify-center gap-2">
                TrendArc <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full">Pro</span>
              </span>
            </div>
            <div className="p-6 text-center border-l border-slate-200 bg-slate-50/50 grayscale opacity-70">
              <span className="text-lg font-bold text-slate-500">The "Big Guys"</span>
            </div>
          </div>

          {/* Table Rows */}
          {[
            { name: "Monthly Cost", us: "$6.99", them: "$99.00", highlight: true },
            { name: "Search Data", us: "Real-Time (Live)", them: "Cached (Old)", highlight: false },
            { name: "Viral Alerts", us: "Instant", them: "Daily/Weekly", highlight: false },
            { name: "UI Design", us: "Clean & Modern", them: "Clunky Spreadsheet", highlight: false },
            { name: "AI Analysis", us: "Yes (GPT-4o)", them: "Basic Filters", highlight: false },
            { name: "Setup Time", us: "0 Seconds", them: "2 Hour Course", highlight: false },
          ].map((row, i) => (
            <div key={i} className="grid grid-cols-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
              <div className="p-6 flex items-center font-medium text-slate-700">{row.name}</div>

              <div className={`p-6 border-l border-slate-100 text-center font-bold flex items-center justify-center ${row.highlight ? 'text-emerald-600 text-xl' : 'text-slate-900'}`}>
                {row.name === "Monthly Cost" ? (
                  <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-lg border border-emerald-200 shadow-sm">{row.us}</span>
                ) : (
                  row.us
                )}
              </div>

              <div className="p-6 border-l border-slate-100 text-center text-slate-400 font-medium flex items-center justify-center grayscale opacity-70">
                {row.name === "Monthly Cost" ? (
                  <span className="line-through decoration-red-400">{row.them}</span>
                ) : (
                  row.them
                )}
              </div>
            </div>
          ))}

          {/* Bottom Call to Action within the card */}
          <div className="grid grid-cols-3 bg-slate-50 p-8 border-t border-slate-200">
            <div className="hidden sm:block"></div>
            <div className="col-span-3 sm:col-span-1">
              <a href="/pricing" className="block w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                Start for $6.99
              </a>
              <p className="text-center text-xs text-slate-400 mt-3">No long-term contracts.</p>
            </div>
            <div className="hidden sm:block"></div>
          </div>
        </div>

        {/* Value Grid (Mini Features) */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          {[
            { title: "Honest Data", desc: "We don't inflate search volume to sell you expensive courses. You get the raw, ugly truth.", icon: TrendingUp },
            { title: "Designed for Humans", desc: "No complex dashboards. Just a simple search bar that prints money.", icon: Zap },
            { title: "Wallet Friendly", desc: "Save your money for inventory. Not software subscriptions.", icon: DollarSign },
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-6">
                <item.icon className="w-6 h-6 text-slate-900" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
              <p className="text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
