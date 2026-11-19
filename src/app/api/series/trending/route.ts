import { NextResponse } from 'next/server';
import { getTrendingSeries } from '@/lib/seriesService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const series = await getTrendingSeries(20);
    return NextResponse.json({ results: series });
  } catch (error: any) {
    return NextResponse.json({ results: [], error: error.message }, { status: 500 });
  }
}
