/**
 * Apify TikTok Scraper API Client
 * Fetches TikTok user profile data including avatar, followers, engagement metrics
 */

import { normalizeTikTokUsername } from '../tiktok-username-normalizer';
import { TikTokAPINotConfiguredError, InvalidTikTokUsernameError, TikTokUserNotFoundError } from './errors';
import { APIError, QuotaExceededError, ComparisonError } from '../utils/errors';
import { retryWithBackoff } from '../utils/retry';
import { withTimeout } from '../utils/timeout';

const APIFY_API_BASE = 'https://api.apify.com/v2';
// Try different possible actor IDs - Apify actors can have different formats
const ACTOR_IDS = [
  'scraptik~tiktok-profile-scraper',
  'scraptik/tiktok-profile-scraper',
  'apify/tiktok-profile-scraper',
];
const ACTOR_ID = ACTOR_IDS[0]; // Default to first one

export interface TikTokUserProfile {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  followerCount?: number;
  followingCount?: number;
  videoCount?: number;
  likeCount?: number;
  engagementRate?: number;
  verified?: boolean;
  bio?: string;
  profileUrl?: string;
}

export interface ApifyTikTokResponse {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  followers?: number;
  following?: number;
  videos?: number;
  likes?: number;
  verified?: boolean;
  bio?: string;
  profileUrl?: string;
}

export class ApifyTikTokClient {
  private apiKey: string | null;
  private timeout: number;

  constructor(apiKey?: string, timeout: number = 30000) {
    this.apiKey = apiKey || process.env.APIFY_API_KEY || null;
    this.timeout = timeout;
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Fetch TikTok user profile data
   * @param username - Normalized TikTok username (without @)
   * @returns User profile data or null if not found
   */
  async fetchUserProfile(username: string): Promise<TikTokUserProfile | null> {
    if (!this.apiKey) {
      throw new TikTokAPINotConfiguredError();
    }

    // Normalize username to ensure format
    const normalized = normalizeTikTokUsername(username);
    if (!normalized) {
      throw new InvalidTikTokUsernameError(username);
    }

    try {
      // Use retry with backoff for transient errors
      const profile = await retryWithBackoff(
        () => this._fetchUserProfileInternal(normalized),
        {
          maxRetries: 2,
          initialDelay: 1000,
          maxDelay: 5000,
          shouldRetry: (error) => {
            // Never retry TikTok-specific errors (they're client errors, not transient)
            if (error instanceof TikTokUserNotFoundError ||
                error instanceof InvalidTikTokUsernameError ||
                error instanceof TikTokAPINotConfiguredError) {
              return false;
            }
            // Never retry ComparisonError (client errors, not transient)
            if (error instanceof ComparisonError) {
              return false;
            }
            // Retry on 5xx errors and network errors
            if (error instanceof APIError) {
              return error.statusCode !== undefined && error.statusCode >= 500;
            }
            return true;
          },
        }
      );

      return profile;
    } catch (error) {
      // Let specific TikTok errors propagate (check by name and instance)
      if (error instanceof TikTokUserNotFoundError || 
          error instanceof InvalidTikTokUsernameError || 
          error instanceof TikTokAPINotConfiguredError ||
          error instanceof APIError ||
          error instanceof QuotaExceededError ||
          (error && typeof error === 'object' && 'name' in error && 
           (error.name === 'TikTokUserNotFoundError' || 
            error.name === 'InvalidTikTokUsernameError' || 
            error.name === 'TikTokAPINotConfiguredError'))) {
        throw error;
      }
      
      // Handle quota exceeded by message
      if (error instanceof Error && error.message.includes('quota')) {
        throw new QuotaExceededError('Apify', 'Apify API quota exceeded. Please try again later.');
      }

      throw new APIError(
        `Failed to fetch TikTok profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Apify',
        500,
        true
      );
    }
  }

  /**
   * Internal method to fetch user profile
   * Uses Apify's run-sync endpoint to run actor and get results
   */
  private async _fetchUserProfileInternal(username: string): Promise<TikTokUserProfile | null> {
    if (!this.apiKey) {
      throw new TikTokAPINotConfiguredError();
    }

    // Apify API endpoint format: POST /v2/acts/{actorId}/run-sync
    // This runs the actor synchronously and returns the dataset ID
    const url = `${APIFY_API_BASE}/acts/${ACTOR_ID}/run-sync`;
    
    // Request body for TikTok profile scraper
    // The actor expects startUrls with TikTok profile URLs
    const requestBody = {
      startUrls: [{ url: `https://www.tiktok.com/@${username}` }],
      maxItems: 1,
    };

    try {
      console.log(`[Apify] Fetching profile for: ${username}`);
      
      const response = await withTimeout(
        fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }),
        this.timeout,
        'Apify TikTok profile fetch'
      );

      const responseText = await response.text();
      let responseData: any;
      
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error(`[Apify] Invalid JSON response (status ${response.status}):`, responseText.substring(0, 500));
        throw new APIError(
          `Apify API returned invalid response: ${response.status}`,
          'Apify',
          response.status,
          false
        );
      }

      if (!response.ok) {
        console.error(`[Apify] API Error (${response.status}):`, JSON.stringify(responseData).substring(0, 500));
        
        // Handle quota exceeded
        if (response.status === 429 || responseData.error?.message?.includes('quota')) {
          throw new QuotaExceededError('Apify', 'Apify API quota exceeded');
        }

        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
          console.error(`[Apify] Authentication failed - check API key`);
          throw new TikTokAPINotConfiguredError();
        }

        // Handle actor not found
        if (response.status === 404 && (responseData.error?.message?.includes('actor') || responseData.error?.message?.includes('not found'))) {
          console.error(`[Apify] Actor not found: ${ACTOR_ID}`);
          throw new APIError(
            `Apify actor not found. Please check actor ID: ${ACTOR_ID}`,
            'Apify',
            404,
            false
          );
        }

        // Handle not found (404) - user doesn't exist
        if (response.status === 404) {
          throw new TikTokUserNotFoundError(username);
        }

        // Handle other errors
        const errorMessage = responseData.error?.message || responseData.message || `HTTP ${response.status}`;
        throw new APIError(
          `Apify API error: ${errorMessage}`,
          'Apify',
          response.status,
          response.status >= 500
        );
      }

