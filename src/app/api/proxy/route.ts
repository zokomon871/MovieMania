import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000); // 6s timeout for dead broadcast servers

    const headers: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: '*/*',
    };

    let response: Response;
    try {
      response = await fetch(targetUrl, {
        headers,
        redirect: 'follow',
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return new NextResponse(`Upstream returned ${response.status} ${response.statusText}`, {
        status: response.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    const contentType = response.headers.get('content-type') || 'application/vnd.apple.mpegurl';

    // If it's an m3u8 playlist, rewrite relative chunk URLs to proxy through this route
    if (
      contentType.includes('mpegurl') ||
      contentType.includes('x-mpegURL') ||
      targetUrl.includes('.m3u8')
    ) {
      const text = await response.text();
      const baseUrl = new URL(targetUrl);

      const lines = text.split('\n');
      const rewrittenLines = lines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
          return line;
        }

        let absoluteChunkUrl: string;
        try {
          if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            absoluteChunkUrl = trimmed;
          } else if (trimmed.startsWith('/')) {
            absoluteChunkUrl = `${baseUrl.origin}${trimmed}`;
          } else {
            const basePath = baseUrl.pathname.substring(0, baseUrl.pathname.lastIndexOf('/') + 1);
            absoluteChunkUrl = `${baseUrl.origin}${basePath}${trimmed}`;
          }

          return `/api/proxy?url=${encodeURIComponent(absoluteChunkUrl)}`;
        } catch {
          return line;
        }
      });

      return new NextResponse(rewrittenLines.join('\n'), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // For video chunks (.ts, .m4s, .mp4, audio), stream the binary buffer
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
    return new NextResponse(
      isTimeout ? 'Upstream stream server connection timed out (6s)' : `Proxy error: ${error.message}`,
      {
        status: 504,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
