import { NextResponse } from 'next/server';
import { fetchCountriesService } from '@/lib/channelService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const countries = await fetchCountriesService();
    return NextResponse.json({ countries });
  } catch (error: any) {
    console.error('[Countries API Error]:', error);
    return NextResponse.json({ countries: [], error: error.message }, { status: 500 });
  }
}

