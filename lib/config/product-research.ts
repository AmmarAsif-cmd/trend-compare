/**
 * Product Research Configuration Constants
 * Centralized configuration to avoid hardcoded values
 */

// Cache TTL (in seconds)
export const PRODUCT_CACHE_TTL = 3600; // 1 hour
export const TRENDING_PRODUCTS_CACHE_TTL = 86400; // 24 hours

// API Rate Limits
export const KEEPA_API_MAX_REQUESTS_PER_MINUTE = 20;
export const GOOGLE_TRENDS_DELAY_MS = 1000; // Delay between requests

// Trending Products
export const TRENDING_PRODUCTS_DEFAULT_LIMIT = 30;
export const TRENDING_PRODUCTS_BATCH_SIZE = 5;
export const TRENDING_PRODUCTS_MAX_PER_CATEGORY = 30;

// Product Analysis
export const PRODUCT_TRENDS_TIMEFRAME = '12m' as const;
export const PRODUCT_TRENDS_GEO = 'US' as const;
export const PRODUCT_ANALYSIS_STATS_DAYS = 365;

// Trend Analysis Thresholds
export const TREND_GROWTH_THRESHOLD_RISING = 10; // 10% growth = rising
export const TREND_GROWTH_THRESHOLD_FALLING = -10; // -10% growth = falling
export const SEARCH_VOLUME_MULTIPLIER = 1000; // Google Trends value * 1000 = estimated monthly searches
export const SEARCH_VOLUME_PEAK_VALUE = 100; // Google Trends peak value (used for estimation)

// Competition Estimation
export const COMPETITION_HIGH_VOLUME_THRESHOLD = 50000;
export const COMPETITION_MEDIUM_VOLUME_THRESHOLD = 20000;
export const COMPETITION_LOW_SELLERS = 50;
export const COMPETITION_MEDIUM_SELLERS = 200;
export const COMPETITION_HIGH_SELLERS = 500;

// Opportunity Score Weights
export const OPPORTUNITY_SCORE_BASE = 50;
export const OPPORTUNITY_SCORE_TREND_RISING = 20;
export const OPPORTUNITY_SCORE_TREND_FALLING = -20;
export const OPPORTUNITY_SCORE_GROWTH_HIGH = 15; // >50%
export const OPPORTUNITY_SCORE_GROWTH_MEDIUM = 10; // >20%
export const OPPORTUNITY_SCORE_GROWTH_NEGATIVE = -15; // <-20%
export const OPPORTUNITY_SCORE_VOLUME_SWEET_SPOT = 15; // 10k-50k
export const OPPORTUNITY_SCORE_VOLUME_HIGH = 5; // >50k (too competitive)
export const OPPORTUNITY_SCORE_VOLUME_LOW = -10; // <10k (too low)
export const OPPORTUNITY_SCORE_COMPETITION_LOW = 10;
export const OPPORTUNITY_SCORE_COMPETITION_HIGH = -15;

// Opportunity Score Thresholds
export const OPPORTUNITY_SCORE_GO = 70;
export const OPPORTUNITY_SCORE_MAYBE = 50;

// Price Estimation (fallback when Keepa unavailable)
export const PRICE_ESTIMATE_MIN = 15;
export const PRICE_ESTIMATE_MAX = 50;

// Input Validation
export const PRODUCT_NAME_MIN_LENGTH = 2;
export const PRODUCT_NAME_MAX_LENGTH = 100;
export const PRODUCT_SLUG_MAX_LENGTH = 150;

// Error Handling
export const API_TIMEOUT_MS = 30000; // 30 seconds
export const API_RETRY_ATTEMPTS = 2;
export const API_RETRY_DELAY_MS = 1000;

