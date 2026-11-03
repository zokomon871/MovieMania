import { NextRequest, NextResponse } from 'next/server';
import { fetchCategoriesService } from '@/lib/channelService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get('country') || undefined;
    const categories = await fetchCategoriesService(country);
    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('[Categories API Error]:', error);
    return NextResponse.json({ categories: [], error: error.message }, { status: 500 });
  }
}

