
import Link from 'next/link';

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 py-24 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-emerald-400 font-semibold tracking-wide uppercase text-sm mb-2">Maximum Output, Minimum Price</h2>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Spot Winners Before They <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Go Viral</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Get the unfair advantage with professional-grade product intelligence. One viral hit pays for a lifetime of TrendArc.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Free Tier */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 flex flex-col relative overflow-hidden group hover:border-slate-700 transition-all">
                        <div className="mb-6">
                            <h3 className="text-xl font-semibold text-white mb-2">Starter</h3>
                            <div className="text-3xl font-bold text-white">$0 <span className="text-lg font-normal text-slate-500">/mo</span></div>
                            <p className="text-slate-400 mt-2">Perfect for casual research and testing the waters.</p>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {[
                                '5 Searches per day',
                                '6 Months trend history',
                                'Basic Opportunity Score',
                                'Standard Comparison (2 Items)',
                            ].map((feature, i) => (
                                <li key={i} className="flex items-center text-slate-300">
                                    <svg className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <Link href="/" className="w-full block text-center py-3 px-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors">
                            Continue Free
                        </Link>
                    </div>

                    {/* Pro Tier */}
                    <div className="bg-gradient-to-b from-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-8 flex flex-col relative overflow-hidden shadow-2xl shadow-emerald-900/10 scale-105 z-10">
                        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                            BEST VALUE
                        </div>

                        <div className="mb-6">
                            <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                                TrendArc Pro
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20">Early Bird</span>
                            </h3>
                            <div className="text-3xl font-bold text-white">$6.99 <span className="text-lg font-normal text-slate-500">/mo</span></div>
                            <p className="text-emerald-400/80 mt-2 text-sm">Less than a cup of coffee for agency-grade tools.</p>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {[
                                'Unlimited Daily Searches',
                                '5 Years Trend History',
                                'Deep Intelligence (Viral Boost & Saturation)',
                                'Real-time "Breakout" Alerts',
                                'Multi-Item Comparisons (Up to 5)',
                                'PDF & CSV Data Exports',
                                'Priority Support'
                            ].map((feature, i) => (
                                <li key={i} className="flex items-center text-white">
                                    <div className="bg-emerald-500/20 p-1 rounded-full mr-3 flex-shrink-0">
                                        <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <button className="w-full py-4 px-6 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-lg shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]">
                            Upgrade to Pro
                        </button>
                        <p className="text-center text-xs text-slate-500 mt-3">Secure payment via Stripe. Cancel anytime.</p>
                    </div>
                </div>

                <div className="mt-20 text-center border-t border-slate-800/50 pt-10">
                    <h3 className="text-lg font-medium text-slate-300 mb-6">Trusted by 250+ Dropshippers & Agencies</h3>
                    <div className="flex justify-center flex-wrap gap-8 text-slate-600 grayscale opacity-50">
                        {/* Placeholders for social proof logos if needed later */}
                        <div className="font-bold text-xl">SHOPIFY</div>
                        <div className="font-bold text-xl">AMAZON</div>
                        <div className="font-bold text-xl">TIKTOK</div>
                        <div className="font-bold text-xl">WOOCOMMERCE</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
