import { NextRequest, NextResponse } from 'next/server';
import { checkStreamHealth } from '@/lib/streamHealth';
import { getChannelsCollection } from '@/lib/mongodb';
import { invalidateCachePattern } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const streamUrl = searchParams.get('url');

  if (!streamUrl) {
    return NextResponse.json({ error: 'Missing stream url parameter' }, { status: 400 });
  }

  const result = await checkStreamHealth(streamUrl, 3000);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { channelId, online } = body;

    if (!channelId) {
      return NextResponse.json({ error: 'Missing channelId' }, { status: 400 });
    }

    const col = await getChannelsCollection();
    await col.updateOne(
      { id: channelId },
      { $set: { online: Boolean(online), last_checked: new Date() } }
    );

    // Invalidate any channels list cache in Redis
    try {
      await invalidateCachePattern('channels:*');
    } catch {}

    return NextResponse.json({ success: true, channelId, online: Boolean(online) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
