/**
 * TikTok API Test Endpoint
 * Tests if the Apify API is configured and working
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApifyClient } from '@/lib/tiktok/apify-client';

export async function GET(request: NextRequest) {
  try {
    const client = getApifyClient();
    const isConfigured = client.isConfigured();
    
    if (!isConfigured) {
      return NextResponse.json({
        configured: false,
        error: 'APIFY_API_KEY environment variable is not set',
        message: 'Please set APIFY_API_KEY in your .env file'
      }, { status: 503 });
    }

    // Try to fetch a known user to test the API
    try {
      const testUsername = 'tiktok'; // Known to exist
      const profile = await client.fetchUserProfile(testUsername);
      
      return NextResponse.json({
        configured: true,
        apiWorking: true,
        testUser: testUsername,
        profile: profile ? {
          username: profile.username,
          displayName: profile.displayName,
          followerCount: profile.followerCount
        } : null,
        message: 'API is working correctly'
      });
    } catch (error: any) {
      return NextResponse.json({
        configured: true,
        apiWorking: false,
        error: error.message || 'Unknown error',
        errorType: error.name || 'Error',
        message: 'API key is set but API call failed'
      }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({
      configured: false,
      error: error.message || 'Unknown error',
      message: 'Failed to test API'
    }, { status: 500 });
  }
}

