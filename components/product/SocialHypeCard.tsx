
import { MessageCircle, Play, TrendingUp, Music2 } from 'lucide-react';
import { TikTokTrendData } from '@/lib/services/social/tiktok';

interface Props {
    data: TikTokTrendData;
}

export default function SocialHypeCard({ data }: Props) {
    const isViral = data.velocity > 100;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="bg-black text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Music2 className="w-5 h-5 text-pink-500" />
                    <h3 className="font-bold text-lg">TikTok Intelligence</h3>
                </div>
                {isViral && (
                    <span className="bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                        VIRAL NOW
                    </span>
                )}
            </div>

            <div className="p-6">
                {/* Main Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-slate-50 rounded-xl text-center border border-slate-100">
                        <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Total Views</div>
                        <div className="text-2xl font-black text-slate-900">
                            {(data.views / 1000000).toFixed(1)}M
                        </div>
                        <div className="text-emerald-600 text-xs font-bold flex items-center justify-center gap-1 mt-1">
                            <TrendingUp className="w-3 h-3" />
                            +{data.velocity}% today
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl text-center border border-slate-100">
                        <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Hashtag</div>
                        <div className="text-lg font-bold text-slate-900 truncate px-2">
                            {data.hashtag}
                        </div>
                        <div className="text-slate-400 text-xs font-medium mt-1">
                            {data.posts}k posts
                        </div>
                    </div>
                </div>

                {/* Top Video Snippet */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-4 text-white relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

                    <div className="relative z-10 flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center shrink-0 border-2 border-slate-600">
                            <Play className="w-4 h-4 text-white ml-0.5" />
                        </div>
                        <div>
                            <div className="text-xs font-medium text-slate-400 mb-1">Top Trending Video • {data.topVideo.postedAt}</div>
                            <p className="text-sm font-medium leading-relaxed line-clamp-2 italic">
                                "{data.topVideo.description}"
                            </p>
                            <div className="mt-2 text-xs font-bold text-pink-400">
                                by {data.topVideo.author} • {(data.topVideo.views / 1000).toFixed(1)}k views
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sentiment Analysis */}
                <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Audience Sentiment:</span>
                    <span className={`font-bold ${data.sentiment === 'positive' ? 'text-emerald-600' : 'text-amber-500'}`}>
                        {data.sentiment.toUpperCase()}
                    </span>
                </div>
            </div>
        </div>
    );
}
