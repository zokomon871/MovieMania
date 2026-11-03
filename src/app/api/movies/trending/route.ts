import { NextResponse } from 'next/server';
import { getTrendingMovies } from '@/lib/tmdb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const movies = await getTrendingMovies();
    return NextResponse.json({ results: movies });
  } catch (error: any) {
    return NextResponse.json({ results: [], error: error.message }, { status: 500 });
  }
}

