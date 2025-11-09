import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Browsers post either application/csp-report or application/reports+json
    const contentType = request.headers.get('content-type') || '';
    let body: unknown = {};
    if (contentType.includes('application/json') || contentType.includes('application/reports+json')) {
      body = await request.json();
    } else if (contentType.includes('application/csp-report')) {
      body = await request.json();
    } else {
      body = { note: 'Unsupported report content-type', contentType };
    }

    // Replace with a real logger or send to your log store
    console.log('CSP Report:', JSON.stringify(body, null, 2));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('CSP report parse error', e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
