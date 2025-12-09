// lib/amazon-mock-data.ts
// Mock Amazon Product API data for demo purposes
// Structure matches Amazon Product Advertising API response format

export interface AmazonProduct {
  asin: string; // Amazon Standard Identification Number
  title: string;
  brand: string;
  price: {
    value: number;
    currency: string;
    displayPrice: string;
  } | null;
  rating: {
    value: number; // 1-5
    count: number; // Number of reviews
  } | null;
  image: string;
  url: string;
  availability: 'in_stock' | 'out_of_stock' | 'limited_stock';
  isPrime: boolean;
  category: string;
}

/**
 * Mock Amazon product database
 * In production, this would come from Amazon Product Advertising API
 */
const MOCK_PRODUCTS: Record<string, AmazonProduct> = {
  // Phones
  'iphone': {
    asin: 'B0DGFZ5W5W',
    title: 'Apple iPhone 15 Pro Max, 256GB, Natural Titanium',
    brand: 'Apple',
    price: {
      value: 1199.00,
      currency: 'USD',
      displayPrice: '$1,199.00',
    },
    rating: {
      value: 4.7,
      count: 8234,
    },
    image: 'https://m.media-amazon.com/images/I/81SigpJN1KL._AC_SX679_.jpg',
    url: 'https://www.amazon.com/dp/B0DGFZ5W5W',
    availability: 'in_stock',
    isPrime: true,
    category: 'phones',
  },
  'iphone 15': {
    asin: 'B0DGFZ5W5W',
    title: 'Apple iPhone 15 Pro Max, 256GB, Natural Titanium',
    brand: 'Apple',
    price: {
      value: 1199.00,
      currency: 'USD',
      displayPrice: '$1,199.00',
    },
    rating: {
      value: 4.7,
      count: 8234,
    },
    image: 'https://m.media-amazon.com/images/I/81SigpJN1KL._AC_SX679_.jpg',
    url: 'https://www.amazon.com/dp/B0DGFZ5W5W',
    availability: 'in_stock',
    isPrime: true,
    category: 'phones',
  },
  'samsung': {
    asin: 'B0CMDRCZBJ',
    title: 'Samsung Galaxy S24 Ultra, 256GB, Titanium Gray',
    brand: 'Samsung',
    price: {
      value: 1299.99,
      currency: 'USD',
      displayPrice: '$1,299.99',
    },
    rating: {
      value: 4.5,
      count: 5421,
    },
    image: 'https://m.media-amazon.com/images/I/71Oa6IeJ-WL._AC_SX679_.jpg',
    url: 'https://www.amazon.com/dp/B0CMDRCZBJ',
    availability: 'in_stock',
    isPrime: true,
    category: 'phones',
  },
  'samsung galaxy': {
    asin: 'B0CMDRCZBJ',
    title: 'Samsung Galaxy S24 Ultra, 256GB, Titanium Gray',
    brand: 'Samsung',
    price: {
      value: 1299.99,
      currency: 'USD',
      displayPrice: '$1,299.99',
    },
    rating: {
      value: 4.5,
      count: 5421,
    },
    image: 'https://m.media-amazon.com/images/I/71Oa6IeJ-WL._AC_SX679_.jpg',
    url: 'https://www.amazon.com/dp/B0CMDRCZBJ',
    availability: 'in_stock',
    isPrime: true,
    category: 'phones',
  },

  // Gaming Consoles
  'ps5': {
    asin: 'B0CL61F39H',
    title: 'PlayStation 5 Console (PS5) Slim',
    brand: 'Sony',
    price: {
      value: 499.99,
      currency: 'USD',
      displayPrice: '$499.99',
    },
    rating: {
      value: 4.8,
      count: 12543,
    },
    image: 'https://m.media-amazon.com/images/I/51JuRya6bZL._AC_SX679_.jpg',
    url: 'https://www.amazon.com/dp/B0CL61F39H',
    availability: 'in_stock',
    isPrime: false,
    category: 'gaming',
  },
  'playstation': {
    asin: 'B0CL61F39H',
    title: 'PlayStation 5 Console (PS5) Slim',
    brand: 'Sony',
    price: {
      value: 499.99,
      currency: 'USD',
      displayPrice: '$499.99',
    },
    rating: {
      value: 4.8,
      count: 12543,
    },
    image: 'https://m.media-amazon.com/images/I/51JuRya6bZL._AC_SX679_.jpg',
    url: 'https://www.amazon.com/dp/B0CL61F39H',
    availability: 'in_stock',
    isPrime: false,
    category: 'gaming',
  },
  'xbox': {
    asin: 'B0CKVFT2MM',
    title: 'Xbox Series X 1TB Console - Black',
    brand: 'Microsoft',
    price: {
      value: 499.99,
      currency: 'USD',
      displayPrice: '$499.99',
    },
    rating: {
      value: 4.7,
      count: 9834,
    },
    image: 'https://m.media-amazon.com/images/I/51EBlsdue6L._AC_SX679_.jpg',
    url: 'https://www.amazon.com/dp/B0CKVFT2MM',
    availability: 'in_stock',
    isPrime: true,
    category: 'gaming',
  },

  // Laptops
  'macbook': {
    asin: 'B0CM5JV26D',
    title: 'Apple MacBook Pro 14" M3 Chip, 16GB RAM, 512GB SSD',
    brand: 'Apple',
    price: {
      value: 1999.00,
      currency: 'USD',
      displayPrice: '$1,999.00',
    },
    rating: {
      value: 4.8,
      count: 3421,
    },
    image: 'https://m.media-amazon.com/images/I/61RJn0ofUsL._AC_SX679_.jpg',
    url: 'https://www.amazon.com/dp/B0CM5JV26D',
    availability: 'in_stock',
    isPrime: true,
    category: 'laptops',
  },
  'thinkpad': {
    asin: 'B0CL91B13N',
    title: 'Lenovo ThinkPad X1 Carbon Gen 11, Intel i7, 16GB, 512GB',
    brand: 'Lenovo',
    price: {
      value: 1549.00,
      currency: 'USD',
      displayPrice: '$1,549.00',
    },
    rating: {
      value: 4.6,
      count: 2156,
    },
    image: 'https://m.media-amazon.com/images/I/61gq9VxCMGL._AC_SX679_.jpg',
    url: 'https://www.amazon.com/dp/B0CL91B13N',
    availability: 'in_stock',
    isPrime: true,
    category: 'laptops',
  },

  // Headphones
  'airpods': {
    asin: 'B0D1XD1ZV3',
    title: 'Apple AirPods Pro (2nd Generation) with MagSafe Charging',
    brand: 'Apple',
    price: {
      value: 249.00,
      currency: 'USD',
      displayPrice: '$249.00',
    },
    rating: {
      value: 4.7,
      count: 67234,
    },
    image: 'https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SX679_.jpg',
    url: 'https://www.amazon.com/dp/B0D1XD1ZV3',
    availability: 'in_stock',
    isPrime: true,
    category: 'headphones',
  },
  'sony headphones': {
    asin: 'B0BTFBY5P9',
    title: 'Sony WH-1000XM5 Wireless Noise-Canceling Headphones',
    brand: 'Sony',
    price: {
      value: 399.99,
      currency: 'USD',
      displayPrice: '$399.99',
    },
    rating: {
      value: 4.6,
      count: 15234,
    },
    image: 'https://m.media-amazon.com/images/I/61vJN18A-IL._AC_SX679_.jpg',
    url: 'https://www.amazon.com/dp/B0BTFBY5P9',
    availability: 'in_stock',
    isPrime: true,
    category: 'headphones',
  },

  // Smartwatches
  'apple watch': {
    asin: 'B0DGJLQ8JZ',
    title: 'Apple Watch Series 10 GPS, 46mm, Sport Band',
    brand: 'Apple',
    price: {
      value: 429.00,
      currency: 'USD',
      displayPrice: '$429.00',
    },
    rating: {
      value: 4.8,
      count: 4521,
    },
    image: 'https://m.media-amazon.com/images/I/71u5JvfS78L._AC_SX679_.jpg',
    url: 'https://www.amazon.com/dp/B0DGJLQ8JZ',
    availability: 'in_stock',
    isPrime: true,
    category: 'smartwatch',
  },

  // Streaming Devices
  'chromecast': {
    asin: 'B0B9HS6DLZ',
    title: 'Google Chromecast with Google TV (4K)',
    brand: 'Google',
    price: {
      value: 49.99,
      currency: 'USD',
      displayPrice: '$49.99',
    },
    rating: {
      value: 4.5,
      count: 23421,
    },
    image: 'https://m.media-amazon.com/images/I/51JfLFBa6ML._AC_SX679_.jpg',
    url: 'https://www.amazon.com/dp/B0B9HS6DLZ',
    availability: 'in_stock',
    isPrime: true,
    category: 'streaming',
  },
  'fire stick': {
    asin: 'B0BP9SNVH9',
    title: 'Amazon Fire TV Stick 4K Max (2nd Gen)',
    brand: 'Amazon',
    price: {
      value: 59.99,
      currency: 'USD',
      displayPrice: '$59.99',
    },
    rating: {
      value: 4.7,
      count: 89234,
    },
    image: 'https://m.media-amazon.com/images/I/51TjJOTfslL._AC_SX679_.jpg',
    url: 'https://www.amazon.com/dp/B0BP9SNVH9',
    availability: 'in_stock',
    isPrime: true,
    category: 'streaming',
  },
};

