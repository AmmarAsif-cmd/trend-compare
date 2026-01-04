/**
 * Input Validation Utilities
 * Validates user inputs to prevent injection and ensure security
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate comparison terms
 */
export function validateTerms(terms: string[]): ValidationResult {
  if (!Array.isArray(terms) || terms.length !== 2) {
    return { valid: false, error: 'Must provide exactly 2 terms' };
  }

  for (const term of terms) {
    if (typeof term !== 'string') {
      return { valid: false, error: 'Terms must be strings' };
    }

    if (term.length < 1 || term.length > 100) {
      return { valid: false, error: 'Term length must be between 1 and 100 characters' };
    }

    // Check for potentially dangerous characters
    if (/[<>\"'&]/.test(term)) {
      return { valid: false, error: 'Terms contain invalid characters' };
    }

    // Check for SQL injection patterns (basic)
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
      /(--|;|\/\*|\*\/|xp_|sp_)/i,
    ];
    if (sqlPatterns.some(pattern => pattern.test(term))) {
      return { valid: false, error: 'Invalid term format' };
    }
  }

  return { valid: true };
}

/**
 * Validate timeframe
 */
export function validateTimeframe(timeframe: string): ValidationResult {
  const validTimeframes = ['7d', '30d', '12m', '5y', 'all'];
  
  if (!validTimeframes.includes(timeframe)) {
    return { valid: false, error: `Timeframe must be one of: ${validTimeframes.join(', ')}` };
  }

  return { valid: true };
}

/**
 * Validate geo code (ISO 3166-1 alpha-2)
 */
export function validateGeo(geo: string): ValidationResult {
  if (!geo) {
    return { valid: true }; // Empty is valid (worldwide)
  }

  // ISO 3166-1 alpha-2: 2 uppercase letters
  if (!/^[A-Z]{2}$/.test(geo)) {
    return { valid: false, error: 'Geo code must be a 2-letter ISO country code' };
  }

  return { valid: true };
}

/**
 * Validate slug format
 */
export function validateSlug(slug: string): ValidationResult {
  if (typeof slug !== 'string') {
    return { valid: false, error: 'Slug must be a string' };
  }

  if (slug.length < 3 || slug.length > 200) {
    return { valid: false, error: 'Slug length must be between 3 and 200 characters' };
  }

  // Slug should only contain lowercase letters, numbers, and hyphens
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { valid: false, error: 'Slug contains invalid characters' };
  }

  // Check for SQL injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|;|\/\*|\*\/|xp_|sp_)/i,
  ];
  if (sqlPatterns.some(pattern => pattern.test(slug))) {
    return { valid: false, error: 'Invalid slug format' };
  }

  return { valid: true };
}

/**
 * Validate URL to prevent SSRF
 */
export function validateUrl(url: string, allowedHosts?: string[]): ValidationResult {
  try {
    const parsed = new URL(url);
    
    // Check protocol
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'URL must use http or https protocol' };
    }

    // Check for private IPs (SSRF protection)
    const hostname = parsed.hostname;
    const privateIpPatterns = [
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^localhost$/i,
      /^0\.0\.0\.0$/,
    ];

    if (privateIpPatterns.some(pattern => pattern.test(hostname))) {
      return { valid: false, error: 'URL cannot point to private IP addresses' };
    }

    // Check allowed hosts if provided
    if (allowedHosts && allowedHosts.length > 0) {
      if (!allowedHosts.includes(hostname)) {
        return { valid: false, error: 'URL host not in allowed list' };
      }
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Sanitize string for logging (remove secrets)
 */
export function sanitizeForLogging(value: string): string {
  // Remove potential secrets
  return value
    .replace(/password[=:]\s*[^\s,]+/gi, 'password=***')
    .replace(/api[_-]?key[=:]\s*[^\s,]+/gi, 'api_key=***')
    .replace(/token[=:]\s*[^\s,]+/gi, 'token=***')
    .replace(/secret[=:]\s*[^\s,]+/gi, 'secret=***');
}

