/**
 * Blog Category Definitions
 * 
 * These are the core taxonomy categories for TrendArc blog posts.
 * Each category has a specific purpose and editorial intent.
 */

export const BLOG_CATEGORIES = {
  ANALYSIS_INSIGHTS: 'Analysis & Insights',
  COMPARISONS_EXPLAINED: 'Comparisons Explained',
  TECHNOLOGY_METHODOLOGY: 'Technology & Methodology',
  INDUSTRY_MARKET_STORIES: 'Industry & Market Stories',
  PLATFORM_UPDATES: 'Platform Updates',
} as const;

export type BlogCategory = typeof BLOG_CATEGORIES[keyof typeof BLOG_CATEGORIES];

/**
 * Valid blog categories array
 */
export const VALID_BLOG_CATEGORIES: BlogCategory[] = [
  BLOG_CATEGORIES.ANALYSIS_INSIGHTS,
  BLOG_CATEGORIES.COMPARISONS_EXPLAINED,
  BLOG_CATEGORIES.TECHNOLOGY_METHODOLOGY,
  BLOG_CATEGORIES.INDUSTRY_MARKET_STORIES,
  BLOG_CATEGORIES.PLATFORM_UPDATES,
];

/**
 * Category descriptions and editorial intent
 */
export const CATEGORY_DESCRIPTIONS: Record<BlogCategory, { description: string; purpose: string; examples: string[] }> = {
  [BLOG_CATEGORIES.ANALYSIS_INSIGHTS]: {
    description: 'Deep interpretation of trends and market behavior',
    purpose: 'Explain why comparisons matter, what trends mean, and provide context for search interest patterns',
    examples: [
      'Why AI tool searches spike before funding rounds',
      'Understanding seasonal patterns in tech searches',
      'What search trends reveal about market sentiment',
    ],
  },
  [BLOG_CATEGORIES.COMPARISONS_EXPLAINED]: {
    description: 'How to interpret A vs B comparisons and frameworks for decision making',
    purpose: 'Help users understand what comparison data means and how to use it effectively',
    examples: [
      'How to read iPhone vs Samsung trend data properly',
      'Understanding confidence scores in trend comparisons',
      'What volatility means for comparison reliability',
    ],
  },
  [BLOG_CATEGORIES.TECHNOLOGY_METHODOLOGY]: {
    description: 'How TrendArc works, data sources, limitations, and methodology',
    purpose: 'Build transparency and trust by explaining our data sources and methods',
    examples: [
      'How TrendArc calculates confidence scores',
      'Understanding our data sources and limitations',
      'How forecasting works in trend analysis',
    ],
  },
  [BLOG_CATEGORIES.INDUSTRY_MARKET_STORIES]: {
    description: 'Narrative trend stories, long-term shifts, and regional use cases',
    purpose: 'Tell compelling stories about trends across industries and regions',
    examples: [
      'The rise of AI tools in South Asia',
      'How streaming services changed entertainment searches',
      'Regional differences in tech adoption patterns',
    ],
  },
  [BLOG_CATEGORIES.PLATFORM_UPDATES]: {
    description: 'Product updates, feature launches, and transparency posts',
    purpose: 'Keep users informed about platform changes and improvements',
    examples: [
      'New forecasting features now available',
      'Improved data accuracy updates',
      'Platform transparency report',
    ],
  },
};

/**
 * Check if a category is valid
 */
export function isValidBlogCategory(category: string): category is BlogCategory {
  return VALID_BLOG_CATEGORIES.includes(category as BlogCategory);
}

/**
 * Get category metadata
 */
export function getCategoryMetadata(category: string) {
  if (!isValidBlogCategory(category)) {
    return null;
  }
  return CATEGORY_DESCRIPTIONS[category];
}

