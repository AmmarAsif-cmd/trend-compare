
export const SUBSCRIPTION_PLANS = {
    FREE: {
        id: 'free',
        name: 'Free',
        price: 0,
        limits: {
            dailySearches: 5,
            trendHistoryMonths: 6,
            projects: 1,
        },
        features: [
            '5 Searches per day',
            '6 months trend history',
            'Basic Opportunity Score',
            'Standard Support',
        ]
    },
    PRO: {
        id: 'pro',
        name: 'TrendArc Pro',
        price: 6.99,
        limits: {
            dailySearches: 1000000, // Effectively unlimited
            trendHistoryMonths: 60, // 5 years
            projects: 100,
        },
        features: [
            'Unlimited Searches',
            '5 Years trend history',
            'Deep Market Intelligence',
            'Viral Breakout Alerts',
            'Priority Support',
            'PDF Exports'
        ]
    }
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_PLANS;
