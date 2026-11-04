import { NextRequest, NextResponse } from 'next/server';
import { searchMovies } from '@/lib/tmdb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';
    const genre = searchParams.get('genre') || '';
    const sortBy = searchParams.get('sortBy') || 'rating';
    const minRating = Number(searchParams.get('minRating') || 0);
    const page = Number(searchParams.get('page') || 1);

    const movies = await searchMovies(query, genre, sortBy, minRating, page);
    return NextResponse.json({ results: movies });
  } catch (error: any) {
    return NextResponse.json({ results: [], error: error.message }, { status: 500 });
  }
}
