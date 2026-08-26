import { NextRequest, NextResponse } from 'next/server';
import { getCategoriesCollection, getChannelsCollection } from '@/lib/mongodb';
import { getCachedJson, setCachedJson } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const country = (searchParams.get('country') || '').trim().toUpperCase();

    const cacheKey = country && country !== 'ALL' ? `categories:country=${country}` : 'categories:all';
    const cached = await getCachedJson(cacheKey);
    if (cached) {
      return NextResponse.json({ categories: cached, fromCache: true });
    }

    const categoriesCol = await getCategoriesCollection();
    const allCategories = await categoriesCol.find({}).sort({ name: 1 }).toArray();

    let resultCategories;

    if (country && country !== 'ALL') {
      // Aggregate dynamic category counts for the selected country
      const channelsCol = await getChannelsCollection();
      const dynamicCounts = await channelsCol
        .aggregate([
          {
            $match: {
              country: { $in: [country, country.toLowerCase(), country.toUpperCase()] },
              is_nsfw: false,
              'streams.0': { $exists: true },
            },
          },
          { $unwind: '$categories' },
          {
            $group: {
              _id: '$categories',
              count: { $sum: 1 },
            },
          },
        ])
        .toArray();

      const countMap = new Map(dynamicCounts.map((d) => [d._id, d.count]));

      resultCategories = allCategories
        .map((cat) => ({
          id: cat.id,
          name: cat.name,
          count: countMap.get(cat.id) || 0,
        }))
        .filter((cat) => cat.count > 0) // only show categories that have channels in this country
        .sort((a, b) => b.count - a.count);
    } else {
      resultCategories = allCategories
        .filter((cat) => (cat.count || 0) > 0)
        .sort((a, b) => (b.count || 0) - (a.count || 0));
    }

    await setCachedJson(cacheKey, resultCategories, 1800); // 30 mins TTL

    return NextResponse.json({ categories: resultCategories });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message, categories: [] },
      { status: 500 }
    );
  }
}