/**
 * Search for Amazon product by term (DEMO VERSION)
 * In production, this would call Amazon Product Advertising API
 */
export async function searchAmazonProduct(term: string): Promise<AmazonProduct | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // Normalize search term
  const normalizedTerm = term.toLowerCase().trim();

  // Try exact match first
  if (MOCK_PRODUCTS[normalizedTerm]) {
    return MOCK_PRODUCTS[normalizedTerm];
  }

  // Try partial match
  const partialMatch = Object.keys(MOCK_PRODUCTS).find(key =>
    normalizedTerm.includes(key) || key.includes(normalizedTerm)
  );

  if (partialMatch) {
    return MOCK_PRODUCTS[partialMatch];
  }

  // No product found
  return null;
}

/**
 * Get product comparison (DEMO VERSION)
 */
export async function getProductComparison(
  termA: string,
  termB: string
): Promise<{ productA: AmazonProduct | null; productB: AmazonProduct | null }> {
  const [productA, productB] = await Promise.all([
    searchAmazonProduct(termA),
    searchAmazonProduct(termB),
  ]);

  return { productA, productB };
}

/**
 * Check if both terms are products in the same category
 */
export function isProductComparison(
  productA: AmazonProduct | null,
  productB: AmazonProduct | null
): boolean {
  if (!productA || !productB) return false;
  return productA.category === productB.category;
}
