
"use client";

import Link from 'next/link';

interface PremiumFeatureLockProps {
    children: React.ReactNode;
    isPremium?: boolean;
    featureName?: string;
}

export default function PremiumFeatureLock({
    children,
    isPremium = false,
    featureName = "Premium Feature"
}: PremiumFeatureLockProps) {

    // If user is premium, just show the content
    if (isPremium) {
        return <>{children}</>;
    }

    return (
        <div className="relative group overflow-hidden rounded-xl border border-slate-800">
            {/* Blurred Content */}
            <div className="filter blur-sm select-none opacity-50 pointer-events-none grayscale transition-all duration-500">
                {children}
            </div>

            {/* Lock Overlay */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-[1px] p-6 text-center">
                <div className="bg-slate-900/90 border border-slate-700 p-6 rounded-2xl shadow-2xl max-w-sm transform transition-transform hover:scale-105">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>

                    <h3 className="text-white font-bold text-lg mb-2">Unlock {featureName}</h3>
                    <p className="text-slate-400 text-sm mb-6">
                        Upgrade to TrendArc Pro to access {featureName.toLowerCase()} and spot viral trends before anyone else.
                    </p>

                    <Link
                        href="/pricing"
                        className="block w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
                    >
                        Upgrade Now
                    </Link>
                </div>
            </div>
        </div>
    );
}
