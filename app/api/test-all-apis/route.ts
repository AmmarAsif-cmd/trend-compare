import { NextResponse } from 'next/server';
import { youtubeAdapter } from '@/lib/sources/adapters/youtube';
import { tmdbAdapter } from '@/lib/sources/adapters/tmdb';
import { bestBuyAdapter } from '@/lib/sources/adapters/bestbuy';
import { spotifyAdapter } from '@/lib/sources/adapters/spotify';
import { steamAdapter } from '@/lib/sources/adapters/steam';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    apis: {} as Record<string, any>,
  };

  // Test YouTube
  try {
    const hasKey = !!process.env.YOUTUBE_API_KEY;
    if (hasKey) {
      const testVideo = await youtubeAdapter.searchVideos('test', 1);
      results.apis.youtube = {
        status: 'success',
        configured: true,
        test: `Found ${testVideo.videos.length} videos`,
      };
    } else {
      results.apis.youtube = {
        status: 'not_configured',
        configured: false,
        error: 'YOUTUBE_API_KEY not set',
      };
    }
  } catch (error) {
    results.apis.youtube = {
      status: 'error',
      configured: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Test TMDB
  try {
    const hasKey = !!process.env.TMDB_API_KEY;
    if (hasKey) {
      const testMovie = await tmdbAdapter.searchMovie('Avatar');
      results.apis.tmdb = {
        status: 'success',
        configured: true,
        test: testMovie ? `Found: ${testMovie.title} (${testMovie.voteAverage}/10)` : 'No results',
      };
    } else {
      results.apis.tmdb = {
        status: 'not_configured',
        configured: false,
        error: 'TMDB_API_KEY not set',
      };
    }
  } catch (error) {
    results.apis.tmdb = {
      status: 'error',
      configured: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Test Best Buy
  try {
    const hasKey = !!process.env.BESTBUY_API_KEY;
    if (hasKey) {
      const testProduct = await bestBuyAdapter.searchProduct('iPhone');
      results.apis.bestbuy = {
        status: 'success',
        configured: true,
        test: testProduct ? `Found: ${testProduct.name} (${testProduct.customerReviewAverage}/5)` : 'No results',
      };
    } else {
      results.apis.bestbuy = {
        status: 'not_configured',
        configured: false,
        error: 'BESTBUY_API_KEY not set',
      };
    }
  } catch (error) {
    results.apis.bestbuy = {
      status: 'error',
      configured: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Test Spotify
  try {
    const hasKeys = !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
    if (hasKeys) {
      const testArtist = await spotifyAdapter.searchArtist('Drake');
      results.apis.spotify = {
        status: 'success',
        configured: true,
        test: testArtist ? `Found: ${testArtist.name} (${testArtist.popularity}/100 popularity, ${testArtist.followers.toLocaleString()} followers)` : 'No results',
      };
    } else {
      results.apis.spotify = {
        status: 'not_configured',
        configured: false,
        error: 'SPOTIFY_CLIENT_ID and/or SPOTIFY_CLIENT_SECRET not set',
        has_client_id: !!process.env.SPOTIFY_CLIENT_ID,
        has_client_secret: !!process.env.SPOTIFY_CLIENT_SECRET,
      };
    }
  } catch (error) {
    results.apis.spotify = {
      status: 'error',
      configured: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Test Steam (no key needed)
  try {
    const testGame = await steamAdapter.searchGame('Counter Strike');
    results.apis.steam = {
      status: 'success',
      configured: true,
      test: testGame ? `Found: ${testGame.name} (${testGame.reviewScore}% positive, ${testGame.currentPlayers.toLocaleString()} players)` : 'No results',
      note: 'Steam works without API key',
    };
  } catch (error) {
    results.apis.steam = {
      status: 'error',
      configured: true,
      error: error instanceof Error ? error.message : 'Unknown error',
      note: 'Steam should work without API key',
    };
  }

  // Summary
  const summary = {
    total: Object.keys(results.apis).length,
    working: Object.values(results.apis).filter((api: any) => api.status === 'success').length,
    errors: Object.values(results.apis).filter((api: any) => api.status === 'error').length,
    not_configured: Object.values(results.apis).filter((api: any) => api.status === 'not_configured').length,
  };

  return NextResponse.json({
    ...results,
    summary,
    overall_status: summary.errors === 0 && summary.not_configured === 0 ? 'all_working' : 'some_issues',
  }, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
