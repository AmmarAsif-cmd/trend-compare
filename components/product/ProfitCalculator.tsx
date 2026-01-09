
"use client";

import { useState, useEffect } from "react";
import { DollarSign, Calculator, TrendingUp } from "lucide-react";

interface Props {
    initialSellPrice?: number;
}

export default function ProfitCalculator({ initialSellPrice = 25 }: Props) {
    const [sellPrice, setSellPrice] = useState(initialSellPrice);
    const [sourcingCost, setSourcingCost] = useState(0);
    const [shippingCost, setShippingCost] = useState(0);
    const [fbaFees, setFbaFees] = useState(0);

    // Auto-estimate fees (rough Amazon heuristic: 15% referral + $5 fulfillment)
    useEffect(() => {
        if (sellPrice > 0) {
            setFbaFees(Number((sellPrice * 0.15 + 5).toFixed(2)));
        }
    }, [sellPrice]);

    const totalCost = sourcingCost + shippingCost + fbaFees;
    const profit = sellPrice - totalCost;
    const margin = sellPrice > 0 ? (profit / sellPrice) * 100 : 0;
    const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-lg">Profit Simulator</h3>
                </div>
            </div>

            <div className="p-6">
                <div className="space-y-4">
                    {/* Selling Price */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Selling Price</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="number"
                                value={sellPrice}
                                onChange={(e) => setSellPrice(Number(e.target.value))}
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-bold"
                            />
                        </div>
                    </div>

                    {/* Costs Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Product Cost</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="number"
                                    value={sourcingCost}
                                    onChange={(e) => setSourcingCost(Number(e.target.value))}
                                    placeholder="0.00"
                                    className="w-full pl-8 pr-2 py-1.5 border border-slate-200 rounded-lg text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Shipping</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="number"
                                    value={shippingCost}
                                    onChange={(e) => setShippingCost(Number(e.target.value))}
                                    placeholder="0.00"
                                    className="w-full pl-8 pr-2 py-1.5 border border-slate-200 rounded-lg text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Amazon Fees */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 flex justify-between">
                            <span>Est. FBA Fees</span>
                            <span className="text-slate-400 font-normal text-[10px]">(Referral + Fulfillment)</span>
                        </label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="number"
                                value={fbaFees}
                                onChange={(e) => setFbaFees(Number(e.target.value))}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-medium"
                            />
                        </div>
                    </div>
                </div>

                {/* Results Area */}
                <div className={`mt-6 rounded-xl p-4 border border-slate-100 ${profit >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-600">Net Profit</span>
                        <span className={`text-xl font-black ${profit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                            ${profit.toFixed(2)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Margin</span>
                        <span className={`font-bold ${margin >= 25 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {margin.toFixed(1)}%
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-slate-500">ROI</span>
                        <span className="font-bold text-slate-700">
                            {roi.toFixed(1)}%
                        </span>
                    </div>
                </div>

                <button className="w-full mt-4 bg-slate-900 text-white text-sm font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Save to Business Plan
                </button>
            </div>
        </div>
    );
}
