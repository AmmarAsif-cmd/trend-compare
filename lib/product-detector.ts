/**
 * Product Detection & Classification
 * Detects if comparison terms are products vs general topics
 */

const PRODUCT_CATEGORIES = {
  phones: {
    keywords: ['iphone', 'samsung', 'galaxy', 'pixel', 'oneplus', 'xiaomi', 'phone', 'mobile'],
    brands: ['apple', 'samsung', 'google', 'oneplus', 'xiaomi', 'huawei', 'oppo', 'vivo'],
  },
  laptops: {
    keywords: ['macbook', 'thinkpad', 'laptop', 'notebook', 'chromebook', 'surface'],
    brands: ['apple', 'dell', 'hp', 'lenovo', 'asus', 'acer', 'microsoft'],
  },
  gaming: {
    keywords: ['ps5', 'xbox', 'playstation', 'nintendo', 'switch', 'steam deck', 'console'],
    brands: ['sony', 'microsoft', 'nintendo', 'valve'],
  },
  streaming: {
    keywords: ['netflix', 'disney', 'hulu', 'hbo', 'prime video', 'apple tv'],
    brands: ['netflix', 'disney', 'hbo', 'amazon', 'apple'],
  },
  software: {
    keywords: ['chatgpt', 'gemini', 'claude', 'copilot', 'midjourney', 'photoshop', 'figma', 'canva'],
    brands: ['openai', 'google', 'anthropic', 'microsoft', 'adobe'],
  },
  cars: {
    keywords: ['tesla', 'bmw', 'mercedes', 'toyota', 'honda', 'ford', 'car', 'vehicle'],
    brands: ['tesla', 'bmw', 'mercedes', 'toyota', 'honda', 'ford', 'chevrolet', 'nissan'],
  },
  headphones: {
    keywords: ['airpods', 'headphones', 'earbuds', 'sony wh', 'beats'],
    brands: ['apple', 'sony', 'bose', 'beats', 'sennheiser', 'jbl'],
  },
  smartwatch: {
    keywords: ['apple watch', 'galaxy watch', 'fitbit', 'smartwatch', 'watch'],
    brands: ['apple', 'samsung', 'fitbit', 'garmin', 'huawei'],
  },
};

export type ProductCategory = keyof typeof PRODUCT_CATEGORIES | null;

export interface ProductInfo {
  isProduct: boolean;
  category: ProductCategory;
  confidence: number; // 0-100
  brands: string[];
}

/**
 * Detect if a term is a product
 */
export function detectProduct(term: string): ProductInfo {
  const lower = term.toLowerCase().trim();

  let bestCategory: ProductCategory = null;
  let bestConfidence = 0;
  let matchedBrands: string[] = [];

  for (const [category, data] of Object.entries(PRODUCT_CATEGORIES)) {
    let confidence = 0;

    // Check keywords
    for (const keyword of data.keywords) {
      if (lower.includes(keyword)) {
        confidence += 30;
        break;
      }
    }

    // Check brands
    for (const brand of data.brands) {
      if (lower.includes(brand)) {
        confidence += 40;
        matchedBrands.push(brand);
        break;
      }
    }

    // Exact product model pattern (e.g., "iPhone 15", "PS5")
    if (/\d+/.test(lower) && confidence > 0) {
      confidence += 30;
    }

    if (confidence > bestConfidence) {
      bestConfidence = confidence;
      bestCategory = category as ProductCategory;
    }
  }

  return {
    isProduct: bestConfidence >= 30,
    category: bestCategory,
    confidence: Math.min(100, bestConfidence),
    brands: matchedBrands,
  };
}

/**
 * Detect if a comparison is between products
 */
export function detectProductComparison(termA: string, termB: string): {
  isProductComparison: boolean;
  category: ProductCategory;
  productA: ProductInfo;
  productB: ProductInfo;
} {
  const productA = detectProduct(termA);
  const productB = detectProduct(termB);

  const isProductComparison = productA.isProduct && productB.isProduct;
  const sameCategory = productA.category === productB.category;

  return {
    isProductComparison,
    category: sameCategory ? productA.category : null,
    productA,
    productB,
  };
}

/**
 * Get product-specific insights
 */
export function getProductInsights(category: ProductCategory): {
  icon: string;
  label: string;
  insights: string[];
} {
  const categoryData: Record<NonNullable<ProductCategory>, { icon: string; label: string; insights: string[] }> = {
    phones: {
      icon: '📱',
      label: 'Smartphones',
      insights: [
        'Search trends often spike during new product launches',
        'Higher searches usually indicate market interest but not always sales',
        'Consider release dates, reviews, and carrier availability',
      ],
    },
    laptops: {
      icon: '💻',
      label: 'Laptops',
      insights: [
        'Back-to-school season (Aug-Sep) drives laptop searches',
        'Professional reviews heavily influence search patterns',
        'Price points and specs drive comparison searches',
      ],
    },
    gaming: {
      icon: '🎮',
      label: 'Gaming Consoles',
      insights: [
        'Holiday season (Nov-Dec) shows massive search spikes',
        'Exclusive games can drive sudden interest spikes',
        'Stock availability greatly affects search volume',
      ],
    },
    streaming: {
      icon: '📺',
      label: 'Streaming Services',
      insights: [
        'Content releases drive search spikes',
        'Price changes and new features affect interest',
        'Free trial periods correlate with search increases',
      ],
    },
    software: {
      icon: '🤖',
      label: 'Software & AI Tools',
      insights: [
        'Viral moments on social media drive massive spikes',
        'Feature releases and updates create search waves',
        'Free tiers and trials correlate with interest',
      ],
    },
    cars: {
      icon: '🚗',
      label: 'Vehicles',
      insights: [
        'Auto shows and unveiling events drive searches',
        'Fuel prices affect electric vs gas searches',
        'Tax incentives impact search patterns',
      ],
    },
    headphones: {
      icon: '🎧',
      label: 'Headphones',
      insights: [
        'Holiday gift season drives search volume',
        'Influencer reviews create search spikes',
        'Price drops correlate with interest increases',
      ],
    },
    smartwatch: {
      icon: '⌚',
      label: 'Smartwatches',
      insights: [
        'Fitness trends affect smartwatch searches',
        'New health features drive interest',
        'Compatibility with phones influences choices',
      ],
    },
  };

  return category ? categoryData[category] : {
    icon: '🏷️',
    label: 'Products',
    insights: [
      'Product trends reflect market interest',
      'Search volume doesn\'t always equal sales',
      'Consider seasonality and release cycles',
    ],
  };
}
