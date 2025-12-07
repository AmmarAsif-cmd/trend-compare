/**
 * Keyword Validation System
 * Filters out malicious, random, or invalid keywords while allowing legitimate terms
 */

// Allowed special characters in specific contexts
const LEGITIMATE_PATTERNS = {
  // Programming languages with special chars
  programming: /^(c\+\+|c#|f#|\.net|node\.js|next\.js|vue\.js|react\.js|angular\.js)$/i,

  // Version numbers (e.g., "iPhone 16", "PS5", "GPT-4")
  versions: /^[a-z0-9]+(?: +[0-9]+(?:\.[0-9]+)*)?$/i,

  // Brand names with proper formatting
  brands: /^[a-z][a-z0-9]*(?:[ -][a-z0-9]+)*$/i,
};

// Blocklist patterns - reject these immediately
const BLOCKED_PATTERNS = [
  /[<>{}[\]]/,                    // HTML/code injection characters
  /javascript:/i,                  // Script injection
  /on\w+=/i,                       // Event handlers (onclick=, etc.)
  /<script/i,                      // Script tags
  /eval\(/i,                       // Eval injection
  /[^\x00-\x7F]{10,}/,            // Too many non-ASCII chars (likely spam)
  /(.)\1{5,}/,                     // Repeated characters (aaaaa, 11111)
  /^[^a-z0-9]+$/i,                // Only special characters
  /\.\./,                          // Path traversal
  /[!@#$%^&*()]{3,}/,             // Too many special chars together
];

// Common legitimate keywords (whitelist for special cases)
const WHITELIST_KEYWORDS = new Set([
  // Tech
  'c++', 'c#', 'f#', '.net',
  'node.js', 'next.js', 'vue.js', 'react.js', 'angular.js', 'svelte.js',

  // AI
  'chatgpt', 'gpt-4', 'gpt-3', 'claude', 'gemini', 'copilot', 'perplexity',

  // Phones
  'iphone', 'iphone 14', 'iphone 15', 'iphone 16',
  'galaxy s24', 'galaxy s23', 'pixel 9', 'pixel 8',

  // Gaming
  'ps5', 'ps4', 'xbox series x', 'xbox series s', 'nintendo switch',

  // Streaming
  'disney+', 'disney plus', 'amazon prime', 'prime video',

  // Social
  'x.com', 'meta',
]);

/**
 * Validate a keyword for legitimacy and safety
 */
export function isValidKeyword(keyword: string): boolean {
  if (!keyword || typeof keyword !== 'string') {
    return false;
  }

  const trimmed = keyword.trim();

  // Length checks
  if (trimmed.length < 2) {
    return false; // Too short
  }
  if (trimmed.length > 100) {
    return false; // Too long (likely spam)
  }

  // Whitelist check - allow known legitimate terms
  const lower = trimmed.toLowerCase();
  if (WHITELIST_KEYWORDS.has(lower)) {
    return true;
  }

  // Blocklist check - reject malicious patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      console.warn(`[Keyword Validator] Blocked keyword: "${trimmed}" (matched ${pattern})`);
      return false;
    }
  }

  // Check against legitimate patterns
  for (const pattern of Object.values(LEGITIMATE_PATTERNS)) {
    if (pattern.test(trimmed)) {
      return true;
    }
  }

  // Additional heuristics
  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount > 6) {
    // Too many words - likely spam or sentence
    return false;
  }

  // Count special characters
  const specialCharCount = (trimmed.match(/[^a-z0-9\s-]/gi) || []).length;
  if (specialCharCount > 3) {
    // Too many special characters
    return false;
  }

  // Check for balanced characters
  const openBrackets = (trimmed.match(/[({[]/g) || []).length;
  const closeBrackets = (trimmed.match(/[)}\]]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    return false;
  }

  // Check for reasonable alphanumeric content
  const alphanumericCount = (trimmed.match(/[a-z0-9]/gi) || []).length;
  if (alphanumericCount < trimmed.length * 0.5) {
    // Less than 50% alphanumeric - suspicious
    return false;
  }

  // Passed all checks
  return true;
}

/**
 * Sanitize and normalize a keyword
 * IMPORTANT: Does NOT remove special characters - only trims and normalizes whitespace
 */
export function sanitizeKeyword(keyword: string): string {
  if (!keyword) return '';

  return keyword
    .trim()
    .replace(/\s+/g, ' ')           // Normalize whitespace only
    .slice(0, 100);                  // Limit length
}

/**
 * Validate an array of keywords, filtering out invalid ones
 */
export function validateKeywords(keywords: string[]): string[] {
  return keywords
    .map(k => sanitizeKeyword(k))
    .filter(k => isValidKeyword(k));
}

/**
 * Check if a keyword is safe for URL slug
 */
export function isSafeForSlug(keyword: string): boolean {
  if (!isValidKeyword(keyword)) {
    return false;
  }

  // Additional URL safety checks
  const unsafe = [
    /__proto__/i,
    /constructor/i,
    /prototype/i,
  ];

  return !unsafe.some(pattern => pattern.test(keyword));
}
