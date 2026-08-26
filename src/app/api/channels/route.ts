import { NextRequest, NextResponse } from 'next/server';
import { getChannelsCollection } from '@/lib/mongodb';
import { getCachedJson, setCachedJson } from '@/lib/redis';
import { runSyncPipeline } from '@/lib/syncEngine';
import { IChannel } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').trim();
    const category = (searchParams.get('category') || '').trim();
    const country = (searchParams.get('country') || '').trim().toUpperCase();
    const language = (searchParams.get('language') || '').trim().toLowerCase();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '36', 10)));
    const favorites = searchParams.get('favorites') || '';
    const featured = searchParams.get('featured') === 'true';
    const verifiedOnly = searchParams.get('verified') === 'true';

    const cacheKey = `channels:s=${encodeURIComponent(search)}:cat=${category}:cou=${country}:lang=${language}:p=${page}:l=${limit}:fav=${favorites}:feat=${featured}:ver=${verifiedOnly}`;

    // 1. Try Redis cache
    const cached = await getCachedJson<{ channels: IChannel[]; total: number; page: number; totalPages: number }>(cacheKey);
    if (cached) {
      return NextResponse.json({
        ...cached,
        fromCache: true,
      });
    }

    const channelsCol = await getChannelsCollection();
    const totalExisting = await channelsCol.estimatedDocumentCount();

    // Auto-trigger sync if database is empty
    if (totalExisting === 0) {
      console.log('[Channels API] Database is empty. Triggering initial sync...');
      runSyncPipeline().catch(console.error);
    }

    // 2. Build MongoDB Filter Query
    const filter: any = {
      is_nsfw: false,
      'streams.0': { $exists: true }, // Ensure has at least one playable stream
    };

    if (verifiedOnly) {
      filter.is_verified = true;
    }

    if (favorites) {
      const favList = favorites.split(',').filter(Boolean);
      filter.id = { $in: favList };
    } else {
      if (category && category !== 'all') {
        filter.categories = category;
      }

      if (country && country !== 'ALL') {
        filter.country = country;
      }

      if (language) {
        filter.languages = language;
      }

      if (search) {
        // Multi-field case-insensitive regex for flexible matching
        const escaped = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
        const regex = new RegExp(escaped, 'i');
        filter.$or = [
          { name: { $regex: regex } },
          { alt_names: { $regex: regex } },
          { id: { $regex: regex } },
          { network: { $regex: regex } },
        ];
      }

      if (featured) {
        // Boost channels with logos and multiple streams for showcase
        filter.logo = { $exists: true, $ne: null };
      }
    }

    const skip = (page - 1) * limit;

    // Sorting: Prioritize Verified 24/7 working streams, then logos, then alphabetical
    const [channels, total] = await Promise.all([
      channelsCol
        .find(filter)
        .sort({ is_verified: -1, logo: -1, name: 1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      channelsCol.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    const result = {
      channels,
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    };

    // 3. Cache in Redis (TTL: 5 minutes)
    await setCachedJson(cacheKey, result, 300);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Channels API Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message, channels: [], total: 0 },
      { status: 500 }
    );
  }
}
