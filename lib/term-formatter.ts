/**
 * Term Formatting Utility
 * Preserves official casing for brands/products (ChatGPT, Gemini, etc.)
 * Uses Title Case for general terms
 */

// Common brand/product names with official casing
const OFFICIAL_NAMES: Record<string, string> = {
  // AI/Technology
  'chatgpt': 'ChatGPT',
  'chat gpt': 'ChatGPT',
  'openai': 'OpenAI',
  'gemini': 'Gemini',
  'claude': 'Claude',
  'anthropic': 'Anthropic',
  'iphone': 'iPhone',
  'ipad': 'iPad',
  'imac': 'iMac',
  'macbook': 'MacBook',
  'android': 'Android',
  'windows': 'Windows',
  'linux': 'Linux',
  'javascript': 'JavaScript',
  'typescript': 'TypeScript',
  'react': 'React',
  'vue': 'Vue',
  'angular': 'Angular',
  'nodejs': 'Node.js',
  'node.js': 'Node.js',
  'python': 'Python',
  'java': 'Java',
  'c++': 'C++',
  'c#': 'C#',
  'html': 'HTML',
  'css': 'CSS',
  'api': 'API',
  'aws': 'AWS',
  'azure': 'Azure',
  'gcp': 'GCP',
  'google cloud': 'Google Cloud',
  
  // Entertainment
  'taylor swift': 'Taylor Swift',
  'beyonce': 'Beyoncé',
  'beyoncé': 'Beyoncé',
  'arijit singh': 'Arijit Singh',
  'drake': 'Drake',
  'the weeknd': 'The Weeknd',
  'ed sheeran': 'Ed Sheeran',
  'billie eilish': 'Billie Eilish',
  
  // Finance
  'credit card': 'Credit Card',
  'debit card': 'Debit Card',
  'paypal': 'PayPal',
  'visa': 'Visa',
  'mastercard': 'Mastercard',
  'american express': 'American Express',
  'amex': 'American Express',
  
  // Companies
  'microsoft': 'Microsoft',
  'apple': 'Apple',
  'google': 'Google',
  'amazon': 'Amazon',
  'meta': 'Meta',
  'facebook': 'Facebook',
  'twitter': 'X',
  'x': 'X',
  'tesla': 'Tesla',
  'netflix': 'Netflix',
  'spotify': 'Spotify',
  'youtube': 'YouTube',
  'instagram': 'Instagram',
  'tiktok': 'TikTok',
  'linkedin': 'LinkedIn',
};

/**
 * Format a term with proper casing
 * Preserves official brand names, uses Title Case for others
 */
export function formatTerm(term: string): string {
  if (!term) return '';
  
  // Normalize for lookup (lowercase, trim)
  const normalized = term.toLowerCase().trim();
  
  // Check if we have an official name
  if (OFFICIAL_NAMES[normalized]) {
    return OFFICIAL_NAMES[normalized];
  }
  
  // Check for partial matches (e.g., "chatgpt" in "chatgpt vs gemini")
  for (const [key, value] of Object.entries(OFFICIAL_NAMES)) {
    if (normalized.includes(key) && key.length > 3) {
      // Replace the key with the official name
      const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      term = term.replace(regex, value);
    }
  }
  
  // If term contains hyphens (slug format), split and format each part
  if (term.includes('-')) {
    return term
      .split('-')
      .map(word => {
        const lower = word.toLowerCase();
        if (OFFICIAL_NAMES[lower]) {
          return OFFICIAL_NAMES[lower];
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }
  
  // Title Case for general terms
  return term
    .split(' ')
    .map(word => {
      const lower = word.toLowerCase();
      if (OFFICIAL_NAMES[lower]) {
        return OFFICIAL_NAMES[lower];
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Format term for display in PDF (preserves official casing)
 */
export function formatTermForPDF(term: string): string {
  return formatTerm(term);
}

