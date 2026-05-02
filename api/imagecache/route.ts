import { NextRequest, NextResponse } from 'next/server';

// Server-side image proxy — fetches image and returns as base64 data URL
// No CORS issues since fetch happens on the server
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'no url' }, { status: 400 });

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      // 10 second timeout
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return NextResponse.json({ error: `upstream ${res.status}` }, { status: 502 });

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer      = await res.arrayBuffer();
    const base64      = Buffer.from(buffer).toString('base64');
    const dataUrl     = `data:${contentType};base64,${base64}`;

    return NextResponse.json({ dataUrl }, {
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
