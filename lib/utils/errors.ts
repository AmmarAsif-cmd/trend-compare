/**
 * Custom error classes for better error handling
 * Provides user-friendly messages and error codes
 */

export class ComparisonError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string,
    public retryable: boolean = false,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ComparisonError';
    Object.setPrototypeOf(this, ComparisonError.prototype);
  }
}

export class APIError extends Error {
  constructor(
    message: string,
    public apiName: string,
    public statusCode?: number,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'APIError';
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

export class InsufficientDataError extends ComparisonError {
  constructor(
    terms: string[],
    public timeframe: string,
    public geo: string
  ) {
    super(
      `Insufficient data for comparison: ${terms.join(' vs ')}`,
      'INSUFFICIENT_DATA',
      `We couldn't find enough data to compare "${terms.join('" and "')}". Try a different timeframe or different terms.`,
      false,
      404
    );
    this.name = 'InsufficientDataError';
  }
}

export class TimeoutError extends Error {
  constructor(
    public operation: string,
    public timeoutMs: number
  ) {
    super(`Operation "${operation}" timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export class QuotaExceededError extends Error {
  constructor(
    public service: string = 'API',
    message?: string
  ) {
    super(message || `${service} quota exceeded. Please try again later.`);
    this.name = 'QuotaExceededError';
    Object.setPrototypeOf(this, QuotaExceededError.prototype);
  }
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  if (error instanceof ComparisonError) {
    return error.retryable;
  }
  if (error instanceof APIError) {
    return error.retryable;
  }
  if (error instanceof TimeoutError) {
    return true; // Timeouts are usually retryable
  }
  
  // Network errors are retryable
  if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT' || error?.code === 'ENOTFOUND') {
    return true;
  }
  
  // 5xx errors are retryable
  if (error?.status >= 500 && error?.status < 600) {
    return true;
  }
  
  // 4xx errors are not retryable (client errors)
  if (error?.status >= 400 && error?.status < 500) {
    return false;
  }
  
  // Default to retryable for unknown errors
  return true;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: any): string {
  if (error instanceof ComparisonError) {
    return error.userMessage;
  }
  
  if (error instanceof APIError) {
    return `Failed to fetch data from ${error.apiName}. Please try again.`;
  }
  
  if (error instanceof TimeoutError) {
    return `The request took too long. Please try again.`;
  }
  
  // Handle common error patterns
  if (error?.message?.includes('timeout')) {
    return 'The request took too long. Please try again.';
  }
  
  if (error?.message?.includes('rate limit')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  
  if (error?.message?.includes('network')) {
    return 'Network error. Please check your connection and try again.';
  }
  
  // Default message
  return 'An error occurred. Please try again.';
}

