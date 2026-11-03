import { NextRequest, NextResponse } from 'next/server';
import { fetchChannelsService } from '@/lib/channelService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const result = await fetchChannelsService({
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      country: searchParams.get('country') || '',
      favorites: searchParams.get('favorites') || '',
      page: Number(searchParams.get('page') || 1),
      limit: Number(searchParams.get('limit') || 36),
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Channels API Error]:', error);
    return NextResponse.json(
      { channels: [], total: 0, page: 1, limit: 36, totalPages: 1, hasMore: false, error: error.message },
      { status: 500 }
    );
  }
}

