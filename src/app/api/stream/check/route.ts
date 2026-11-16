import { NextRequest, NextResponse } from 'next/server';
import { getMovieStreamUrls, getSeriesStreamUrls, VODServer } from '@/lib/mediaUtils';

export const dynamic = 'force-dynamic';

const SERVERS: VODServer[] = ['vidsrc', 'vidlink', 'cinesrc'];

async function probeUrl(url: string, timeoutMs = 2800): Promise<{ ok: boolean; status: number; latency: number }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeout);
    const latency = Date.now() - start;
    return {
      ok: res.ok || res.status === 200 || res.status === 304,
      status: res.status,
      latency,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      latency: Date.now() - start,
    };
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const type = searchParams.get('type') || 'movie';
  const season = parseInt(searchParams.get('season') || '1', 10);
  const episode = parseInt(searchParams.get('episode') || '1', 10);
  const tmdbId = searchParams.get('tmdbId') || undefined;

  if (!id) {
    return NextResponse.json({ error: 'Missing media id' }, { status: 400 });
  }

  const urls =
    type === 'series'
      ? getSeriesStreamUrls(id, season, episode, tmdbId)
      : getMovieStreamUrls(id, tmdbId);

  // Probe servers concurrently with quick timeout
  const probePromises = SERVERS.map(async (serverKey) => {
    const url = urls[serverKey];
    const probe = await probeUrl(url);
    return {
      server: serverKey,
      url,
      ...probe,
    };
  });

  const results = await Promise.all(probePromises);

  // Find the first operational server (preferring lower latency among working ones)
  const operational = results.filter((r) => r.ok);
  operational.sort((a, b) => a.latency - b.latency);

  const bestServer: VODServer = operational.length > 0 ? operational[0].server : 'vidsrc';

  return NextResponse.json({
    bestServer,
    results,
    urls,
    timestamp: Date.now(),
  });
}
