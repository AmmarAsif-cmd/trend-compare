"use client";

import { Activity, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";

interface Props {
    opportunityScore: number;
    saturationLevel: 'low' | 'medium' | 'high';
    forecastNextMonth: number;
    actionSignal: 'buy' | 'wait' | 'avoid';
}

export default function ProductOpportunityCard({
    opportunityScore,
    saturationLevel,
    forecastNextMonth,
    actionSignal
}: Props) {

    // Resolve Action Signal Styles
    const signalConfig = {
        buy: {
            label: "BUY SIGNAL",
            color: "bg-emerald-500",
            textColor: "text-emerald-700",
            bgColor: "bg-emerald-50",
            borderColor: "border-emerald-200",
            icon: CheckCircle2,
            description: "High demand, rising trend, and low saturation. Prime opportunity."
        },
        wait: {
            label: "WATCH LIST",
            color: "bg-amber-500",
            textColor: "text-amber-700",
            bgColor: "bg-amber-50",
            borderColor: "border-amber-200",
            icon: Activity,
            description: "Good potential but mixed signals. Monitor for breakout."
        },
        avoid: {
            label: "AVOID",
            color: "bg-rose-500",
            textColor: "text-rose-700",
            bgColor: "bg-rose-50",
            borderColor: "border-rose-200",
            icon: AlertCircle,
            description: "Declining trend or highly saturated market. Low profit potential."
        }
    };

    const config = signalConfig[actionSignal];
    const Icon = config.icon;

    // Opportunity Score Color Gradient
    const getScoreColor = (score: number) => {
        if (score >= 75) return "text-emerald-600";
        if (score >= 50) return "text-amber-600";
        return "text-rose-600";
    };

    // Saturation Badge Style
    const getSaturationStyle = (level: string) => {
        switch (level) {
            case 'low': return "bg-emerald-100 text-emerald-800 border-emerald-200";
            case 'medium': return "bg-blue-100 text-blue-800 border-blue-200";
            case 'high': return "bg-rose-100 text-rose-800 border-rose-200";
            default: return "bg-slate-100 text-slate-800";
        }
    };

    return (
        <div className={`rounded-2xl border-2 ${config.borderColor} ${config.bgColor} overflow-hidden font-sans`}>
            {/* Header Badge */}
            <div className={`${config.color} text-white px-6 py-4 flex items-center justify-between shadow-sm`}>
                <div className="flex items-center gap-2 font-bold tracking-wider text-lg">
                    <Icon className="w-6 h-6" />
                    {config.label}
                </div>
                <div className="text-white/90 text-sm font-medium bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">AI Analysis</div>
            </div>

            <div className="p-6">
                <div className="flex flex-col md:flex-row gap-8 items-stretch">

                    {/* Metric 1: Opportunity Score (Hero) */}
                    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-slate-200 shadow-sm min-h-[220px]">
                        <div className="relative w-36 h-36 flex items-center justify-center mb-4">
                            {/* Circular Progress */}
                            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                <circle cx="72" cy="72" r="60" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
                                <circle
                                    cx="72" cy="72" r="60"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    fill="transparent"
                                    strokeDasharray={`${376.99 * (opportunityScore / 100)} 376.99`}
                                    className={`${getScoreColor(opportunityScore)} transition-all duration-1000 ease-out`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="flex flex-col items-center">
                                <span className={`text-5xl font-extrabold ${getScoreColor(opportunityScore)} tracking-tighter`}>{opportunityScore}</span>
                            </div>
                        </div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest text-center">Opportunity<br />Score</p>
                    </div>

                    {/* Metric 2: Market Context (Scrollable on Mobile) */}
                    <div className="flex-[2] space-y-6 min-w-0">
                        <div>
                            <h3 className={`text-2xl font-bold ${config.textColor} mb-2`}>
                                Verdict: {config.description}
                            </h3>
                            <p className="text-slate-600">
                                This potential score is based on a weighted analysis of search volume, growth trends, and market volatility.
                            </p>
                        </div>

                        {/* Mobile: Horizontal Scroll | Desktop: Grid */}
                        <div className="flex overflow-x-auto pb-4 gap-4 md:grid md:grid-cols-2 md:pb-0 md:overflow-visible no-scrollbar snap-x -mx-6 px-6 md:mx-0 md:px-0">

                            {/* Saturation Card */}
                            <div className="snap-center shrink-0 w-[80vw] md:w-auto bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.02]">
                                <div className={`p-4 rounded-full ${getSaturationStyle(saturationLevel).split(' ')[0]}`}>
                                    <Activity className={`w-8 h-8 ${getSaturationStyle(saturationLevel).split(' ')[1]}`} />
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Market Saturation</div>
                                    <div className={`text-xl font-bold capitalize ${getSaturationStyle(saturationLevel).split(' ')[1]}`}>
                                        {saturationLevel} Comp.
                                    </div>
                                </div>
                            </div>

                            {/* Forecast Card */}
                            <div className="snap-center shrink-0 w-[80vw] md:w-auto bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.02]">
                                <div className="p-4 rounded-full bg-blue-50 border border-blue-100">
                                    <TrendingUp className="w-8 h-8 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">30-Day Forecast</div>
                                    <div className="text-xl font-bold text-slate-900">
                                        {Math.round(forecastNextMonth)} / 100 <span className="text-sm text-slate-400 font-normal">Score</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
