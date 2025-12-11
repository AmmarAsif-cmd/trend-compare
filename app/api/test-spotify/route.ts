import { NextResponse } from 'next/server';
import { spotifyAdapter } from '@/lib/sources/adapters/spotify';

export async function GET() {
  try {
    // Test 1: Check if credentials are configured
    const hasCredentials = !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);

    if (!hasCredentials) {
      return NextResponse.json({
        success: false,
        error: 'Spotify credentials not configured',
        env: {
          hasClientId: !!process.env.SPOTIFY_CLIENT_ID,
          hasClientSecret: !!process.env.SPOTIFY_CLIENT_SECRET,
        }
      });
    }

    // Test 2: Try to search for an artist
    const testArtist = await spotifyAdapter.searchArtist('Taylor Swift');

    return NextResponse.json({
      success: true,
      credentials: 'configured',
      testResult: testArtist ? {
        name: testArtist.name,
        popularity: testArtist.popularity,
        followers: testArtist.followers,
        genres: testArtist.genres,
      } : null,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
