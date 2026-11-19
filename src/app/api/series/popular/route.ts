import { NextRequest, NextResponse } from 'next/server';
import { getPopularSeries } from '@/lib/seriesService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page') || 1);
    const limit = Number(searchParams.get('limit') || 20);
    const series = await getPopularSeries(page, limit);
    return NextResponse.json({ results: series });
  } catch (error: any) {
    return NextResponse.json({ results: [], error: error.message }, { status: 500 });
  }
}
