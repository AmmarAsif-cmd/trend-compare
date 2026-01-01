/**
 * JSON Compression Utilities
 * Compress JSON responses to reduce payload sizes
 */

import { gzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);

/**
 * Compress JSON data with gzip
 */
export async function compressJSON(data: any): Promise<Buffer> {
  const jsonString = JSON.stringify(data);
  return gzipAsync(Buffer.from(jsonString, 'utf-8'));
}

/**
 * Check if client accepts gzip encoding
 */
export function acceptsGzip(request: Request): boolean {
  const acceptEncoding = request.headers.get('accept-encoding') || '';
  return acceptEncoding.includes('gzip');
}

/**
 * Create compressed response with proper headers
 * Returns NextResponse-compatible format
 */
export async function createCompressedResponse(
  data: any,
  request: Request
): Promise<{ body: BodyInit; headers: HeadersInit }> {
  if (acceptsGzip(request)) {
    const compressed = await compressJSON(data);
    return {
      body: compressed as unknown as BodyInit,
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip',
        'Content-Length': compressed.length.toString(),
        'Vary': 'Accept-Encoding',
      },
    };
  }
  
  // Fallback to uncompressed JSON
  return {
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  };
}

