import { NextRequest, NextResponse } from 'next/server';
import { getCachedJson, setCachedJson } from '@/lib/redis';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name')?.trim();

  if (!name) {
    return NextResponse.json({ url: null }, { status: 400 });
  }

  const cacheKey = `actor:img:${name.toLowerCase()}`;
  const cachedUrl = await getCachedJson<string>(cacheKey);
  if (cachedUrl !== null && cachedUrl !== undefined) {
    return NextResponse.json({ url: cachedUrl || null });
  }

  try {
    const formattedName = encodeURIComponent(name.replace(/ /g, '_'));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${formattedName}`, {
      headers: {
        'User-Agent': 'MovieMania/2.0 (web-app; https://github.com/MovieMania)',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const imageUrl = data.thumbnail?.source || null;
      // Cache for 7 days (604800s) if found, or 1 day if not
      await setCachedJson(cacheKey, imageUrl || '', imageUrl ? 604800 : 86400);
      return NextResponse.json({ url: imageUrl });
    }
  } catch (err: any) {
    console.warn(`[Cast API] Failed to fetch photo for "${name}":`, err.message);
  }

  await setCachedJson(cacheKey, '', 86400);
  return NextResponse.json({ url: null });
}