      // Check response structure
      // Apify run-sync returns: { data: { defaultDatasetId: "...", id: "...", ... } }
      if (responseData.data?.defaultDatasetId) {
        // Get dataset items
        const datasetId = responseData.data.defaultDatasetId;
        const datasetUrl = `${APIFY_API_BASE}/datasets/${datasetId}/items`;
        
        console.log(`[Apify] Fetching dataset: ${datasetId}`);
        
        // Wait a bit for dataset to be ready (Apify needs time to process)
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const datasetResponse = await fetch(datasetUrl, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        });

        if (!datasetResponse.ok) {
          console.error(`[Apify] Dataset fetch failed: ${datasetResponse.status}`);
          // If dataset not ready, try waiting more
          if (datasetResponse.status === 404) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            const retryResponse = await fetch(datasetUrl, {
              headers: {
                'Authorization': `Bearer ${this.apiKey}`,
              },
            });
            if (!retryResponse.ok) {
              throw new APIError(
                `Failed to get dataset: ${retryResponse.status}`,
                'Apify',
                retryResponse.status,
                false
              );
            }
            const retryData = await retryResponse.json();
            if (Array.isArray(retryData) && retryData.length > 0) {
              const item = retryData[0] as ApifyTikTokResponse;
              if (item && item.username) {
                console.log(`[Apify] Successfully fetched profile for ${username}`);
                return this._transformResponse(item, username);
              }
            }
          }
          throw new APIError(
            `Failed to get dataset: ${datasetResponse.status}`,
            'Apify',
            datasetResponse.status,
            false
          );
        }

        const datasetData = await datasetResponse.json();
        
        if (!Array.isArray(datasetData) || datasetData.length === 0) {
          console.log(`[Apify] Empty dataset for ${username}`);
          throw new TikTokUserNotFoundError(username);
        }

        const item = datasetData[0] as ApifyTikTokResponse;
        if (!item || !item.username) {
          console.log(`[Apify] Invalid item data for ${username}:`, item);
          throw new TikTokUserNotFoundError(username);
        }

        console.log(`[Apify] Successfully fetched profile for ${username}`);
        return this._transformResponse(item, username);
      }

      // If response has data array directly
      if (Array.isArray(responseData.data)) {
        if (responseData.data.length === 0) {
          throw new TikTokUserNotFoundError(username);
        }
        const item = responseData.data[0] as ApifyTikTokResponse;
        if (!item || !item.username) {
          throw new TikTokUserNotFoundError(username);
        }
        return this._transformResponse(item, username);
      }

      // If response is array directly
      if (Array.isArray(responseData)) {
        if (responseData.length === 0) {
          throw new TikTokUserNotFoundError(username);
        }
        const item = responseData[0] as ApifyTikTokResponse;
        if (!item || !item.username) {
          throw new TikTokUserNotFoundError(username);
        }
        return this._transformResponse(item, username);
      }

      console.error(`[Apify] Unexpected response structure:`, JSON.stringify(responseData).substring(0, 500));
      throw new TikTokUserNotFoundError(username);
    } catch (error) {
      // Let specific TikTok errors and API errors propagate
      if (error instanceof TikTokUserNotFoundError ||
          error instanceof InvalidTikTokUsernameError ||
          error instanceof TikTokAPINotConfiguredError ||
          error instanceof APIError ||
          error instanceof QuotaExceededError) {
        throw error;
      }

      // Handle timeout
      if (error instanceof Error && error.message.includes('timeout')) {
        throw new APIError(
          'Request to Apify API timed out',
          'Apify',
          408,
          true
        );
      }

      // Log unexpected errors for debugging
      console.error(`[Apify] Unexpected error for ${username}:`, error);
      throw new APIError(
        `Failed to fetch TikTok profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Apify',
        500,
        true
      );
    }
  }

  /**
   * Transform Apify response to our TikTokUserProfile format
   */
  private _transformResponse(item: ApifyTikTokResponse, username: string): TikTokUserProfile {
    return {
      username,
      displayName: item.displayName,
      avatarUrl: item.avatarUrl,
      followerCount: item.followers,
      followingCount: item.following,
      videoCount: item.videos,
      likeCount: item.likes,
      verified: item.verified || false,
      bio: item.bio,
      profileUrl: item.profileUrl || `https://www.tiktok.com/@${username}`,
      // Calculate engagement rate if we have the data
      engagementRate: item.followers && item.likes
        ? (item.likes / item.followers) * 100
        : undefined,
    };
  }
}

/**
 * Get or create Apify client instance
 */
let apifyClientInstance: ApifyTikTokClient | null = null;

export function getApifyClient(): ApifyTikTokClient {
  if (!apifyClientInstance) {
    apifyClientInstance = new ApifyTikTokClient();
  }
  return apifyClientInstance;
}

