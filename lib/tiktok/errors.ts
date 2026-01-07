/**
 * TikTok-specific error classes
 */

import { ComparisonError } from '../utils/errors';

/**
 * Error thrown when a TikTok username is not found
 */
export class TikTokUserNotFoundError extends ComparisonError {
  constructor(username: string) {
    super(
      `TikTok user not found: ${username}`,
      'TIKTOK_USER_NOT_FOUND',
      `Username "${username}" not found on TikTok. Please check the spelling and try again.`,
      false,
      404
    );
    this.name = 'TikTokUserNotFoundError';
  }
}

/**
 * Error thrown when TikTok API is not configured
 */
export class TikTokAPINotConfiguredError extends ComparisonError {
  constructor() {
    super(
      'TikTok API not configured',
      'TIKTOK_API_NOT_CONFIGURED',
      'TikTok data is currently unavailable. Please contact support.',
      false,
      503
    );
    this.name = 'TikTokAPINotConfiguredError';
  }
}

/**
 * Error thrown when TikTok username format is invalid
 */
export class InvalidTikTokUsernameError extends ComparisonError {
  constructor(username: string) {
    super(
      `Invalid TikTok username format: ${username}`,
      'INVALID_TIKTOK_USERNAME',
      `"${username}" is not a valid TikTok username. Usernames must be 1-24 characters, alphanumeric with underscores only.`,
      false,
      400
    );
    this.name = 'InvalidTikTokUsernameError';
  }
}

