import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'no url' }, { status: 400 });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/webp,image/jpeg,image/*,*/*',
        'Referer': 'https://unsplash.com/',
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ error: `upstream ${res.status}` }, { status: 502 });
    }

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({ dataUrl }, {
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
    });
  } catch (e: any) {
    console.error('[imgcache] fetch failed:', e?.message);
    return NextResponse.json({ error: e?.message ?? 'unknown' }, { status: 502 });
  }
}
