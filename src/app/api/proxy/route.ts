import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');
  // Some feeds only answer when called with a specific Referer / User-Agent.
  const referrer = searchParams.get('ref');
  const userAgent = searchParams.get('ua');

  if (!targetUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const headers: Record<string, string> = {
      'User-Agent':
        userAgent ||
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: '*/*',
    };
    if (referrer) {
      headers.Referer = referrer;
      try {
        headers.Origin = new URL(referrer).origin;
      } catch {}
    }

    let response: Response;
    try {
      response = await fetch(targetUrl, { headers, redirect: 'follow', signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return new NextResponse(`Upstream returned ${response.status}`, {
        status: response.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    const contentType = response.headers.get('content-type') || 'application/vnd.apple.mpegurl';

    if (contentType.toLowerCase().includes('mpegurl') || targetUrl.includes('.m3u8')) {
      const text = await response.text();
      // Resolve relative paths against the final URL after redirects (e.g. jmp2.uk -> Pluto CDN).
      const baseUrl = response.url || targetUrl;
      const proxify = (uri: string) => {
        try {
          const params = new URLSearchParams({ url: new URL(uri, baseUrl).toString() });
          if (referrer) params.set('ref', referrer);
          if (userAgent) params.set('ua', userAgent);
          return `/api/proxy?${params.toString()}`;
        } catch {
          return uri;
        }
      };

      const rewritten = text.split('\n').map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;
        if (trimmed.startsWith('#')) {
          // Rewrite URI="..." attributes (EXT-X-KEY, EXT-X-MEDIA, EXT-X-MAP, etc.)
          return line.replace(/URI="([^"]+)"/g, (_, uri) => `URI="${proxify(uri)}"`);
        }
        return proxify(trimmed);
      });

      return new NextResponse(rewritten.join('\n'), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    return new NextResponse(Buffer.from(arrayBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (error: any) {
    const isTimeout = error.name === 'AbortError';
    return new NextResponse(isTimeout ? 'Upstream request timed out' : error.message, {
      status: isTimeout ? 504 : 502,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }
}

