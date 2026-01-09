
import { Sparkles, ArrowRight, Target, Lightbulb } from 'lucide-react';
import { KeywordDNA } from '@/lib/services/product/trends';

interface Props {
    dna: KeywordDNA;
    baseKeyword: string;
}

export default function NicheSpotlightCard({ dna, baseKeyword }: Props) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm h-full flex flex-col">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-lg">Niche Spotlight</h3>
                </div>
                <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded text-xs font-medium">
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                    <span>Keyword DNA</span>
                </div>
            </div>

            <div className="p-6 flex flex-col flex-1">
                <div className="mb-6">
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                        Don't sell "{baseKeyword}". Sell this:
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 mb-2">
                        "{dna.winningVariation}"
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded-full">
                            {dna.variationGrowth}
                        </span>
                        <span className="text-slate-400 text-xs">
                            Growth Velocity
                        </span>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex-1">
                    <div className="flex gap-3">
                        <div className="shrink-0 mt-1">
                            <Lightbulb className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 text-sm mb-1">Market Diagnosis</h4>
                            <p className="text-sm text-slate-600 leading-relaxed italic">
                                "{dna.dnaDiagnosis}"
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                    <span>Niche Specificity Score:</span>
                    <div className="flex items-center gap-1 font-bold text-slate-700">
                        {dna.specificityScore}/100
                    </div>
                </div>
            </div>
        </div>
    );
}
