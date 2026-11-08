import { getCachedJson, setCachedJson } from './redis';
import { IChannel, IStream } from './types';

export interface StreamHealthResult {
  online: boolean;
  status?: number;
  latency?: number;
  error?: string;
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function checkStreamHealth(url: string, timeoutMs = 3000): Promise<StreamHealthResult> {
  if (!url || !url.startsWith('http')) {
    return { online: false, error: 'Invalid URL format' };
  }

  const cacheKey = `stream:health:${Buffer.from(url).toString('base64').slice(0, 48)}`;
  const cached = await getCachedJson<StreamHealthResult>(cacheKey);
  if (cached) return cached;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const start = Date.now();

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': USER_AGENT, Range: 'bytes=0-100' },
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    const latency = Date.now() - start;

    // Bad links: 404 (not found), 403 (geo-blocked/forbidden), 410, or >= 500
    const isBadStatus = res.status === 404 || res.status === 403 || res.status === 410 || res.status >= 500;
    const isSuccess = !isBadStatus && (res.ok || (res.status >= 200 && res.status < 400));

    const result: StreamHealthResult = {
      online: isSuccess,
      status: res.status,
      latency,
      error: !isSuccess ? (res.status === 403 ? 'Geo-blocked (403)' : res.status === 404 ? 'Not Found (404)' : `HTTP ${res.status}`) : undefined,
    };

    await setCachedJson(cacheKey, result, 18000);
    return result;
  } catch (err: any) {
    clearTimeout(timer);
    const latency = Date.now() - start;
    const isTimeout = err.name === 'AbortError' || latency >= timeoutMs;
    const result: StreamHealthResult = {
      online: false,
      latency,
      error: isTimeout ? 'Timeout (> 3s)' : (err.message || 'Network error'),
    };

    await setCachedJson(cacheKey, result, 18000);
    return result;
  }
}

export async function checkChannelHealth(channel: IChannel, timeoutMs = 3000): Promise<{ online: boolean; workingStream?: IStream; latency?: number }> {
  const streams = channel.streams || [];
  if (streams.length === 0) return { online: false };

  for (const s of streams) {
    const res = await checkStreamHealth(s.url, timeoutMs);
    if (res.online) {
      return { online: true, workingStream: s, latency: res.latency };
    }
  }

  return { online: false };
}

