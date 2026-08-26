import { NextResponse } from 'next/server';
import { getCountriesCollection } from '@/lib/mongodb';
import { getCachedJson, setCachedJson } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cacheKey = 'countries:all';
    const cached = await getCachedJson(cacheKey);
    if (cached) {
      return NextResponse.json({ countries: cached, fromCache: true });
    }

    const countriesCol = await getCountriesCollection();
    const countries = await countriesCol
      .find({ count: { $gt: 0 } })
      .sort({ count: -1 })
      .toArray();

    await setCachedJson(cacheKey, countries, 3600); // 1 hour TTL

    return NextResponse.json({ countries });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message, countries: [] },
      { status: 500 }
    );
  }
}
