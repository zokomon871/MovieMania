import { NextRequest, NextResponse } from 'next/server';
import { getPopularMovies } from '@/lib/tmdb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page') || 1);
    const movies = await getPopularMovies(page);
    return NextResponse.json({ results: movies });
  } catch (error: any) {
    return NextResponse.json({ results: [], error: error.message }, { status: 500 });
  }
}

