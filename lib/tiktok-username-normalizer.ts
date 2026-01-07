/**
 * TikTok Username Normalizer
 * Handles normalization and validation of TikTok usernames
 * 
 * Accepted formats:
 * - "charlidamelio" (username without @)
 * - "@charlidamelio" (username with @)
 * - "https://www.tiktok.com/@charlidamelio" (full URL)
 * 
 * Returns normalized username: "charlidamelio" (lowercase, no @, no special chars)
 */

/**
 * Normalize TikTok username from various input formats
 * @param input - Username input (with/without @, or full URL)
 * @returns Normalized username (lowercase, no @) or null if invalid
 */
export function normalizeTikTokUsername(input: string | null | undefined): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }
  
  let username = input.trim();
  
  // Remove @ prefix if present
  if (username.startsWith('@')) {
    username = username.slice(1);
  }
  
  // Extract from URL if full URL provided
  // Match patterns like:
  // - https://www.tiktok.com/@username
  // - https://tiktok.com/@username
  // - www.tiktok.com/@username
  // - tiktok.com/@username
  // Note: Username can contain letters, numbers, underscores, and periods
  const urlMatch = username.match(/tiktok\.com\/@([a-zA-Z0-9_.]+)/);
  if (urlMatch && urlMatch[1]) {
    username = urlMatch[1];
  }
  
  // Convert to lowercase
  username = username.toLowerCase();
  
  // Remove whitespace
  username = username.replace(/\s+/g, '');
  
  // Validate format: 1-24 chars, alphanumeric + underscore + period
  // TikTok allows: letters (a-z), numbers (0-9), underscores (_), and periods (.)
  const validPattern = /^[a-z0-9_.]{1,24}$/;
  if (!validPattern.test(username)) {
    return null; // Invalid format
  }
  
  // Cannot start with underscore or period
  if (username.startsWith('_') || username.startsWith('.')) {
    return null;
  }
  
  // Cannot end with period
  if (username.endsWith('.')) {
    return null;
  }
  
  // Cannot have consecutive periods
  if (username.includes('..')) {
    return null;
  }
  
  return username;
}

/**
 * Validate if a normalized username is valid (after normalization)
 * @param username - Already normalized username
 * @returns true if valid, false otherwise
 */
export function isValidTikTokUsername(username: string): boolean {
  if (!username || typeof username !== 'string') {
    return false;
  }
  
  // Must match pattern: 1-24 chars, alphanumeric + underscore + period
  const validPattern = /^[a-z0-9_.]{1,24}$/;
  if (!validPattern.test(username)) {
    return false;
  }
  
  // Cannot start with underscore or period
  if (username.startsWith('_') || username.startsWith('.')) {
    return false;
  }
  
  // Cannot end with period
  if (username.endsWith('.')) {
    return false;
  }
  
  // Cannot have consecutive periods
  if (username.includes('..')) {
    return false;
  }
  
  return true;
}

/**
 * Format username for display (add @ prefix)
 * @param username - Normalized username
 * @returns Display format: "@username"
 */
export function formatTikTokUsernameForDisplay(username: string): string {
  if (!username) {
    return '';
  }
  return `@${username}`;
}

/**
 * Get TikTok profile URL from username
 * @param username - Normalized username
 * @returns Full TikTok profile URL
 */
export function getTikTokProfileUrl(username: string): string {
  if (!username) {
    return '';
  }
  return `https://www.tiktok.com/@${username}`;
}

